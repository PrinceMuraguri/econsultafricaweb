import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { ProMode } from "@/lib/currency";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  sex: string | null;
  age_bracket: string | null;
  phone: string | null;
  country: string | null;
  occupation: string | null;
  interests: string[];
  voter_fingerprint: string | null;
  has_acknowledged_demo: boolean;
}

interface WalletData {
  balance_usd: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  wallet: WalletData | null;
  /** Pro mode: 'loading' until platform_config fetch resolves, then 'demo' (fail-closed) or 'live'. */
  proMode: ProMode;
  /** Demo wallet balance (Arena Coins) — null when logged out or not yet loaded. */
  demoBalance: number | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshProMode: () => Promise<void>;
  refreshDemoWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  wallet: null,
  proMode: "loading",
  demoBalance: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshWallet: async () => {},
  refreshProMode: async () => {},
  refreshDemoWallet: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [proMode, setProMode] = useState<ProMode>("loading");
  const [demoBalance, setDemoBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Track demo-wallet realtime subscription so we can tear it down on logout
  // and re-establish it on login (called out per Batch-2 review).
  const demoWalletChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(data as UserProfile | null);
    return data;
  };

  const fetchWallet = async (userId: string) => {
    const { data } = await supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", userId)
      .maybeSingle();
    setWallet(data as WalletData | null);
  };

  const fetchDemoWallet = async (userId: string) => {
    const { data } = await supabase
      .from("demo_wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    setDemoBalance(data ? Number((data as any).balance) : null);
  };

  const fetchProMode = async () => {
    const { data, error } = await supabase
      .from("platform_config")
      .select("pro_mode")
      .eq("id", 1)
      .maybeSingle();
    // Fail-closed: anything other than confirmed 'live' stays in demo.
    if (error || !data || data.pro_mode !== "live") {
      setProMode("demo");
    } else {
      setProMode("live");
    }
  };

  // Mount: load proMode + auth listener
  useEffect(() => {
    fetchProMode();

    // Realtime: pick up admin toggling pro_mode without a hard reload.
    const cfgChannel = supabase
      .channel("platform_config_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "platform_config" },
        () => fetchProMode()
      )
      .subscribe();

    // Belt-and-braces fallback if realtime drops in a backgrounded tab.
    const onFocus = () => fetchProMode();
    window.addEventListener("focus", onFocus);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const uid = currentSession.user.id;
          // Defer to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            await fetchProfile(uid);
            await fetchWallet(uid);
            await fetchDemoWallet(uid);
          }, 0);
        } else {
          setProfile(null);
          setWallet(null);
          setDemoBalance(null);
          // Tear down demo-wallet subscription on logout
          if (demoWalletChannelRef.current) {
            supabase.removeChannel(demoWalletChannelRef.current);
            demoWalletChannelRef.current = null;
          }
        }
        setLoading(false);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        const uid = existingSession.user.id;
        fetchProfile(uid);
        fetchWallet(uid);
        fetchDemoWallet(uid);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(cfgChannel);
      window.removeEventListener("focus", onFocus);
      if (demoWalletChannelRef.current) {
        supabase.removeChannel(demoWalletChannelRef.current);
        demoWalletChannelRef.current = null;
      }
    };
  }, []);

  // (Re-)establish demo-wallet realtime subscription whenever user changes.
  // Tears down on logout (handled in onAuthStateChange above) and on user switch.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`demo_wallet_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "demo_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = (payload.new as any)?.balance;
          if (typeof next === "number" || typeof next === "string") {
            setDemoBalance(Number(next));
          }
        }
      )
      .subscribe();

    demoWalletChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (demoWalletChannelRef.current === channel) {
        demoWalletChannelRef.current = null;
      }
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWallet(null);
    setDemoBalance(null);
    localStorage.removeItem("forecast_participant");
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };
  const refreshWallet = async () => { if (user) await fetchWallet(user.id); };
  const refreshProMode = async () => { await fetchProMode(); };
  const refreshDemoWallet = async () => { if (user) await fetchDemoWallet(user.id); };

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, wallet,
        proMode, demoBalance,
        loading,
        signOut,
        refreshProfile, refreshWallet,
        refreshProMode, refreshDemoWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

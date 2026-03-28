import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OrgSuggestion {
  name: string;
  domain: string;
  logo: string;
}

interface OrganizationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const OrganizationAutocomplete = ({ value, onChange, placeholder = "Start typing..." }: OrganizationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<OrgSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data: OrgSuggestion[] = await res.json();
        setSuggestions(data.slice(0, 6));
        setShowDropdown(data.length > 0);
      }
    } catch {
      // Silently fail — user can still type manually
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.domain}
              type="button"
              onClick={() => handleSelect(s.name)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors",
                "first:rounded-t-md last:rounded-b-md"
              )}
            >
              {s.logo && (
                <img
                  src={s.logo}
                  alt=""
                  className="w-5 h-5 rounded-sm object-contain flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <span className="truncate text-foreground">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationAutocomplete;

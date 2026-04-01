import Layout from "@/components/Layout";

const KenyaGenZ2026 = () => {
  return (
    <Layout>
      <div className="w-full" style={{ height: "calc(100vh - 64px)" }}>
        <iframe
          src="/reports/Kenya_GenZ_Economic_Outlook_2026.html"
          className="w-full h-full border-0"
          title="Kenya 2026 Economic Outlook — Gen Z Edition"
        />
      </div>
    </Layout>
  );
};

export default KenyaGenZ2026;

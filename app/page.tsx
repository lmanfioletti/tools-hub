"use client";

import Link from "next/link";
import { Wrench, FileBadge, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "50%", marginBottom: "1rem" }}>
          <Wrench size={48} color="#60a5fa" />
        </div>
        <h1 className="title-gradient" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>Tools Hub</h1>
        <p style={{ fontSize: "1.2rem", color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
          Sua central de ferramentas utilitárias. Acesse de forma rápida e gere arquivos com qualidade premium.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
        {/* Tool Card: Gerador de Crachás */}
        <Link href="/badge-generator" style={{ display: "block" }}>
          <div className="glass-panel" style={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: "column",
            transition: "transform 0.3s ease, border-color 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "var(--surface-border)";
          }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "rgba(59, 130, 246, 0.2)", padding: "0.75rem", borderRadius: "12px", color: "#60a5fa" }}>
                <FileBadge size={32} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Gerador de Crachás</h2>
            </div>
            <p style={{ color: "#94a3b8", marginBottom: "2rem", flexGrow: 1, lineHeight: "1.6" }}>
              Crie crachás profissionais em PDF para seus colaboradores. 
              Faça upload de planilhas Excel/CSV ou insira manualmente, tudo gerado localmente com alta qualidade.
            </p>
            <div style={{ display: "flex", alignItems: "center", color: "#60a5fa", fontWeight: "500", gap: "0.5rem" }}>
              Acessar ferramenta <ArrowRight size={18} />
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}

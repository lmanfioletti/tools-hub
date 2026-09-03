"use client";

import Link from "next/link";
import { Wrench, FileBadge, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem", color: "#202124" }}>
          Tools Hub
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#5f6368", maxWidth: 600, margin: "0 auto" }}>
          Bem-vindo à plataforma de ferramentas internas. Selecione um dos aplicativos abaixo para começar.
        </p>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
        {/* Tool Card: Gerador de Crachás */}
        <Link href="/badge-generator" style={{ display: "block" }}>
          <div className="material-panel" style={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: "column",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem", background: "rgba(26, 115, 232, 0.1)", borderRadius: "12px", color: "#1a73e8" }}>
                <FileBadge size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "#202124" }}>Gerador de Crachás</h2>
                <span style={{ fontSize: "0.875rem", color: "#1a73e8", fontWeight: 500 }}>Premium Tool</span>
              </div>
            </div>
            <p style={{ color: "#5f6368", lineHeight: 1.6, flexGrow: 1, marginBottom: "2rem" }}>
              Crie crachás corporativos em lote a partir de uma planilha. Editor visual drag-and-drop, exportação para PDF pronto para impressão com margens de segurança.
            </p>
            <div style={{ display: "flex", alignItems: "center", color: "#1a73e8", fontWeight: "500", gap: "0.5rem" }}>
              Acessar ferramenta <ArrowRight size={18} />
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}

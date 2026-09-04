"use client";

import Link from "next/link";
import { Wrench, FileBadge, ArrowRight, BookOpen } from "lucide-react";

export default function Home() {
  const enableBadgeGenerator = process.env.NEXT_PUBLIC_ENABLE_BADGE_GENERATOR !== 'false';
  const enableStudyPlatform = process.env.NEXT_PUBLIC_ENABLE_STUDY_PLATFORM !== 'false';

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem", color: "var(--foreground)" }}>
          Tools Hub
        </h1>
        <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto" }}>
          Bem-vindo à plataforma de ferramentas internas. Selecione um dos aplicativos abaixo para começar.
        </p>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
        {/* Tool Card: Gerador de Crachás */}
        {enableBadgeGenerator && (
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
              <div style={{ padding: "1rem", background: "var(--primary-transparent)", borderRadius: "12px", color: "var(--primary)" }}>
                <FileBadge size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--foreground)" }}>Gerador de Crachás</h2>
                <span style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 500 }}>Premium Tool</span>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, flexGrow: 1, marginBottom: "2rem" }}>
              Crie crachás corporativos em lote a partir de uma planilha. Editor visual drag-and-drop, exportação para PDF pronto para impressão com margens de segurança.
            </p>
            <div style={{ display: "flex", alignItems: "center", color: "var(--primary)", fontWeight: "500", gap: "0.5rem" }}>
              Acessar ferramenta <ArrowRight size={18} />
            </div>
            </div>
          </Link>
        )}

        {/* Tool Card: Estudos Transpetro */}
        {enableStudyPlatform && (
          <Link href="/estudos" style={{ display: "block" }}>
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
              <div style={{ padding: "1rem", background: "var(--success-transparent)", borderRadius: "12px", color: "var(--success)" }}>
                <BookOpen size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0, color: "var(--foreground)" }}>Plataforma de Estudos</h2>
                <span style={{ fontSize: "0.875rem", color: "var(--success)", fontWeight: 500 }}>Transpetro</span>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, flexGrow: 1, marginBottom: "2rem" }}>
              Área focada na preparação teórica e prática para o concurso da Transpetro. Acompanhe seu progresso e revise seus erros.
            </p>
            <div style={{ display: "flex", alignItems: "center", color: "var(--success)", fontWeight: "500", gap: "0.5rem" }}>
              Começar a estudar <ArrowRight size={18} />
            </div>
            </div>
          </Link>
        )}
      </section>
    </main>
  );
}

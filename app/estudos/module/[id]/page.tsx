import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export default async function ModulePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!dbUser) return redirect("/estudos");

  const mod = await prisma.module.findUnique({
    where: { id: params.id },
    include: {
      topics: {
        include: {
          progress: {
            where: { userId: dbUser.id }
          }
        }
      }
    }
  });

  if (!mod) return <div>Módulo não encontrado</div>;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/estudos" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", textDecoration: "none", marginBottom: "2rem", fontWeight: 500 }}>
        <ArrowLeft size={18} /> Voltar para Dashboard
      </Link>
      
      <header style={{ marginBottom: "3rem" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Módulo {mod.order}</span>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "0.5rem", marginBottom: "0.5rem" }}>{mod.title}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>{mod.description}</p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {mod.topics.map(topic => {
          const isCompleted = topic.progress[0]?.isCompleted;
          
          return (
            <Link href={`/estudos/module/${mod.id}/topic/${topic.id}`} key={topic.id} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1.5rem", background: "var(--surface)", border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius)", transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {isCompleted ? (
                    <CheckCircle2 size={24} color="var(--success)" />
                  ) : (
                    <Circle size={24} color="var(--text-hint)" />
                  )}
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500, color: isCompleted ? "var(--text-secondary)" : "var(--foreground)" }}>
                    {topic.title}
                  </h3>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 500 }}>
                  Estudar Tópico &rarr;
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";
import prisma from "../lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { BookOpen, AlertCircle, LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";

export default async function EstudosDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  // Obter ou criar usuário no banco baseado no NextAuth
  let dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name,
      }
    });
  }

  // Buscar módulos e calcular progresso (tópicos concluídos vs totais)
  const modules = await prisma.module.findMany({
    orderBy: { order: 'asc' },
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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Plataforma de Estudos</h1>
        <p className={styles.headerDesc}>
          Preparação Focada: Edital Transpetro (Análise de Sistemas - Processos de Negócios)
        </p>
      </header>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
        <Link href="/estudos/revisao" style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "var(--danger-transparent)", color: "var(--danger)",
          padding: "0.5rem 1rem", borderRadius: "var(--radius)", fontWeight: 500,
          textDecoration: "none"
        }}>
          <AlertCircle size={18} />
          Minha Aba de Revisão (Erros)
        </Link>
      </div>

      <div className={styles.grid}>
        {modules.map((mod) => {
          const totalTopics = mod.topics.length;
          const completedTopics = mod.topics.filter(t => t.progress[0]?.isCompleted).length;
          const progressPercent = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

          return (
            <Link href={`/estudos/module/${mod.id}`} key={mod.id} style={{ textDecoration: "none" }}>
              <div className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Módulo {mod.order}
                    </span>
                    <h2 className={styles.moduleTitle}>{mod.title}</h2>
                  </div>
                  <BookOpen size={24} color="var(--primary)" style={{ opacity: 0.8 }} />
                </div>
                <p className={styles.moduleDesc}>{mod.description}</p>
                
                <div className={styles.progressWrapper}>
                  <div className={styles.progressLabel}>
                    <span>Progresso</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "right" }}>
                    {completedTopics} de {totalTopics} tópicos concluídos
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

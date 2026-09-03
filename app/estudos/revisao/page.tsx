import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import prisma from "../../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";

export default async function RevisaoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!dbUser) return redirect("/estudos");

  // Buscar questões em que o usuário errou
  // Para simplificar, buscamos as UserAnswers = false, incluímos a Questão
  const wrongAnswers = await prisma.userAnswer.findMany({
    where: {
      userId: dbUser.id,
      isCorrect: false
    },
    include: {
      question: {
        include: {
          topic: {
            include: { module: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filtrar apenas questões únicas (caso ele tenha errado a mesma várias vezes)
  const uniqueQuestionsMap = new Map();
  for (const answer of wrongAnswers) {
    if (!uniqueQuestionsMap.has(answer.questionId)) {
      uniqueQuestionsMap.set(answer.questionId, answer.question);
    }
  }
  const questionsToReview = Array.from(uniqueQuestionsMap.values());

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem" }}>
      <Link href="/estudos" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", textDecoration: "none", marginBottom: "2rem", fontWeight: 500 }}>
        <ArrowLeft size={18} /> Voltar para Dashboard
      </Link>
      
      <header style={{ marginBottom: "3rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ padding: "1rem", background: "var(--danger-transparent)", borderRadius: "12px", color: "var(--danger)" }}>
          <XCircle size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Meus Erros</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "0.25rem" }}>
            Revisão inteligente baseada nas suas tentativas.
          </p>
        </div>
      </header>

      {questionsToReview.length === 0 ? (
        <div className="material-panel" style={{ padding: "4rem", textAlign: "center" }}>
          <h2>Nenhum erro registrado! 🎉</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>Continue resolvendo as baterias de questões nos módulos.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {questionsToReview.map(q => {
            const options = JSON.parse(q.options as string) as { id: string, text: string }[];
            const correctOpt = options.find(o => o.id === q.correctAnswer);

            return (
              <div key={q.id} className="material-panel" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Módulo {q.topic.module.order} - {q.topic.title}
                  </span>
                </div>
                <p style={{ fontSize: "1.05rem", color: "var(--foreground)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  {q.text}
                </p>
                <div style={{ background: "var(--success-transparent)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--success)" }}>
                  <span style={{ display: "block", fontSize: "0.85rem", color: "var(--success)", fontWeight: 700, marginBottom: "0.25rem" }}>RESPOSTA CORRETA:</span>
                  <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{correctOpt?.id}. {correctOpt?.text}</span>
                </div>
                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                   <Link href={`/estudos/module/${q.topic.moduleId}/topic/${q.topicId}`} className="btn" style={{ background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}>
                     Revisar Teoria
                   </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

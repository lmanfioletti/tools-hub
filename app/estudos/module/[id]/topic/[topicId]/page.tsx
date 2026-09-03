import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../api/auth/[...nextauth]/route";
import prisma from "../../../../../lib/prisma";
import { redirect } from "next/navigation";
import { StudyClient } from "../../../../../components/StudyClient";

export default async function TopicPage({ params }: { params: { id: string, topicId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  
  if (!dbUser) return redirect("/estudos");

  const topic = await prisma.topic.findUnique({
    where: { id: params.topicId },
    include: {
      questions: true,
      progress: {
        where: { userId: dbUser.id }
      }
    }
  });

  if (!topic || topic.moduleId !== params.id) {
    return <div>Tópico não encontrado</div>;
  }

  const initialCompleted = topic.progress.length > 0 ? topic.progress[0].isCompleted : false;

  return (
    <main style={{ padding: "3rem 2rem", background: "var(--background)", minHeight: "calc(100vh - 65px)" }}>
      <StudyClient
        topicId={topic.id}
        moduleId={params.id}
        title={topic.title}
        content={topic.content}
        initialCompleted={initialCompleted}
        questions={topic.questions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.options as string,
          correctAnswer: q.correctAnswer,
          source: q.source,
        }))}
      />
    </main>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Question = {
  id: string;
  text: string;
  options: string;
  correctAnswer: string;
  source: string | null;
};

type Props = {
  topicId: string;
  moduleId: string;
  title: string;
  content: string;
  initialCompleted: boolean;
  questions: Question[];
};

export function StudyClient({ topicId, moduleId, title, content, initialCompleted, questions }: Props) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const toggleProgress = async () => {
    const newState = !isCompleted;
    setIsCompleted(newState);
    await fetch("/api/study/progress", {
      method: "POST",
      body: JSON.stringify({ topicId, isCompleted: newState })
    });
  };

  const handleAnswer = async (optionId: string) => {
    if (selectedAnswer) return; // Prevent double click
    
    setSelectedAnswer(optionId);
    const correct = optionId === questions[currentQuestionIndex].correctAnswer;
    setIsAnswerCorrect(correct);

    await fetch("/api/study/questions", {
      method: "POST",
      body: JSON.stringify({ questionId: questions[currentQuestionIndex].id, isCorrect: correct })
    });
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  if (showQuiz) {
    if (questions.length === 0) {
      return (
        <div className="material-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>Nenhuma questão cadastrada</h2>
          <button onClick={() => setShowQuiz(false)} className="btn" style={{ marginTop: "1rem" }}>Voltar para Teoria</button>
        </div>
      );
    }

    if (currentQuestionIndex >= questions.length) {
      return (
        <div className="material-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>Bateria Concluída!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>As suas respostas foram gravadas na sua aba de revisão.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => setShowQuiz(false)} className="btn" style={{ background: "transparent", color: "var(--foreground)", border: "1px solid var(--surface-border)" }}>Voltar para Teoria</button>
            <Link href={`/estudos/module/${moduleId}`} className="btn">Ver Módulo</Link>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentQuestionIndex];
    const options = JSON.parse(currentQ.options) as { id: string, text: string }[];

    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button onClick={() => setShowQuiz(false)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", marginBottom: "2rem", fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Voltar para Teoria
        </button>

        <div className="material-panel" style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Questão {currentQuestionIndex + 1} de {questions.length}</span>
            {currentQ.source && <span style={{ fontSize: "0.85rem", color: "var(--primary)", background: "var(--primary-transparent)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Banca: {currentQ.source}</span>}
          </div>

          <p style={{ fontSize: "1.1rem", color: "var(--foreground)", marginBottom: "2rem", lineHeight: 1.6 }}>
            {currentQ.text}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {options.map(opt => {
              let bg = "var(--surface)";
              let border = "1px solid var(--surface-border)";
              let color = "var(--foreground)";

              if (selectedAnswer) {
                if (opt.id === currentQ.correctAnswer) {
                  bg = "var(--success-transparent)";
                  border = "1px solid var(--success)";
                  color = "var(--success)";
                } else if (opt.id === selectedAnswer && selectedAnswer !== currentQ.correctAnswer) {
                  bg = "var(--danger-transparent)";
                  border = "1px solid var(--danger)";
                  color = "var(--danger)";
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={!!selectedAnswer}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem", borderRadius: "var(--radius)", background: bg, border, color,
                    textAlign: "left", cursor: selectedAnswer ? "default" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontWeight: 600, width: "24px" }}>{opt.id}.</span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={nextQuestion} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Próxima Questão <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Visualização Teórica
  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", maxWidth: 1000, margin: "0 auto" }}>
      <div className="material-panel" style={{ flexGrow: 1, padding: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "2rem" }}>{title}</h1>
        
        <div style={{ color: "var(--foreground)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {content}
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--surface-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={toggleProgress} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: isCompleted ? "var(--success)" : "var(--text-secondary)", cursor: "pointer", fontSize: "1rem", fontWeight: 500 }}>
            {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            {isCompleted ? "Tópico Concluído" : "Marcar como Concluído"}
          </button>

          <button onClick={() => setShowQuiz(true)} className="btn">
            Iniciar Questões
          </button>
        </div>
      </div>
    </div>
  );
}

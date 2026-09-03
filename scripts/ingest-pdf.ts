import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import pdfParse from 'pdf-parse';
import * as dotenv from 'dotenv';

// Carrega as variáveis do .env.local caso rode fora do Next
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("ERRO: GEMINI_API_KEY não encontrada no .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Usando o modelo Pro, que tem uma janela de contexto gigante (ideal para PDFs grandes) e melhor raciocínio
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const PDFS_DIR = path.join(process.cwd(), 'pdfs');

async function processPDF(filePath: string, filename: string) {
  console.log(`\n📄 Lendo PDF: ${filename}...`);
  const dataBuffer = fs.readFileSync(filePath);
  
  const pdfData = await pdfParse(dataBuffer);
  const pdfText = pdfData.text;

  console.log(`🧠 Texto extraído (${pdfText.length} caracteres). Enviando para o Gemini...`);

  const prompt = `
Você é um Especialista de TI e Engenheiro de Software Sênior montando uma plataforma de estudos (foco Concurso Transpetro / Cesgranrio).
Abaixo está o conteúdo extraído de um arquivo PDF (uma prova antiga, edital ou apostila).

Sua tarefa:
1. Analise o texto do PDF para extrair as questões de múltipla escolha contidas nele.
2. Identifique o TEMA CENTRAL (Tópico) que engloba a maior parte do conteúdo deste PDF.
3. Gere um RESUMO TEÓRICO EXTENSO E APROFUNDADO em Markdown sobre esse tema central. Você DEVE usar o seu próprio conhecimento vasto de tecnologia e engenharia de software para complementar a teoria, não se limitando apenas ao texto do PDF. O resumo deve ser focado em preparar um candidato para nível superior.
4. Identifique as questões e as formate corretamente. Descubra ou deduza a resposta correta de acordo com seu conhecimento se não houver gabarito explicito.

Você deve retornar EXCLUSIVAMENTE um objeto JSON válido e minificado, sem blocos de código (sem \`\`\`json).
Formato obrigatório:
{
  "moduleTitle": "Nome da Área de Conhecimento (ex: Engenharia de Software)",
  "moduleDescription": "Breve descrição do módulo",
  "topicTitle": "Título da Aula/Tópico (ex: Ciclo de Vida de Software)",
  "theoryContent": "Resumo extenso em Markdown (use #, ##, bullets, etc)",
  "questions": [
    {
      "text": "Enunciado completo da questão",
      "options": [
        { "id": "A", "text": "texto da alternativa" },
        { "id": "B", "text": "texto da alternativa" },
        { "id": "C", "text": "texto da alternativa" },
        { "id": "D", "text": "texto da alternativa" },
        { "id": "E", "text": "texto da alternativa" }
      ],
      "correctAnswer": "A" (A, B, C, D ou E)
    }
  ]
}

Apenas JSON válido na saída!

TEXTO DO PDF:
---
${pdfText}
---
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2, // Baixa temperatura para manter a estrutura JSON determinística
      }
    });

    let textResponse = result.response.text();
    // Limpar marcações de markdown se o modelo ainda as retornar
    textResponse = textResponse.replace(/^```json/g, '').replace(/```$/g, '').trim();

    const data = JSON.parse(textResponse);

    console.log(`✅ JSON gerado pelo Gemini! Salvando no Banco de Dados...`);

    // 1. Achar ou Criar o Módulo
    let mod = await prisma.module.findFirst({ where: { title: data.moduleTitle } });
    if (!mod) {
      mod = await prisma.module.create({
        data: {
          title: data.moduleTitle,
          description: data.moduleDescription,
          order: 99, // Módulos importados vão para o fim por padrão
        }
      });
    }

    // 2. Criar o Tópico (com a teoria gerada pela IA)
    const topic = await prisma.topic.create({
      data: {
        title: data.topicTitle + ` (Extraído: ${filename})`,
        content: data.theoryContent,
        moduleId: mod.id,
      }
    });

    // 3. Inserir as Questões
    for (const q of data.questions) {
      await prisma.question.create({
        data: {
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          source: `Gemini Ingestion - ${filename}`,
          topicId: topic.id,
        }
      });
    }

    console.log(`🎉 Sucesso! Módulo: "${mod.title}" | Tópico: "${topic.title}" | ${data.questions.length} questões inseridas.`);

  } catch (error) {
    console.error(`❌ Erro ao processar o arquivo ${filename}:`, error);
  }
}

async function run() {
  console.log("Iniciando Pipeline de Ingestão com Gemini AI 🚀");

  if (!fs.existsSync(PDFS_DIR)) {
    console.error(`A pasta ${PDFS_DIR} não existe. Crie a pasta e coloque seus PDFs lá.`);
    process.exit(1);
  }

  const files = fs.readdirSync(PDFS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log("Nenhum PDF encontrado na pasta 'pdfs/'.");
    process.exit(0);
  }

  for (const file of files) {
    await processPDF(path.join(PDFS_DIR, file), file);
  }

  console.log("\n✅ Pipeline finalizado!");
  await prisma.$disconnect();
}

run();

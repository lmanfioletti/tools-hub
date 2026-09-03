import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Delete all data first
  await prisma.userAnswer.deleteMany()
  await prisma.userProgress.deleteMany()
  await prisma.question.deleteMany()
  await prisma.topic.deleteMany()
  await prisma.module.deleteMany()
  await prisma.user.deleteMany()

  // Module 1: Arquitetura e Modelagem
  const mod1 = await prisma.module.create({
    data: {
      title: 'Arquitetura e Modelagem de Dados',
      description: 'SQL, NoSQL, ETL, Data Lakes e arquiteturas corporativas.',
      order: 1,
    }
  })

  const t1 = await prisma.topic.create({
    data: {
      title: 'Conceitos de Bancos Relacionais e SQL',
      content: '# Introdução a Bancos Relacionais\n\nBancos de dados relacionais organizam dados em tabelas (linhas e colunas). O SQL (Structured Query Language) é a linguagem padrão.\n\n## Principais Comandos\n- **DDL**: CREATE, ALTER, DROP\n- **DML**: SELECT, INSERT, UPDATE, DELETE\n- **DCL**: GRANT, REVOKE\n\nA Cesgranrio costuma cobrar joins e subqueries.',
      moduleId: mod1.id
    }
  })

  await prisma.question.create({
    data: {
      text: 'No modelo relacional, a restrição de integridade referencial garante que:',
      options: JSON.stringify([
        { id: 'A', text: 'Cada tabela tenha apenas uma chave primária.' },
        { id: 'B', text: 'Valores em uma chave estrangeira correspondam a uma chave primária existente ou sejam nulos.' },
        { id: 'C', text: 'Nenhuma coluna de chave primária contenha valores nulos.' },
        { id: 'D', text: 'Os dados sejam normalizados até a terceira forma normal.' },
        { id: 'E', text: 'O uso de índices otimize as consultas SQL.' }
      ]),
      correctAnswer: 'B',
      source: 'Cesgranrio Adaptada',
      topicId: t1.id
    }
  })

  // Module 2: Gestão e Governança
  const mod2 = await prisma.module.create({
    data: {
      title: 'Gestão e Governança de TI',
      description: 'ITIL, COBIT, LGPD e governança corporativa.',
      order: 2,
    }
  })

  const t2 = await prisma.topic.create({
    data: {
      title: 'Framework ITIL v4',
      content: '# ITIL v4\n\nFocado no Sistema de Valor de Serviço (SVS) e na co-criação de valor.\n\n## Práticas Fundamentais\n- **Central de Serviços**: Ponto único de contato (SPOC).\n- **Gerenciamento de Incidentes**: Restaurar a operação normal o mais rápido possível.\n- **Gerenciamento de Problemas**: Identificar a causa raiz de um ou mais incidentes.',
      moduleId: mod2.id
    }
  })

  await prisma.question.create({
    data: {
      text: 'Segundo as práticas do ITIL 4, qual é o principal objetivo da prática de Gerenciamento de Incidentes?',
      options: JSON.stringify([
        { id: 'A', text: 'Investigar e identificar a causa raiz das falhas.' },
        { id: 'B', text: 'Restaurar a operação normal do serviço o mais rapidamente possível.' },
        { id: 'C', text: 'Fornecer uma interface clara para todas as solicitações dos usuários.' },
        { id: 'D', text: 'Gerenciar o ciclo de vida de todas as mudanças de TI.' },
        { id: 'E', text: 'Garantir que os serviços atinjam as metas de nível de serviço (SLA) anuais.' }
      ]),
      correctAnswer: 'B',
      source: 'Cesgranrio Adaptada',
      topicId: t2.id
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

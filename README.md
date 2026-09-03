# Gerador de Crachás Corporativos

Um sistema web completo para geração e edição visual de crachás em formato PDF, pronto para impressão gráfica. Desenvolvido com **Next.js**, **React** e **pdf-lib**.

## 🎨 Funcionalidades

- **Editor Visual Drag-and-Drop:** Monte o template do crachá visualmente arrastando elementos (foto, nome, cargo, logo, etc.) pelo navegador.
- **Margem de Segurança:** Exibição nativa das margens e sangria (bleed) para garantir a integridade do corte na impressão (padrão 5,9x9,1 cm).
- **Importação em Massa:** Faça o upload de planilhas Excel (`.xlsx`, `.csv`) contendo a lista completa de funcionários.
- **Geração de PDFs (Zip):** Gera um arquivo ZIP contendo um PDF (frente e verso) com qualidade de impressão para cada funcionário.
- **Fontes Embutidas:** Suporte nativo à família de fontes **Calibri** (via Carlito) com embutimento direto no PDF para garantir métricas precisas.
- **Corte de Imagens Circular:** Sistema inteligente que recorta automaticamente as fotos de perfil em formato circular para o crachá.

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+ recomendado)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/badge-generator.git
cd badge-generator
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador: [http://localhost:3000/badge-generator](http://localhost:3000/badge-generator)

## 🗂️ Estrutura do Projeto

- `app/badge-generator/page.tsx`: Lógica principal em três etapas (Recursos, Template, Funcionários).
- `app/badge-generator/TemplateEditor.tsx`: O editor visual onde os elementos do crachá podem ser redimensionados e arrastados.
- `app/lib/pdfGenerator.ts`: Engine responsável por transformar as coordenadas da tela (X/Y %) em pontos (`pt`) absolutos e desenhar o PDF nativamente no client-side usando `pdf-lib`.
- `app/lib/types.ts`: Tipagens do TypeScript e configurações padrão do template.
- `public/fonts/`: Fontes Open-Source utilizadas para a renderização de textos.

## 🛠️ Stack Tecnológico
- [Next.js (App Router)](https://nextjs.org/)
- [React](https://reactjs.org/)
- [pdf-lib](https://pdf-lib.js.org/) - Manipulação e desenho de PDF.
- [Lucide React](https://lucide.dev/) - Ícones.
- [XLSX](https://sheetjs.com/) - Processamento e importação de planilhas.
- CSS Modules Vanilla para estilos dinâmicos e fluidos.

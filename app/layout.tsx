import "./globals.css";

export const metadata = {
  title: "Tools Hub | Central de Ferramentas",
  description: "Plataforma premium para ferramentas internas e utilitários",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

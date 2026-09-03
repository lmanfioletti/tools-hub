import "./globals.css";
import { NextAuthProvider } from "./components/NextAuthProvider";
import { Navbar } from "./components/Navbar";

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
      <body>
        <NextAuthProvider>
          <Navbar />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}

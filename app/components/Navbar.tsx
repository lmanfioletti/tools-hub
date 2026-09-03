"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, LogIn, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      padding: "0.75rem 2rem", 
      background: "var(--surface)", 
      borderBottom: "1px solid var(--surface-border)", 
      alignItems: "center" 
    }}>
      <Link href="/" style={{ fontSize: "1.375rem", fontFamily: "'Open Sans', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <span style={{fontWeight: 500, color: "var(--foreground)"}}>Tools</span>
        <span style={{color: "var(--text-secondary)"}}>Hub</span>
      </Link>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: "transparent", border: "none", color: "var(--text-secondary)", 
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0.5rem", borderRadius: "50%"
          }}
          title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              Olá, {session.user?.name?.split(" ")[0]}
            </span>
            {session.user?.image && (
              <img src={session.user.image} alt="Perfil" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--surface-border)" }} />
            )}
            <button 
              onClick={() => signOut()} 
              style={{ 
                display: "flex", alignItems: "center", gap: "0.5rem", 
                background: "transparent", color: "var(--text-secondary)", 
                border: "1px solid var(--surface-border)", 
                padding: "0.4rem 1rem", borderRadius: "4px", cursor: "pointer",
                fontWeight: 500, fontSize: "0.875rem"
              }}
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signIn("google")} 
            style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem", 
              background: "var(--primary)", color: "#ffffff", 
              border: "none", 
              padding: "0.5rem 1.25rem", borderRadius: "4px", cursor: "pointer",
              fontWeight: 500, fontSize: "0.875rem"
            }}
          >
            <LogIn size={16} /> Entrar
          </button>
        )}
      </div>
    </nav>
  );
}

"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, LogIn } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      padding: "0.75rem 2rem", 
      background: "#ffffff", 
      borderBottom: "1px solid #dadce0", 
      alignItems: "center" 
    }}>
      <Link href="/" style={{ fontSize: "1.375rem", fontFamily: "'Open Sans', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <span style={{fontWeight: 500, color: "#202124"}}>Tools</span>
        <span style={{color: "#5f6368"}}>Hub</span>
      </Link>
      
      <div>
        {session ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#3c4043", fontWeight: 500 }}>
              Olá, {session.user?.name?.split(" ")[0]}
            </span>
            {session.user?.image && (
              <img src={session.user.image} alt="Perfil" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #dadce0" }} />
            )}
            <button 
              onClick={() => signOut()} 
              style={{ 
                display: "flex", alignItems: "center", gap: "0.5rem", 
                background: "transparent", color: "#5f6368", 
                border: "1px solid #dadce0", 
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
              background: "#1a73e8", color: "#ffffff", 
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

import { NotebookPen } from "lucide-react";
import { signIn, signUp } from "./actions";

export default function Login({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <div className="auth">
      <div className="auth-box">
        <div className="brand" style={{ padding: 0, marginBottom: 6 }}><span className="mark"><NotebookPen size={17} /></span>myNotebook</div>
        <h1 style={{ fontSize: 26, margin: "14px 0 4px" }}>Ton cahier numérique</h1>
        <p className="mu" style={{ margin: "0 0 18px" }}>Connecte-toi pour retrouver tes notes, tes ressources et tes rappels.</p>
        <form className="stack">
          <input name="email" type="email" placeholder="Adresse e-mail" required autoComplete="email" />
          <input name="password" type="password" placeholder="Mot de passe (8 caractères minimum)" required autoComplete="current-password" />
          {searchParams.error && <div className="err">{searchParams.error}</div>}
          {searchParams.message && <div className="ok">{searchParams.message}</div>}
          <button formAction={signIn} style={{ justifyContent: "center" }}>Se connecter</button>
          <button formAction={signUp} className="ghost" style={{ justifyContent: "center" }}>Créer un compte</button>
        </form>
      </div>
    </div>
  );
}

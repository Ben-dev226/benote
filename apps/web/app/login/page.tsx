import { BookOpen } from "lucide-react";
import { signIn, signUp } from "./actions";

export default function Login({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <div className="auth">
      <div className="auth-box">
        <div className="brand" style={{ justifyContent: "center", paddingBottom: 6 }}><span className="logo"><BookOpen size={19} /></span><span>myNotebook</span></div>
        <p className="mu" style={{ textAlign: "center", margin: "0 0 18px" }}>Apprendre • Organiser • Réussir</p>
        <form className="card stack">
          <input name="email" type="email" placeholder="Adresse e-mail" required autoComplete="email" />
          <input name="password" type="password" placeholder="Mot de passe (8 caractères min.)" required autoComplete="current-password" />
          {searchParams.error && <div className="err">{searchParams.error}</div>}
          {searchParams.message && <div className="ok">{searchParams.message}</div>}
          <button formAction={signIn} style={{ justifyContent: "center" }}>Se connecter</button>
          <button formAction={signUp} className="ghost" style={{ justifyContent: "center" }}>Créer un compte</button>
        </form>
      </div>
    </div>
  );
}

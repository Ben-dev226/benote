import { signIn, signUp } from "./actions";

export default function Login({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <main style={{ maxWidth: 400 }}>
      <h1>📖 myNotebook</h1>
      <p className="mu">Apprendre • Organiser • Réussir</p>
      <form className="card stack">
        <input name="email" type="email" placeholder="Adresse e-mail" required autoComplete="email" />
        <input name="password" type="password" placeholder="Mot de passe" required autoComplete="current-password" />
        {searchParams.error && <div className="err">{searchParams.error}</div>}
        {searchParams.message && <div className="ok">{searchParams.message}</div>}
        <div className="row">
          <button formAction={signIn}>Se connecter</button>
          <button formAction={signUp} className="ghost">Créer un compte</button>
        </div>
      </form>
    </main>
  );
}

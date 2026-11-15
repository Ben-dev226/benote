import { requireUser } from "@/lib/auth";
import { driveInfo } from "@/lib/google";
import { syncDrive, updateSettings } from "./actions";

const MSG: Record<string, string> = {
  ok: "Google Drive connecté ✓", off: "Google Drive déconnecté.", error: "La connexion à Google a échoué.", config: "Google n’est pas configuré sur ce serveur.",
  norefresh: "Google n’a pas fourni d’autorisation durable. Révoque l’accès de myNotebook sur myaccount.google.com puis réessaie.",
};

export default async function Settings({ searchParams }: { searchParams: { google?: string; sync?: string } }) {
  const { supabase, user } = await requireUser();
  const [{ data: st }, drive] = await Promise.all([supabase.from("user_settings").select("theme,ai_enabled").maybeSingle(), driveInfo(user.id)]);
  return (
    <>
      <div className="page-h"><div><h1>Paramètres</h1><p>Apparence, assistant IA, Google Drive et compte.</p></div></div>
      <div className="grid">
        <form action={updateSettings} className="card stack">
          <h2>Apparence et IA</h2>
          <label><input type="radio" name="theme" value="dark" defaultChecked={st?.theme !== "light"} style={{ width: "auto" }} /> Thème sombre</label>
          <label><input type="radio" name="theme" value="light" defaultChecked={st?.theme === "light"} style={{ width: "auto" }} /> Thème clair</label>
          <label><input type="checkbox" name="ai_enabled" defaultChecked={!!st?.ai_enabled} style={{ width: "auto" }} /> Activer l’assistant IA (facultatif)</label>
          <button>Enregistrer</button>
        </form>
        <div className="card stack">
          <h2>Google Drive</h2>
          {searchParams.google && <div className={searchParams.google === "ok" ? "ok" : "err"}>{MSG[searchParams.google]}</div>}
          {drive.status === "config" && <span className="mu">Le serveur n’a pas encore les clés Google (voir README).</span>}
          {drive.status === "off" && <a className="btn" href="/api/google/connect">Connecter mon Google Drive</a>}
          {drive.status === "ok" && (<>
            <span className="ok">Connecté {drive.email ? `(${drive.email})` : ""}</span>
            <form action={syncDrive}><button className="ghost">Vérifier les fichiers (supprimés / déplacés)</button></form>
            {searchParams.sync && searchParams.sync !== "error" && <span className="mu">{searchParams.sync === "0" ? "Tous les fichiers sont présents." : `${searchParams.sync} fichier(s) absent(s) de Drive.`}</span>}
            <form action="/api/google/disconnect" method="post"><button className="danger">Déconnecter et révoquer l’accès</button></form>
          </>)}
          <span className="mu">myNotebook n’accède qu’aux fichiers qu’il crée dans le dossier « myNotebook ».</span>
        </div>
        <div className="card stack"><h2>Compte</h2><span className="mu">{user.email}</span>
          <form action="/auth/signout" method="post"><button className="ghost">Déconnexion</button></form></div>
      </div>
    </>
  );
}

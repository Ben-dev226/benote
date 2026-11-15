# Guide d'installation (sans être développeur)

## 1. Supabase (base de données + connexion)
1. Crée un compte sur supabase.com → New project (offre gratuite).
2. Menu **SQL Editor** → colle le contenu de `database/migrations/0001_init.sql` → Run. Puis fais pareil avec `0002_hardening.sql`.
3. **Project Settings → API** : note `Project URL`, `anon public key` et `service_role key` (cette dernière est SECRÈTE).
4. **Authentication → URL Configuration** : Site URL = l'adresse de ton site ; Redirect URLs = `<adresse>/auth/callback`.

## 2. Google Drive
1. console.cloud.google.com → nouveau projet → **APIs & Services → Library** → active « Google Drive API ».
2. **OAuth consent screen** : type External, ajoute ton e-mail comme utilisateur test.
3. **Credentials → Create → OAuth client ID** (Web application). Redirect URI autorisée : `<adresse du site>/api/google/callback` (une pour `http://localhost:3000`, une pour ton domaine Vercel).
4. Note `Client ID` et `Client secret`.
5. Clé de chiffrement : dans un terminal, `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## 3. Variables d'environnement
Copie `apps/web/.env.example` vers `apps/web/.env.local` (en local) ou ajoute les mêmes variables dans Vercel. IA : mets au moins une clé gratuite (console.groq.com, aistudio.google.com ou openrouter.ai) — sinon l'assistant reste simplement désactivé.

## 4. Lancer en local
`cd apps/web && npm install && npm run dev` → http://localhost:3000

## 5. Mettre en ligne (Vercel)
Pousse le dossier sur GitHub → vercel.com → Import → **Root Directory = `apps/web`** → ajoute les variables → Deploy. Mets l'adresse Vercel dans `NEXT_PUBLIC_SITE_URL`, dans les Redirect URLs Supabase et dans les Redirect URIs Google.

import { createClient } from "@supabase/supabase-js";

// Clé service_role : SERVEUR UNIQUEMENT (jamais importée dans un composant client)
export function createAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

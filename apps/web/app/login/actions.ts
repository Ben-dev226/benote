"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function creds(formData: FormData) {
  return { email: String(formData.get("email") ?? "").trim(), password: String(formData.get("password") ?? "") };
}

export async function signIn(formData: FormData) {
  const { email, password } = creds(formData);
  const { error } = await createClient().auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const { email, password } = creds(formData);
  if (password.length < 8) redirect(`/login?error=${encodeURIComponent("Mot de passe : 8 caractères minimum.")}`);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: `${site}/auth/callback` } });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?message=${encodeURIComponent("Compte créé. Vérifie ta boîte mail pour confirmer.")}`);
}

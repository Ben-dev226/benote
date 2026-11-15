import type { SupabaseClient } from "@supabase/supabase-js";

export async function logActivity(
  supabase: SupabaseClient, userId: string, action: string, entityType: string,
  entityId: string | null | undefined, meta: Record<string, unknown> = {}, spaceId?: string | null,
) {
  await supabase.from("activity_logs").insert({
    user_id: userId, action, entity_type: entityType, entity_id: entityId ?? null, meta, space_id: spaceId ?? null,
  });
}
export const ACTIVITY_LABEL: Record<string, string> = {
  space_created: "Apprentissage créé", note_created: "Note créée", resource_added: "Ressource ajoutée",
  resource_read: "Lecture commencée", reminder_created: "Rappel créé",
};

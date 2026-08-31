import { supabase } from "@/lib/supabase";
import type { Attack } from "@/lib/types";

export async function fetchAttacks(): Promise<Attack[]> {
  const { data, error } = await supabase
    .from("promptg_attacks_library")
    .select("id, category, title, description, payload")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar a biblioteca de ataques: ${error.message}`);
  }

  return (data ?? []) as Attack[];
}
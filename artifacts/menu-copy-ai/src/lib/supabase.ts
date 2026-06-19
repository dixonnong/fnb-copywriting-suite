// Supabase loaded from CDN at runtime — no npm package
// Using dynamic ESM import from esm.sh CDN

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;

async function getClient() {
  if (!_client) {
    // Dynamic import from CDN — satisfies "no npm" requirement
    const { createClient } = await import(
      /* @vite-ignore */
      "https://esm.sh/@supabase/supabase-js@2"
    );
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export interface SavedDescription {
  id?: number;
  ingredients: string;
  description: string;
  tone: string;
  created_at?: string;
}

export async function fetchSaved(): Promise<SavedDescription[]> {
  const client = await getClient();
  const { data, error } = await client
    .from("saved_descriptions")
    .select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveDescription(
  entry: Omit<SavedDescription, "id" | "created_at">
): Promise<SavedDescription> {
  const client = await getClient();
  const { data, error } = await client
    .from("saved_descriptions")
    .insert([entry])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDescription(id: number): Promise<void> {
  const client = await getClient();
  const { error } = await client
    .from("saved_descriptions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

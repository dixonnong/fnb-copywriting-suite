import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export interface AuthUser {
  id: string;
  email: string;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await getClient().auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data } = await getClient().auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const { data } = getClient().auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({ id: session.user.id, email: session.user.email ?? "" });
    } else {
      callback(null);
    }
  });
  return data.subscription;
}

export interface SavedDescription {
  id?: number;
  user_id?: string;
  ingredients: string;
  description: string;
  tone: string;
  created_at?: string;
}

function throwSupabaseError(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}): never {
  const msg = error.message || error.details || error.code || "Unknown Supabase error";
  console.error("[Supabase error]", JSON.stringify(error));
  throw new Error(msg);
}

export async function fetchSaved(): Promise<SavedDescription[]> {
  const { data, error } = await getClient()
    .from("saved_descriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveDescription(
  entry: Omit<SavedDescription, "id" | "created_at">,
  userId: string
): Promise<SavedDescription> {
  const { data, error } = await getClient()
    .from("saved_descriptions")
    .insert([{ ...entry, user_id: userId }])
    .select("*")
    .single();
  if (error) throwSupabaseError(error);
  return data;
}

export async function deleteDescription(id: number): Promise<void> {
  const { error } = await getClient()
    .from("saved_descriptions")
    .delete()
    .eq("id", id);
  if (error) throwSupabaseError(error);
}

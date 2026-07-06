import { createClient, SupabaseClient, Session, User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export const supabase = getClient();

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export function onAuthStateChange(callback: (user: User | null) => void): Promise<() => void> {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return Promise.resolve(data.subscription.unsubscribe.bind(data.subscription));
}

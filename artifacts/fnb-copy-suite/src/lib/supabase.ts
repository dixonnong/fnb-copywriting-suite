export let _client: any = null;

export async function getClient() {
  if (!_client) {
    const { createClient } = await import(
      /* @vite-ignore */ "https://esm.sh/@supabase/supabase-js@2"
    );
    _client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return _client;
}

export async function signIn(email: string, password: string) {
  const client = await getClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const client = await getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = await getClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function onAuthStateChange(
  callback: (user: { id: string; email: string } | null) => void
) {
  const client = await getClient();
  const { data } = client.auth.onAuthStateChange((event: any, session: any) => {
    if (session?.user) {
      callback({ id: session.user.id, email: session.user.email });
    } else {
      callback(null);
    }
  });

  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user) {
    callback({ id: session.user.id, email: session.user.email });
  } else {
    callback(null);
  }

  return () => {
    data.subscription.unsubscribe();
  };
}

export async function getSession() {
  const client = await getClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

export async function getProfile(
  userId: string
): Promise<{ subscription_status: string } | null> {
  const client = await getClient();
  const { data, error } = await client
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  if (error) {
    // Profile may not exist yet (new user, or table not yet set up)
    return null;
  }
  return data;
}

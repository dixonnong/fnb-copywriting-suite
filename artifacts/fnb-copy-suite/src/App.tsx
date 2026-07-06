import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, PenLine } from "lucide-react";

import { onAuthStateChange, signOut, getSession, getProfile } from "@/lib/supabase";
import { AuthForm } from "@/components/auth-form";
import { PricingPage } from "@/components/pricing-page";
import { DishDescriptionTool } from "@/components/tools/dish-description";
import { SocialPostTool } from "@/components/tools/social-post";
import { ApologyEmailTool } from "@/components/tools/apology-email";
import { JobListingTool } from "@/components/tools/job-listing";

const queryClient = new QueryClient();

type SubscriptionStatus = "loading" | "free" | "pro";

function AppContent() {
  const [user, setUser] = useState<{ id: string; email?: string } | null | undefined>(undefined);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>("loading");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pollingForPro, setPollingForPro] = useState(false);

  // Fetch profile when user is set
  const fetchSubscription = useCallback(async (userId: string) => {
    const profile = await getProfile(userId);
    setSubscriptionStatus(profile?.subscription_status === "pro" ? "pro" : "free");
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    onAuthStateChange((sessionUser) => {
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null);
      if (sessionUser) {
        fetchSubscription(sessionUser.id);
      } else {
        setSubscriptionStatus("loading");
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchSubscription]);

  // Poll for pro status when redirected back from Stripe checkout
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") !== "true") return;

    // Clear the query param from URL
    window.history.replaceState({}, "", window.location.pathname);

    setPollingForPro(true);

    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      const profile = await getProfile(user.id);
      if (profile?.subscription_status === "pro") {
        setSubscriptionStatus("pro");
        setPollingForPro(false);
      } else if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        // Give up polling — webhook may be delayed; user can refresh
        setPollingForPro(false);
        setSubscriptionStatus("free");
      }
    };

    // Wait 1s before first check (webhook takes a moment)
    setTimeout(poll, 1000);
  }, [user]);

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const session = await getSession();
      if (!session?.access_token) throw new Error("Not logged in");

      const res = await fetch("/api/fnb/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (e: any) {
      console.error("Checkout error:", e.message);
      alert(`Could not start checkout: ${e.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  };

  // Initial load
  if (user === undefined || (user !== null && subscriptionStatus === "loading")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  const isPro = subscriptionStatus === "pro";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <PenLine className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">F&B Copywriting Suite</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Professional toolkit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isPro ? (
            <Badge variant="outline" className="text-primary border-primary/40 bg-primary/5 hidden sm:flex">
              Pro
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:flex border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleSubscribe}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Loading…" : "Upgrade to Pro"}
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            data-testid="button-logout"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {!isPro ? (
          <PricingPage
            userEmail={user.email ?? ""}
            onSubscribe={handleSubscribe}
            isLoading={checkoutLoading}
            pollingForPro={pollingForPro}
          />
        ) : (
          <Tabs defaultValue="dish" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border rounded-none bg-transparent h-auto p-0 gap-6 flex-nowrap" data-testid="tabs-list">
              <TabsTrigger
                value="dish"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none font-medium whitespace-nowrap"
                data-testid="tab-dish"
              >
                Dish Description
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none font-medium whitespace-nowrap"
                data-testid="tab-social"
              >
                Social Post
              </TabsTrigger>
              <TabsTrigger
                value="apology"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none font-medium whitespace-nowrap"
                data-testid="tab-apology"
              >
                Customer Apology
              </TabsTrigger>
              <TabsTrigger
                value="job"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none font-medium whitespace-nowrap"
                data-testid="tab-job"
              >
                Staff Job Listing
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="dish" className="focus-visible:outline-none focus-visible:ring-0">
                <DishDescriptionTool />
              </TabsContent>
              <TabsContent value="social" className="focus-visible:outline-none focus-visible:ring-0">
                <SocialPostTool />
              </TabsContent>
              <TabsContent value="apology" className="focus-visible:outline-none focus-visible:ring-0">
                <ApologyEmailTool />
              </TabsContent>
              <TabsContent value="job" className="focus-visible:outline-none focus-visible:ring-0">
                <JobListingTool />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

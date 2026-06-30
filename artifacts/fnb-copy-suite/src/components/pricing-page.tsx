import { Check, Lock, Sparkles, ChefHat, Share2, Mail, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { icon: ChefHat, label: "Dish Description" },
  { icon: Share2, label: "Social Post" },
  { icon: Mail, label: "Customer Apology" },
  { icon: Briefcase, label: "Job Listing" },
];

interface PricingPageProps {
  userEmail: string;
  onSubscribe: () => Promise<void>;
  isLoading: boolean;
  pollingForPro?: boolean;
}

export function PricingPage({ userEmail, onSubscribe, isLoading, pollingForPro }: PricingPageProps) {
  if (pollingForPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-foreground font-medium">Activating your Pro subscription…</p>
        <p className="text-sm text-muted-foreground">This takes just a moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Pro Plan
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Unlock the Full Suite</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          Professional AI copywriting tools built for restaurants, bars, and hospitality teams.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />

        <div className="mb-6 relative">
          <div className="text-5xl font-bold text-foreground tracking-tight">
            $29
            <span className="text-xl font-normal text-muted-foreground">/mo</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">Cancel anytime · No contracts</div>
        </div>

        <ul className="space-y-3 mb-8">
          {TOOLS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-foreground">{label} Generator</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          size="lg"
          onClick={onSubscribe}
          disabled={isLoading}
        >
          {isLoading ? "Redirecting to Stripe…" : "Subscribe — $29/month"}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Signed in as {userEmail}
        </p>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Powered by Stripe · Secure checkout
      </p>

      <div className="grid grid-cols-4 gap-2 max-w-sm w-full">
        {TOOLS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-lg p-3 flex flex-col items-center gap-2 opacity-40"
          >
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div className="text-[10px] text-center text-muted-foreground leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

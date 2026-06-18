import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGenerateDescription } from "@workspace/api-client-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PenTool } from "lucide-react";

type Tone = "Luxurious" | "Playful" | "Minimalist";
const TONES: Tone[] = ["Luxurious", "Playful", "Minimalist"];

const queryClient = new QueryClient();

function Generator() {
  const [ingredients, setIngredients] = useState("");
  const [tone, setTone] = useState<Tone>("Luxurious");
  const [result, setResult] = useState("");

  const generateMutation = useGenerateDescription();

  const handleGenerate = () => {
    if (!ingredients.trim()) return;
    generateMutation.mutate(
      { data: { ingredients, tone } },
      {
        onSuccess: (data) => {
          setResult(data.description);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl flex flex-col gap-8">

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
            <PenTool className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif text-primary">Menu Copy AI</h1>
          <p className="text-muted-foreground text-sm font-sans tracking-wide uppercase">
            Consult the master copywriter
          </p>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-6 space-y-6">

            <div className="space-y-3">
              <label htmlFor="ingredients" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ingredients
              </label>
              <Textarea
                id="ingredients"
                data-testid="input-ingredients"
                placeholder="e.g. Bourbon, Campari, Sweet Vermouth, Orange Peel..."
                className="min-h-[120px] bg-background border-border focus-visible:ring-primary font-sans resize-none placeholder:text-muted-foreground/50"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    data-testid={`button-tone-${t.toLowerCase()}`}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      tone === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button
              data-testid="button-generate"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-12"
              onClick={handleGenerate}
              disabled={!ingredients.trim() || generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" /> Writing...
                </span>
              ) : (
                "Generate Description"
              )}
            </Button>

          </CardContent>
        </Card>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <Card className="bg-card border-primary/20 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
              <CardContent className="p-8 md:p-12 text-center">
                <p
                  data-testid="text-result"
                  className="font-serif italic text-2xl md:text-3xl leading-relaxed text-foreground"
                >
                  "{result}"
                </p>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Generator />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

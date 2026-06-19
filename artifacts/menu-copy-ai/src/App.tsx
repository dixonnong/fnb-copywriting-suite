import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGenerateDescription } from "@workspace/api-client-react";
import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PenTool, BookMarked, Trash2, BookOpen } from "lucide-react";
import { fetchSaved, saveDescription, deleteDescription, type SavedDescription } from "@/lib/supabase";

type Tone = "Luxurious" | "Playful" | "Minimalist";
const TONES: Tone[] = ["Luxurious", "Playful", "Minimalist"];

const TONE_COLORS: Record<Tone, string> = {
  Luxurious: "bg-amber-900/30 text-amber-300 border border-amber-800/40",
  Playful: "bg-purple-900/30 text-purple-300 border border-purple-800/40",
  Minimalist: "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40",
};

const queryClient = new QueryClient();

function Generator() {
  const [ingredients, setIngredients] = useState("");
  const [tone, setTone] = useState<Tone>("Luxurious");
  const [result, setResult] = useState("");
  const [currentIngredients, setCurrentIngredients] = useState("");
  const [currentTone, setCurrentTone] = useState<Tone>("Luxurious");
  const [saved, setSaved] = useState<SavedDescription[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const generateMutation = useGenerateDescription();

  const loadLibrary = useCallback(async () => {
    try {
      setLoadingLibrary(true);
      setLibraryError(null);
      const entries = await fetchSaved();
      setSaved(entries);
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleGenerate = () => {
    if (!ingredients.trim()) return;
    setResult("");
    generateMutation.mutate(
      { data: { ingredients, tone } },
      {
        onSuccess: (data) => {
          setResult(data.description);
          setCurrentIngredients(ingredients);
          setCurrentTone(tone);
        },
      }
    );
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setSaveError(null);
    try {
      const entry = await saveDescription({
        ingredients: currentIngredients,
        description: result,
        tone: currentTone,
      });
      setSaved((prev) => [entry, ...prev]);
      setResult("");
      setIngredients("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Save failed:", msg, err);
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDescription(id);
      setSaved((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl flex flex-col gap-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
            <PenTool className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-serif text-primary">Menu Copy AI</h1>
          <p className="text-muted-foreground text-sm font-sans tracking-wide uppercase">
            Consult the master copywriter
          </p>
        </div>

        {/* Generator Card */}
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

        {/* Result Card */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out flex flex-col gap-3">
            <Card className="bg-card border-primary/20 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <CardContent className="p-8 md:p-10 text-center">
                <p
                  data-testid="text-result"
                  className="font-serif italic text-2xl md:text-3xl leading-relaxed text-foreground"
                >
                  "{result}"
                </p>
              </CardContent>
            </Card>
            <Button
              data-testid="button-save"
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 bg-card border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
              variant="outline"
            >
              {saving ? (
                <><Spinner className="w-4 h-4" /> Saving...</>
              ) : (
                <><BookMarked className="w-4 h-4" /> Save to Library</>
              )}
            </Button>
            {saveError && (
              <p className="text-xs text-red-400 text-center px-1" data-testid="text-save-error">
                Save failed: {saveError}
              </p>
            )}
          </div>
        )}

        {/* Saved Library */}
        <div className="flex flex-col gap-4 pb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Saved Library</h2>
            {!loadingLibrary && (
              <span className="ml-auto text-xs text-muted-foreground/60">{saved.length} {saved.length === 1 ? "entry" : "entries"}</span>
            )}
          </div>

          {libraryError && (
            <p className="text-xs text-red-400 text-center py-2">{libraryError}</p>
          )}

          {loadingLibrary ? (
            <div className="flex justify-center py-8">
              <Spinner className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : saved.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground text-sm">No saved descriptions yet.</p>
                <p className="text-muted-foreground/50 text-xs mt-1">Generate a description and save it to your library.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3" data-testid="library-list">
              {saved.map((entry) => (
                <Card
                  key={entry.id}
                  className="bg-card border-border hover:border-primary/20 transition-colors"
                  data-testid={`card-saved-${entry.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <p
                          data-testid={`text-saved-description-${entry.id}`}
                          className="font-serif italic text-base leading-relaxed text-foreground"
                        >
                          "{entry.description}"
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {entry.ingredients}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TONE_COLORS[entry.tone as Tone] ?? TONE_COLORS.Luxurious}`}>
                            {entry.tone}
                          </span>
                          {entry.created_at && (
                            <span className="text-xs text-muted-foreground/50">{formatDate(entry.created_at)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        data-testid={`button-delete-${entry.id}`}
                        onClick={() => entry.id !== undefined && handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="shrink-0 p-1.5 rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                        aria-label="Delete entry"
                      >
                        {deletingId === entry.id ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

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

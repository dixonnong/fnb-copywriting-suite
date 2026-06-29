import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutputDisplayProps {
  isLoading: boolean;
  content: string | null;
  subject?: string | null;
}

export function OutputDisplay({ isLoading, content, subject }: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    const textToCopy = subject ? `${subject}\n\n${content}` : content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content && !isLoading) {
    return (
      <div 
        className="h-full min-h-[200px] flex items-center justify-center rounded-md border border-border border-dashed bg-card/30"
        data-testid="output-empty"
      >
        <span className="text-sm text-muted-foreground text-center px-4">
          Fill out the form and generate to see results.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-md border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Result
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          disabled={isLoading || !content}
          data-testid="button-copy-output"
        >
          {copied ? (
            <Check className="h-4 w-4 mr-1.5 text-primary" />
          ) : (
            <Copy className="h-4 w-4 mr-1.5" />
          )}
          {copied ? "Copied" : "Copy to clipboard"}
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto whitespace-pre-wrap relative text-sm leading-relaxed" data-testid="output-content">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card">
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-muted-foreground">Drafting copy...</p>
            </div>
          </div>
        ) : (
          <div className="text-foreground">
            {subject && (
              <div className="mb-4">
                <span className="text-muted-foreground block text-xs uppercase mb-1">Subject</span>
                <span className="font-semibold">{subject}</span>
              </div>
            )}
            {subject && <span className="text-muted-foreground block text-xs uppercase mb-1">Body</span>}
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
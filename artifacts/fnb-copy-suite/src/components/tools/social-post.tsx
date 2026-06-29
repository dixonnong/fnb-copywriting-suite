import { useState } from "react";
import { useFnbSocialPost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutputDisplay } from "../output-display";

export function SocialPostTool() {
  const [promotion, setPromotion] = useState("");
  const [platform, setPlatform] = useState<"Instagram" | "Facebook">("Instagram");
  const [tone, setTone] = useState<"Exciting" | "Elegant" | "Casual">("Exciting");
  const [output, setOutput] = useState<string | null>(null);

  const mutation = useFnbSocialPost();

  const handleGenerate = () => {
    mutation.mutate(
      { data: { promotion, platform, tone } },
      {
        onSuccess: (result) => setOutput(result.text),
      }
    );
  };

  const isFormValid = promotion.trim();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5 bg-card p-5 rounded-md border border-border">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-1">Social Media Post</h3>
          <p className="text-sm text-muted-foreground">Draft captions for your next promo, event, or menu drop.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promotion">What are we promoting?</Label>
            <Textarea 
              id="promotion" 
              placeholder="e.g. 2-for-1 cocktails this Friday night featuring our new summer menu." 
              value={promotion}
              onChange={(e) => setPromotion(e.target.value)}
              className="resize-none h-24"
              data-testid="input-social-promotion"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                <SelectTrigger data-testid="select-platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger data-testid="select-tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Exciting">Exciting</SelectItem>
                  <SelectItem value="Elegant">Elegant</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={!isFormValid || mutation.isPending}
          onClick={handleGenerate}
          data-testid="button-generate-social"
        >
          {mutation.isPending ? "Drafting Post..." : "Generate Caption"}
        </Button>
      </div>

      <div className="h-[400px] md:h-auto">
        <OutputDisplay isLoading={mutation.isPending} content={output} />
      </div>
    </div>
  );
}
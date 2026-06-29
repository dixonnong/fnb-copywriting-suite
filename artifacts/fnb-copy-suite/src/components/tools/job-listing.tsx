import { useState } from "react";
import { useFnbJobListing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutputDisplay } from "../output-display";

export function JobListingTool() {
  const [role, setRole] = useState("");
  const [venueType, setVenueType] = useState("");
  const [requirements, setRequirements] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  const mutation = useFnbJobListing();

  const handleGenerate = () => {
    mutation.mutate(
      { data: { role, venueType, requirements } },
      {
        onSuccess: (result) => setOutput(result.text),
      }
    );
  };

  const isFormValid = role.trim() && venueType.trim() && requirements.trim();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5 bg-card p-5 rounded-md border border-border">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-1">Staff Job Listing</h3>
          <p className="text-sm text-muted-foreground">Draft a compelling listing to attract top hospitality talent.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input 
              id="role" 
              placeholder="e.g. Head Bartender" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              data-testid="input-job-role"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueType">Venue Type / Concept</Label>
            <Input 
              id="venueType" 
              placeholder="e.g. High-volume craft cocktail bar" 
              value={venueType}
              onChange={(e) => setVenueType(e.target.value)}
              data-testid="input-venue-type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Key Requirements / Perks</Label>
            <Textarea 
              id="requirements" 
              placeholder="e.g. Minimum 3 years experience, deep classic knowledge, weekends required. Staff meal included." 
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="resize-none h-24"
              data-testid="input-job-requirements"
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={!isFormValid || mutation.isPending}
          onClick={handleGenerate}
          data-testid="button-generate-job"
        >
          {mutation.isPending ? "Drafting Listing..." : "Generate Job Listing"}
        </Button>
      </div>

      <div className="h-[400px] md:h-auto">
        <OutputDisplay isLoading={mutation.isPending} content={output} />
      </div>
    </div>
  );
}
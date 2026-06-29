import { useState } from "react";
import { useFnbApologyEmail } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutputDisplay } from "../output-display";

export function ApologyEmailTool() {
  const [whatWentWrong, setWhatWentWrong] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reservationDetails, setReservationDetails] = useState("");
  
  const [subject, setSubject] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);

  const mutation = useFnbApologyEmail();

  const handleGenerate = () => {
    mutation.mutate(
      { data: { whatWentWrong, customerName, reservationDetails } },
      {
        onSuccess: (result) => {
          const lines = result.text.split('\n');
          const subj = lines[0].replace(/^Subject:\s*/i, '').trim();
          const rest = lines.slice(1).join('\n').trim();
          setSubject(subj);
          setBody(rest);
        },
      }
    );
  };

  const isFormValid = whatWentWrong.trim() && customerName.trim() && reservationDetails.trim();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5 bg-card p-5 rounded-md border border-border">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-1">Apology Email</h3>
          <p className="text-sm text-muted-foreground">Professional, empathetic response for a bad service experience.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input 
              id="customerName" 
              placeholder="e.g. John Smith" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="input-customer-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationDetails">Date & Time</Label>
            <Input 
              id="reservationDetails" 
              placeholder="e.g. Friday 8PM, table for 2" 
              value={reservationDetails}
              onChange={(e) => setReservationDetails(e.target.value)}
              data-testid="input-reservation-details"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatWentWrong">What went wrong?</Label>
            <Textarea 
              id="whatWentWrong" 
              placeholder="e.g. Food took 45 minutes to arrive, steaks were undercooked." 
              value={whatWentWrong}
              onChange={(e) => setWhatWentWrong(e.target.value)}
              className="resize-none h-24"
              data-testid="input-what-went-wrong"
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={!isFormValid || mutation.isPending}
          onClick={handleGenerate}
          data-testid="button-generate-apology"
        >
          {mutation.isPending ? "Drafting Email..." : "Generate Apology"}
        </Button>
      </div>

      <div className="h-[400px] md:h-auto">
        <OutputDisplay isLoading={mutation.isPending} content={body} subject={subject} />
      </div>
    </div>
  );
}
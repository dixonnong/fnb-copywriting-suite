import { useState } from "react";
import { useFnbDish } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OutputDisplay } from "../output-display";

export function DishDescriptionTool() {
  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [cuisineStyle, setCuisineStyle] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  const mutation = useFnbDish();

  const handleGenerate = () => {
    mutation.mutate(
      { data: { dishName, ingredients, cuisineStyle } },
      {
        onSuccess: (result) => setOutput(result.text),
      }
    );
  };

  const isFormValid = dishName.trim() && ingredients.trim() && cuisineStyle.trim();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5 bg-card p-5 rounded-md border border-border">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-1">Dish Description</h3>
          <p className="text-sm text-muted-foreground">Generate a compelling, short menu description for a new dish.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dishName">Dish Name</Label>
            <Input 
              id="dishName" 
              placeholder="e.g. Pan-Seared Scallops" 
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              data-testid="input-dish-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Key Ingredients</Label>
            <Textarea 
              id="ingredients" 
              placeholder="e.g. Hokkaido scallops, brown butter, cauliflower purée, crispy capers" 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="resize-none h-24"
              data-testid="input-dish-ingredients"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuisineStyle">Cuisine Style</Label>
            <Input 
              id="cuisineStyle" 
              placeholder="e.g. Modern European" 
              value={cuisineStyle}
              onChange={(e) => setCuisineStyle(e.target.value)}
              data-testid="input-cuisine-style"
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={!isFormValid || mutation.isPending}
          onClick={handleGenerate}
          data-testid="button-generate-dish"
        >
          {mutation.isPending ? "Generating..." : "Generate Description"}
        </Button>
      </div>

      <div className="h-[400px] md:h-auto">
        <OutputDisplay isLoading={mutation.isPending} content={output} />
      </div>
    </div>
  );
}
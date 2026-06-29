import { useState } from "react";
import { signIn, signUp } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        toast({
          title: "Account created",
          description: "You've been successfully signed up.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-card border border-border rounded-lg shadow-xl shadow-black/50">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          F&B Copywriting Suite
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="chef@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-password"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full mt-2 font-semibold" 
          disabled={loading || !email || !password}
          data-testid="button-auth-submit"
        >
          {loading ? "Please wait..." : (isLogin ? "Log In" : "Sign Up")}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </span>{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline font-medium"
          data-testid="button-toggle-auth"
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </div>
    </div>
  );
}
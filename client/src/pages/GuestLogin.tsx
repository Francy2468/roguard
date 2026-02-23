import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function GuestLogin() {
  const [, navigate] = useLocation();

  const guestLoginMutation = trpc.auth.loginGuest.useMutation({
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err) => {
      console.error("Guest login failed:", err);
      navigate("/auth/login");
    },
  });

  useEffect(() => {
    guestLoginMutation.mutate();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-lg font-medium">Creating guest account...</p>
        <p className="text-sm text-muted-foreground">You'll be redirected shortly</p>
      </div>
    </div>
  );
}

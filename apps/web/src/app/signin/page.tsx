"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getServices } from "@/services";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/create";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await getServices().auth.signIn({ provider: "credentials", email, name: email.split("@")[0], redirect: false, callbackUrl });
      if (res.error) {
        setError(res.error);
      } else if (res.ok && res.url) {
        window.location.href = res.url ?? callbackUrl;
      } else {
        setError("Unexpected sign-in response. Check server logs.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="h1 mb-2">Sign in</h1>
        <p className="muted">Continue with email. We’ll add providers later.</p>
      </div>

      <form onSubmit={onSubmit} className="surface p-4 space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={loading || !email}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
      
    </div>
  );
}

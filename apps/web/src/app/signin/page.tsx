"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getServices } from "@/services";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
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
      const res = await getServices().auth.signIn({
        provider: "credentials",
        email,
        name: email.split("@")[0],
        redirect: false,
        callbackUrl,
      });
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
        <h1 className="mb-2 h1">Sign in</h1>
        <p className="muted">Continue with email. Additional providers can come later.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-3 p-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={loading || !email}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>
    </div>
  );
}

function SignInFallback() {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="mb-2 h1">Sign in</h1>
        <p className="muted">Loading sign-in form...</p>
      </div>
    </div>
  );
}

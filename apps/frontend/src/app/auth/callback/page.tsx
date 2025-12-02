"use client";

import { useEffect } from "react";

// Simple client-side only callback handler that reads the token from the URL
// Using `window.location` avoids using Next navigation hooks and prevents
// any prerender/runtime mismatch during the build.
export default function OAuthCallbackPage() {
  useEffect(() => {
    try {
      const query = typeof window !== "undefined" ? window.location.search : "";
      const params = new URLSearchParams(query);
      const token = params.get("token");

      if (token) {
        localStorage.setItem("auth_token", token);
        // use a hard redirect so the app reloads with the authenticated state
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      // fallback: go to login
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Processing...
    </div>
  );
}

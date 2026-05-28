import { useEffect, useState, lazy, Suspense } from "react";

// Lazy-load the SPA App so that server-side rendering never tries to
// evaluate code that depends on `window` (BrowserRouter, supabase storage, …).
const App = lazy(() => import("../App"));

export function ClientSpa() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <App />
    </Suspense>
  );
}

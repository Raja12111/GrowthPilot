"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, type GrowthPilotUser } from "@/lib/auth-client";

export function useAuthUser() {
  const [user, setUser] = useState<GrowthPilotUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setUser(getCurrentUser());
      setReady(true);
    }
    sync();
    window.addEventListener("growthpilot-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("growthpilot-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, ready };
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useAuthUser();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [ready, user, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#5c6578]">
        Checking login…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#5c6578]">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}

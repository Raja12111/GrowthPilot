import { Suspense } from "react";
import MastodonIntegrationPage from "./mastodon-view";

export default function MastodonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#eef2f7,transparent_45%),linear-gradient(180deg,#f7f8fa_0%,#ffffff_100%)] px-4 py-8 text-sm text-[#5c6578]">
          Loading Mastodon…
        </div>
      }
    >
      <MastodonIntegrationPage />
    </Suspense>
  );
}

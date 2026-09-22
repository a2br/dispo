import { devLoginEnabled, googleConfigured } from "@/lib/auth";
import { button, input } from "@/lib/ui";

/** EPFL Google sign-in (+ local dev login). `next` brings the person back where they started, e.g. an invite link. */
export function SignIn({ next, label = "Continue with EPFL Google" }: { next?: string; label?: string }) {
  const google = googleConfigured();
  const dev = devLoginEnabled();
  const href = `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <div className="space-y-3">
      <a href={href} aria-disabled={!google} className={button(google ? "dark" : "secondary", "lg", `w-full gap-3 ${google ? "" : "pointer-events-none text-muted"}`)}>
        <GoogleG />
        {label}
      </a>
      {!google && <p className="text-xs text-muted text-center">Google sign-in isn’t configured on this server yet (set GOOGLE_CLIENT_ID / SECRET).</p>}
      {dev && (
        <form action="/api/auth/dev" method="get" className="border border-dashed border-line p-3 space-y-2">
          <div className="text-xs font-bold text-muted uppercase tracking-wide">Dev login (local only)</div>
          {next && <input type="hidden" name="next" value={next} />}
          <div className="flex gap-2">
            <input name="name" placeholder="Name" className={input("md", "flex-1 min-w-0 w-auto")} />
            <input name="email" type="email" required placeholder="you@epfl.ch" className={input("md", "flex-1 min-w-0 w-auto")} />
            <button className={button("secondary", "md")}>Go</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function Fineprint() {
  return (
    <p className="text-xs text-muted">Only @epfl.ch accounts. Your calendar link is stored encrypted and never shown to anyone.</p>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.9c-.3 2.1-1.7 5.3-4.8 7.4l7.4 5.7c4.4-4.1 7-10.1 7-16.7z" />
      <path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.4-8.5 2.4-6.3 0-11.7-4-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

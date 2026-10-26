import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getT } from "@/i18n/server";
import { getUser } from "@/lib/auth";
import { REQUEST_COOKIE, readRequest } from "@/lib/oauth";
import { button } from "@/lib/ui";
import { Fineprint, SignIn } from "@/components/SignIn";
import { Wordmark } from "@/components/Wordmark";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).oauth.title, robots: { index: false } };
}

/** Second half of an MCP client's sign-in (/oauth/authorize): sign in if needed, then Allow or Cancel. */
export default async function Consent() {
  const t = await getT();
  const to = t.oauth;
  const request = await readRequest((await cookies()).get(REQUEST_COOKIE)?.value);
  if (!request) {
    return (
      <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-4">
        <Wordmark size="text-3xl" />
        <h1 className="text-2xl font-bold tracking-tight">{to.expired.title}</h1>
        <p className="text-muted">{to.expired.text}</p>
      </main>
    );
  }
  const viewer = await getUser();
  const app = request.clientName || "Claude";
  const host = new URL(request.redirectUri).host;

  return (
    <main className="mx-auto max-w-md min-h-dvh flex flex-col justify-center py-10 gap-8">
      <Wordmark size="text-3xl" />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{to.headline(app)}</h1>
        <p className="text-muted">{to.intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          {to.sees.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="text-muted">{to.readOnly}</p>
      </div>
      {viewer ? (
        <div className="space-y-3">
          <form method="post" action="/oauth/approve" className="space-y-2">
            <button name="decision" value="allow" className={button("primary", "lg", "w-full")}>
              {to.allow}
            </button>
            <button name="decision" value="deny" className={button("quiet", "md", "w-full")}>
              {to.cancel}
            </button>
          </form>
          <p className="text-xs text-muted text-center">
            {to.signedInAs(viewer.email)} · {to.backTo(host)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">{to.signInFirst}</p>
          <SignIn next="/oauth/consent" />
          <Fineprint />
        </div>
      )}
    </main>
  );
}

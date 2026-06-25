import { UnsubscribeForm } from "@/components/unsubscribe/unsubscribe-form";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050607] px-5 py-10 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(96,165,250,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <UnsubscribeForm email={email ?? ""} token={token ?? ""} />
      </section>
    </main>
  );
}

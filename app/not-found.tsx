import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-32 text-center sm:px-6">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-semibold">That page doesn&apos;t exist.</h1>
      <Link href="/" className="mt-6 inline-block text-accent underline underline-offset-4">
        Back to the portfolio
      </Link>
    </main>
  );
}

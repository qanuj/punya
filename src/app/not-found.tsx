import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
        <p className="mt-2 text-muted">
          Nothing is published at this address.{" "}
          <Link href="/" className="underline">
            Start from the beginning
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

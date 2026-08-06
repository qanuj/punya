import Link from "next/link";
import { pageLinks } from "@/lib/cms";
import { navLinks } from "@/lib/routing";

export const metadata = { title: "Page not found" };

/**
 * A page that is not there.
 *
 * The template's version said "Not found" in the browser's default type and
 * offered one link back to the root, which leaves somebody who followed a
 * shared link or an old bookmark to start again from nothing. It says what
 * happened in plain words and then lists the places worth going, because the
 * person reading it was on their way somewhere.
 */
export default async function NotFound() {
  const [types, pages] = await Promise.all([navLinks(), pageLinks()]);
  const ways = [...types, ...pages].slice(0, 8);

  return (
    <article>
      <header className="page-header">
        <div className="shell">
          <h1 className="page-title">Nothing is published at this address</h1>
          <p className="lead">
            The page may have been renamed, or the link that brought you here may be out of date.
          </p>
        </div>
      </header>

      {ways.length > 0 && (
        <div className="section">
          <div className="shell">
            <p className="label-caps">Where to go instead</p>
            <div className="finder-tags">
              <Link href="/" className="chip">
                Home
              </Link>
              {ways.map((way) => (
                <Link key={way.href} href={way.href} className="chip">
                  {way.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

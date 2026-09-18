import Link from "@/components/game/AppLink";
import { Pip } from "@/components/pip/Pip";
export default function Home() {
  return (
    <main className="landing">
      <header className="site-header">
        <Link className="brand" href="/">
          pip<span>✦</span>
        </Link>
        <div className="header-tag">A LITTLE CREATURE. A BIG DISCOVERY.</div>
        <Link href="/lab" className="quiet-link">
          How Pip learns ↗
        </Link>
      </header>
      <div className="landing-copy">
        <span className="eyebrow">
          MEET PIP — THE AI APPRENTICE YOU TEACH TO LEARN
        </span>
        <h1>
          Pip has a lot
          <br />
          to learn.
          <br />
          <em>
            Good thing
            <br className="mobile-break" /> you’re here.
          </em>
        </h1>
        <p>
          Most math games ask for the answer.
          <br />
          Pip asks, “Can you teach me why?”
        </p>
        <Link href="/world" className="button gold">
          Teach Pip <span>→</span>
        </Link>
        <span className="under-cta">No account. Just curiosity.</span>
      </div>
      <div className="landing-character">
        <div className="speech small">
          You know things I don’t.
          <br />
          Can you teach me?
        </div>
        <Pip size={260} mood="curious" />
      </div>
      <footer className="landing-footer">
        <span>TEACH IT. PROVE IT. MASTER IT.</span>
        <Link href="/grownups">For grown-ups ↗</Link>
        <Link href="/demo">Try the guided demo →</Link>
      </footer>
    </main>
  );
}

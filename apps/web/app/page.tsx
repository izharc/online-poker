const features = ["Server-authoritative gameplay", "Real-time multiplayer tables", "Play money — no deposits or wagering"];

export default function Home() {
  return <main>
    <nav><strong>STACKLINE</strong><div><a href="#features">How it works</a><a href="/login">Log in</a></div></nav>
    <section className="hero">
      <p className="eyebrow">PLAY-MONEY TEXAS HOLD'EM</p>
      <h1>Read the table.<br /><em>Build your stack.</em></h1>
      <p className="lede">A polished, fair place to play Texas Hold&apos;em with friends and competitors — using chips only.</p>
      <div className="actions"><a className="primary" href="/register">Play now</a><a className="secondary" href="#features">Explore tables</a></div>
    </section>
    <section id="features" className="features">{features.map((feature, index) => <article key={feature}><span>0{index + 1}</span><h2>{feature}</h2><p>Built for secure, transparent play across desktop and mobile.</p></article>)}</section>
  </main>;
}

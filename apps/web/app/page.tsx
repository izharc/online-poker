import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Play with friends",
    text: "Create a table and invite friends to join your game.",
  },
  {
    number: "02",
    title: "Texas Hold'em",
    text: "Classic Texas Hold'em gameplay with chips only.",
  },
  {
    number: "03",
    title: "Build your stack",
    text: "Start with chips, make your moves and enjoy the game.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="brand">STACKLINE</div>

        <div className="nav-links">
          <a href="#features">How it works</a>
          <a href="#account">Account</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">PLAY-MONEY TEXAS HOLD'EM</p>

          <h1>
            Read the table.
            <br />
            <span>Build your stack.</span>
          </h1>

          <p className="subtitle">
            A polished, fair place to play Texas Hold&apos;em with friends
            and competitors — using chips only.
          </p>

          <div className="actions">
            <Link className="primary" href="/table">
              Play now
            </Link>

            <a className="secondary" href="#features">
              Explore tables
            </a>
          </div>

          <div className="account-card" id="account">
            <p className="card-label">PLAYER ACCOUNT</p>

            <h2>Welcome back</h2>

            <p className="card-text">
              Sign in to access the poker table.
            </p>

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
            />

            <Link className="login-button" href="/table">
              Enter table
            </Link>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        {features.map((feature) => (
          <article className="feature" key={feature.number}>
            <span>{feature.number}</span>

            <h2>{feature.title}</h2>

            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
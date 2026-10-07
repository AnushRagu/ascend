import React from "react";
import HalftoneNebula from "@/components/HalftoneNebula";
import DashboardLink from "@/components/DashboardLink";

const SKY = {
  planetX: 0.76,
  planetY: 0.23,
  bandAngle: 0.82,
  bandOffset: 0.35,
  voidColor: "#090a0e",
  hazeColor: "#13151d",
  duskColor: "#20212b",
  wineColor: "#302d3f",
  crimsonColor: "#625985",
  hotColor: "#a9a0dc",
  starColor: "#f2efff",
};

const DASHBOARD_URL = "/";

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
        <path d="M3 14.5 9.9 3l7.1 11.5h-4.2l-2.9-4.7-2.8 4.7H3Z" fill="currentColor" />
        <path d="M7.2 17h9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function StepIcon({ kind }: { kind: "focus" | "build" | "rise" }) {
  if (kind === "focus")
    return (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke="currentColor" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
        <path d="M10 1.5v3M18.5 10h-3M10 18.5v-3M1.5 10h3" stroke="currentColor" />
      </svg>
    );
  if (kind === "build")
    return (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 14.5 7.2 10l3 2.5L17 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.7 5H17v4.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2.5 12 8l5.5 2-5.5 2-2 5.5L8 12l-5.5-2L8 8l2-5.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path
        d="m15.5 2 .5 1.5 1.5.5-1.5.5-.5 1.5L15 4.5l-1.5-.5 1.5-.5.5-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-scope">
      <main>
        <section className="hero" id="top">
          <div className="hero-sky" aria-hidden="true">
            <HalftoneNebula height="100%" params={SKY} interactive />
          </div>
          <div className="shell">
            <nav className="nav" aria-label="Main navigation">
              <a className="brand" href="#top" aria-label="Ascend home">
                <Mark />ascend
              </a>
              <div className="nav-links">
                <a href="#approach">Our approach</a>
                <a href="#journey">The journey</a>
                <a href="#stories">Stories</a>
              </div>
              <DashboardLink className="nav-cta" href={DASHBOARD_URL}>
                Open Dashboard <Arrow />
              </DashboardLink>
            </nav>

            <div className="hero-content">
              <div className="hero-copy">
                <div className="hero-kicker">
                  <span className="live-dot" />
                  <span className="eyebrow">Autonomous Advertising OS</span>
                </div>
                <h1>
                  Make your next
                  <br className="desktop-break" /> move your <em>best one.</em>
                </h1>
                <p className="hero-description">
                  Ascend connects multi-channel telemetry, detects unit margin anomalies, and executes high-confidence advertising decisions with mathematical guardrails.
                </p>
                <div className="hero-actions">
                  <DashboardLink className="button-primary" href={DASHBOARD_URL}>
                    Open Dashboard <Arrow />
                  </DashboardLink>
                  <a className="button-quiet" href="#approach">
                    See how it works <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="hero-foot">
              <span>Autonomous Decision Engine</span>
              <span className="scroll-mark">Scroll to explore</span>
              <span>01 / 04</span>
            </div>
          </div>
        </section>

        <section className="section" id="approach">
          <div className="shell intro">
            <div>
              <span className="eyebrow">Cross-Channel Unit Economics</span>
              <h2 className="section-title">Scale feels different when decisions are autonomous.</h2>
            </div>
            <div className="intro-aside">
              <p className="section-copy">
                You don’t need another fragmented reporting spreadsheet. You need closed-loop telemetry across Meta, Google, and Amazon, real-time stockout protection, and verified contribution profit.
              </p>
              <div className="metric-row">
                <div className="metric">
                  <strong>3-Tier Guardrails</strong>
                  <span>Deterministic Safety</span>
                </div>
                <div className="metric">
                  <strong>Continuous</strong>
                  <span>Closed-Loop Telemetry</span>
                </div>
                <div className="metric">
                  <strong>Net Contribution</strong>
                  <span>Real Dollar Impact</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section how" id="journey">
          <div className="shell">
            <div className="section-head">
              <div>
                <span className="eyebrow">The Autonomous Pipeline</span>
                <h2 className="section-title">
                  Observe where you are.
                  <br />Execute where you mean to.
                </h2>
              </div>
              <p className="section-copy">
                Nine deterministic stages from telemetry ingestion through mathematical verification and outcome learning.
              </p>
            </div>
            <div className="step-grid">
              <article className="step">
                <span className="step-index">01 / DETECT & DIAGNOSE</span>
                <div className="step-icon">
                  <StepIcon kind="focus" />
                </div>
                <h3>Spot Anomaly Signals</h3>
                <p>Detect creative fatigue, inventory burn hazards, and cross-channel ROAS arbitrage opportunities in real time.</p>
              </article>
              <article className="step">
                <span className="step-index">02 / GUARD & DECIDE</span>
                <div className="step-icon">
                  <StepIcon kind="build" />
                </div>
                <h3>Apply Tier Boundaries</h3>
                <p>Micro-adjustments execute autonomously; high-impact budget swings route safely to the approval inbox.</p>
              </article>
              <article className="step">
                <span className="step-index">03 / TRACK & LEARN</span>
                <div className="step-icon">
                  <StepIcon kind="rise" />
                </div>
                <h3>Closed-Loop Verification</h3>
                <p>Measure 24h/72h contribution profit lift, automatically rollback deteriorating actions, and update confidence priors.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="quote" id="stories">
          <div className="shell">
            <span className="eyebrow">Core Engineering Principle</span>
            <blockquote>
              Growth without profit isn’t scale. It’s a leak you fix <span>at the root cause.</span>
            </blockquote>
            <p className="quote-by">ASCEND Mathematical Architecture</p>
          </div>
        </section>

        <section className="cta-section" id="start">
          <div className="shell">
            <div className="cta-panel">
              <span className="eyebrow">Telemetry Engine Online</span>
              <h2>
                Your autonomous cockpit
                <br />is ready for launch.
              </h2>
              <DashboardLink className="button-primary" href={DASHBOARD_URL}>
                Launch Dashboard <Arrow />
              </DashboardLink>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="shell footer-inner">
            <a className="brand" href="#top">
              <Mark />ascend
            </a>
            <span>© {new Date().getFullYear()} ASCEND Autonomous Advertising Intelligence OS.</span>
            <div className="footer-links">
              <a className="text-link" href="#approach">Our approach</a>
              <a className="text-link" href="#journey">The journey</a>
              <a className="text-link" href="#top">Back to top</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

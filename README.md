# ASCEND — Autonomous Cross-Channel Intelligence & Decision Engine

**AI-Native Advertising Intelligence and Autonomous Decision Engine for D2C Brands.**

ASCEND unifies fragmented data from advertising platforms (Meta Ads, Google Ads, Amazon Ads), sales channels (Shopify), inventory, product margins, and creative performance into a single intelligence and autonomous decision layer.

---

## ⚡ Configurable 3-Tier, Risk-Aware Autonomy

ASCEND is designed around a rigorous mathematical and safety-governed autonomy model:

| Autonomy Tier | Scope & Triggers | Execution Mode | Safety Controls |
| :--- | :--- | :--- | :--- |
| **Tier 1: Autonomous Micro-Adjustments** | Small budget shifts ($\le 10\%$), creative fatigue pauses | **Fully Autonomous** | Cooldown timer (24h), min confidence floor ($\ge 85\%$), risk ceiling ($\le 25\%$), automated rollback watchdog |
| **Tier 2: Moderate-Impact Adjustments** | Budget shifts ($10\% - 30\%$), cross-channel reallocations | **1-Click Approval Inbox** | Human-in-the-loop review card with root-cause diagnostics, projected MER/ROAS lift, instant 1-click execution |
| **Tier 3: Strategic Escalation** | Budget shifts ($>30\%$), campaign shutdowns, low AI confidence | **Mandatory Human Sign-Off** | High-impact escalation requiring formal operator justification |

### Safety Floors & Global Controls
- **1-Click Atomic Rollback:** Every executed mutation records an atomic reverse payload (`rollback_payload`) for immediate 1-click reversion.
- **Safety Watchdog Auto-Rollback:** If post-execution ROAS or MER drops by $>15\%$ in the first 6–24 hours, the safety watchdog triggers an automatic reverse mutation.
- **Global Execution Kill Switch:** A master toggle that halts all autonomous ad platform mutations across all channels instantaneously.
- **Inventory Stockout Protection:** Automatically throttles or locks ad spend if product inventory runout drops below the configured buffer (e.g. $<5$ days).

---

## 🏗️ System Architecture

```
ascend/
├── backend/
│   ├── app/
│   │   ├── config.py             # Settings, env vars, default policy guardrails
│   │   ├── database.py           # SQLAlchemy async engine & session management
│   │   ├── main.py               # FastAPI entrypoint, lifespan events, CORS
│   │   ├── models/               # Domain entities (Campaign, SKU, MetricRecord, DecisionRecord, PolicyConfig)
│   │   ├── connectors/           # Meta, Google, Amazon, Shopify API adapters + Telemetry Simulator
│   │   ├── engine/               # Anomaly Detector, Budget Optimizer, Risk Evaluator, Reasoning Agent,
│   │   │                         # Execution Dispatcher, Feedback Loop Evaluator, Decision Pipeline
│   │   └── routers/              # Analytics, Decisions, Anomalies, Policies, Outcomes, Simulator
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/           # CommandCenter, DecisionInbox, AnomalyExplorer, OutcomeTracker,
│   │   │                         # PolicySettings, ScenarioBar
│   │   └── lib/                  # API client bindings
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml            # PostgreSQL / TimescaleDB + Backend + Frontend
├── run_dev.sh                    # 1-Click local development launcher
└── README.md
```

---

## 🚀 Quickstart

### 1. Run with 1 Command (Zero Docker Required)
ASCEND runs immediately on macOS/Linux out of the box with zero external database dependencies:

```bash
./run_dev.sh
```

- **Dashboard:** [http://localhost:3000](http://localhost:3000)
- **API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run with Docker Compose (PostgreSQL / TimescaleDB)
```bash
docker compose up --build
```

---

## 🧪 Interactive D2C Scenarios Built-In

The top scenario bar in the dashboard allows you to inject real-world D2C challenges and observe the engine's response in real-time:

1. **Hero SKU Stockout Danger:** Drains inventory of Hero Lumen Serum to 8 units while ad campaigns spend \$1,250/day. ASCEND detects the stockout hazard and generates an emergency ad spend protection pause.
2. **Meta Creative Burnout:** Spikes audience frequency to 5.2x, doubles CPM, and degrades CTR. ASCEND detects creative fatigue and executes ad set pauses to save budget.
3. **Cross-Channel Arbitrage:** Amazon & Google ROAS surges to $>5.0\text{x}$ while Meta degrades. ASCEND calculates optimal capital reallocation.
4. **Margin Compression Alert:** An uncoordinated discount code cuts Net Contribution Margin below the 15% floor. ASCEND detects unit economics erosion.
5. **Run Autonomous Cycle:** Executes the neuro-symbolic reasoning loop, auto-executing Tier 1 adjustments and populating the Decision Inbox.
# ascend
# ascend

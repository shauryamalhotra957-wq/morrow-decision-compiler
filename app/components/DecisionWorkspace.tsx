"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  rankEvidence,
  simulateDecision,
  stableScenarioSeed,
  type EvidenceRecord,
  type SimulationInputs,
} from "@/lib/decision-engine";

const evidence: EvidenceRecord[] = [
  {
    id: "EV-1042",
    title: "DACH buyer signal: compliance is the wedge",
    excerpt:
      "Across 14 late-stage interviews, auditability displaced raw automation speed as the primary buying criterion. Nine buyers accepted a 12–18% premium for EU-only processing.",
    source: "Research / Buyer synthesis",
    timestamp: "18 JUL 2026",
    stance: "support",
    trust: 94,
    tags: ["dach", "compliance", "pricing", "demand"],
  },
  {
    id: "EV-0997",
    title: "Pipeline quality decays past the first cohort",
    excerpt:
      "The first 22 accounts have founder-led pull. The next 61 show weaker urgency and a longer security review. Forecast should haircut second-cohort conversion by 31%.",
    source: "Revenue / Cohort model",
    timestamp: "17 JUL 2026",
    stance: "challenge",
    trust: 91,
    tags: ["pipeline", "conversion", "sales", "risk"],
  },
  {
    id: "EV-1008",
    title: "EU inference cluster can meet the September window",
    excerpt:
      "The capacity reservation clears the launch threshold if architecture freeze lands by August 4. Each week of delay adds roughly €74k in parallel-run cost.",
    source: "Infrastructure / Capacity memo",
    timestamp: "16 JUL 2026",
    stance: "support",
    trust: 88,
    tags: ["infrastructure", "speed", "cost", "eu"],
  },
  {
    id: "EV-0961",
    title: "Regulatory interpretation remains non-uniform",
    excerpt:
      "Counsel in Germany and France disagree on whether the workflow is a deployer-side high-risk system. A reversible launch boundary reduces expected exposure by 43%.",
    source: "Legal / External counsel",
    timestamp: "15 JUL 2026",
    stance: "challenge",
    trust: 96,
    tags: ["regulation", "legal", "risk", "staging"],
  },
  {
    id: "EV-0924",
    title: "Competitor telemetry: category language is moving",
    excerpt:
      "Three adjacent vendors repositioned from copilots to governed agents in six weeks. None currently provides evidence-level counterfactual audit trails.",
    source: "Strategy / Market telemetry",
    timestamp: "14 JUL 2026",
    stance: "neutral",
    trust: 82,
    tags: ["competitors", "positioning", "market", "agents"],
  },
  {
    id: "EV-0892",
    title: "Support capacity fails above 38 concurrent pilots",
    excerpt:
      "Current field engineering coverage sustains 30 pilots with a 15% buffer. Hiring two senior solutions architects moves the constraint to 47.",
    source: "Operations / Capacity model",
    timestamp: "12 JUL 2026",
    stance: "challenge",
    trust: 89,
    tags: ["hiring", "capacity", "operations", "execution"],
  },
];

const navItems = [
  { id: "command", label: "Command", glyph: "⌁" },
  { id: "futures", label: "Futures", glyph: "⑂" },
  { id: "evidence", label: "Evidence", glyph: "≡" },
  { id: "lab", label: "Lab", glyph: "∴" },
] as const;

const futureNodes = [
  {
    id: "A",
    title: "STAGED ENTRY",
    detail: "12 accounts · reversible boundary",
    value: "+€18.4M",
    probability: 74,
    tone: "acid",
  },
  {
    id: "B",
    title: "FULL COMMIT",
    detail: "61 accounts · category capture",
    value: "+€31.2M",
    probability: 48,
    tone: "violet",
  },
  {
    id: "C",
    title: "DELAY / DE-RISK",
    detail: "90 days · evidence expansion",
    value: "+€7.1M",
    probability: 81,
    tone: "slate",
  },
] as const;

const initialInputs: SimulationInputs = {
  readiness: 78,
  speed: 68,
  evidenceDepth: 83,
  riskAppetite: 57,
};

type ActiveView = (typeof navItems)[number]["id"];

const viewTargets: Record<ActiveView, string> = {
  command: "view-command",
  futures: "view-futures",
  evidence: "view-evidence",
  lab: "view-lab",
};

function MetricDial({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric-dial" style={{ "--dial": `${value * 3.6}deg` } as React.CSSProperties}>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  detail,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  detail: string;
}) {
  return (
    <label className="control-row">
      <span className="control-heading">
        <span>{label}</span>
        <output>{value}</output>
      </span>
      <input
        type="range"
        min="20"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="control-detail">{detail}</span>
    </label>
  );
}

export function DecisionWorkspace() {
  const [activeView, setActiveView] = useState<ActiveView>("command");
  const [selectedFuture, setSelectedFuture] = useState("A");
  const [query, setQuery] = useState("compliance risk and launch timing");
  const [inputs, setInputs] = useState(initialInputs);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const simulation = useMemo(
    () => simulateDecision(inputs, stableScenarioSeed(inputs)),
    [inputs],
  );
  const rankedEvidence = useMemo(
    () => rankEvidence(query, evidence, 4),
    [query],
  );
  const strongestCounterSignal = rankedEvidence.find(
    (item) => item.stance === "challenge",
  );

  const navigateToView = useCallback((view: ActiveView) => {
    setActiveView(view);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(viewTargets[view]);
      if (!target) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      target.focus({ preventScroll: true });
    });
  }, []);

  const focusEvidenceSearch = useCallback(() => {
    navigateToView("evidence");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    });
  }, [navigateToView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusEvidenceSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusEvidenceSearch]);

  const updateInput = useCallback(
    (key: keyof SimulationInputs, value: number) => {
      setInputs((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const saveSnapshot = async () => {
    setIsSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Project Nightfall — DACH entry",
          question:
            "Should we launch Atlas Mesh into the DACH mid-market before Q4?",
          confidence: simulation.confidence,
          recommendation: simulation.recommendation,
          scenario: { inputs, simulation },
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setNotice("Decision snapshot sealed in the audit ledger.");
    } catch {
      setNotice("Snapshot could not be sealed. The simulation is still live.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportBrief = () => {
    const brief = {
      generatedAt: new Date().toISOString(),
      system: "Morrow Decision Compiler v0.1",
      decision:
        "Should we launch Atlas Mesh into the DACH mid-market before Q4?",
      recommendation: simulation.recommendation,
      simulation,
      assumptions: inputs,
      evidence: rankedEvidence,
    };
    const blob = new Blob([JSON.stringify(brief, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "morrow-nightfall-brief.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Auditable decision brief exported.");
  };

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Primary navigation">
        <button
          className="brand-mark"
          aria-label="Morrow command center"
          onClick={() => navigateToView("command")}
        >
          M<span>↗</span>
        </button>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              onClick={() => navigateToView(item.id)}
              aria-label={item.label}
              aria-pressed={activeView === item.id}
              aria-controls={viewTargets[item.id]}
            >
              <span>{item.glyph}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
        <div className="rail-footer">
          <span className="live-dot" />
          <small>LIVE</small>
          <div className="avatar">SM</div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="wordmark">MORROW<span>/OS</span></div>
          <div className="topbar-context">
            <span className="context-code">DECISION // 0042</span>
            <span className="divider" />
            <span>PROJECT NIGHTFALL</span>
          </div>
          <div className="topbar-actions">
            <button className="key-button" onClick={focusEvidenceSearch}>
              Search <kbd>⌘ K</kbd>
            </button>
            <button className="outline-button" onClick={exportBrief}>Export brief</button>
            <button className="primary-button" onClick={saveSnapshot} disabled={isSaving}>
              {isSaving ? "Sealing…" : "Seal decision"}
            </button>
          </div>
        </header>

        <section className="decision-header">
          <div>
            <p className="eyebrow"><span /> ACTIVE DECISION</p>
            <h1>Should we launch Atlas Mesh into the<br />DACH mid-market before Q4?</h1>
          </div>
          <div className="decision-meta">
            <div><span>OWNER</span><strong>Strategy / S. Malhotra</strong></div>
            <div><span>REVERSIBILITY</span><strong className="warning-text">MEDIUM · 63</strong></div>
            <div><span>DECISION WINDOW</span><strong>19 DAYS</strong></div>
          </div>
        </section>

        {notice && (
          <div className="notice" role="status">
            <span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
          </div>
        )}

        <div className="content-grid">
          <section
            id="view-command"
            tabIndex={-1}
            className={`signal-panel panel view-anchor ${activeView === "command" ? "active-view" : ""}`}
            aria-labelledby="view-command-title"
          >
            <div className="panel-heading">
              <div>
                <p className="eyebrow">DECISION PULSE</p>
                <h2 id="view-command-title">{simulation.recommendation === "STAGE" ? "Staged entry is dominant." : simulation.recommendation === "EXECUTE" ? "Execution threshold cleared." : "Evidence threshold not cleared."}</h2>
              </div>
              <span className="freshness">UPDATED 12s AGO</span>
            </div>
            <div className="signal-body">
              <MetricDial value={simulation.successProbability} label="VIABILITY" />
              <div className="signal-copy">
                <p>
                  The reversible 12-account cohort preserves <strong>81% of category upside</strong> while containing regulatory exposure. Full commitment destroys option value before the legal signal resolves.
                </p>
                <div className="signal-chips">
                  <span><i className="positive" /> +12 demand signals</span>
                  <span><i className="negative" /> −4 execution constraints</span>
                  <span><i className="neutral" /> 2 contradictions</span>
                </div>
              </div>
            </div>
            <div className="recommendation-bar">
              <div><span>COMPILED ACTION</span><strong>Launch cohort A · cap at 12 · review on day 21</strong></div>
              <button onClick={() => navigateToView("lab")}>Stress-test action <span>→</span></button>
            </div>
          </section>

          <section className="projection-panel panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">OUTCOME ENVELOPE</p>
                <h3>18-month value at risk</h3>
              </div>
              <span className="model-tag">MCS · 2.4K RUNS</span>
            </div>
            <div className="value-row">
              <div><span>EXPECTED</span><strong>€{simulation.expectedValue}M</strong></div>
              <div><span>DOWNSIDE P10</span><strong className="negative-text">−€{simulation.downside}M</strong></div>
            </div>
            <div className="distribution" aria-label="Outcome probability distribution">
              {[18, 28, 44, 63, 78, 92, 86, 69, 48, 31, 19].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
              <span className="zero-line">0</span>
            </div>
            <div className="range-labels"><span>−€16M</span><span>€{simulation.spread.expected}M MEDIAN</span><span>+€39M</span></div>
          </section>

          <section
            id="view-futures"
            tabIndex={-1}
            className={`futures-panel panel view-anchor ${activeView === "futures" ? "active-view" : ""}`}
            aria-labelledby="view-futures-title"
          >
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">CAUSAL FUTURES</p>
                <h3 id="view-futures-title">Three viable branches</h3>
              </div>
              <button className="text-button" onClick={() => navigateToView("futures")}>Expand map ↗</button>
            </div>
            <div className="future-map">
              <div className="origin-node"><span>NOW</span><strong>GO / NO-GO</strong></div>
              <div className="branch-lines" aria-hidden="true"><i /><i /><i /></div>
              <div className="future-options">
                {futureNodes.map((node) => (
                  <button
                    key={node.id}
                    className={`future-card ${node.tone} ${selectedFuture === node.id ? "selected" : ""}`}
                    onClick={() => setSelectedFuture(node.id)}
                    aria-pressed={selectedFuture === node.id}
                  >
                    <span className="future-index">{node.id}</span>
                    <div><strong>{node.title}</strong><small>{node.detail}</small></div>
                    <div className="future-numbers"><strong>{node.value}</strong><span>{node.probability}% p</span></div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            id="view-lab"
            tabIndex={-1}
            className={`lab-panel panel view-anchor ${activeView === "lab" ? "active-view" : ""}`}
            aria-labelledby="view-lab-title"
          >
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">COUNTERFACTUAL LAB</p>
                <h3 id="view-lab-title">Move the world. Watch the decision.</h3>
              </div>
              <span className={`verdict ${simulation.recommendation.toLowerCase()}`}>{simulation.recommendation}</span>
            </div>
            <div className="lab-content">
              <div className="controls">
                <Slider label="Execution readiness" value={inputs.readiness} onChange={(value) => updateInput("readiness", value)} detail="Team, capacity, operating maturity" />
                <Slider label="Launch velocity" value={inputs.speed} onChange={(value) => updateInput("speed", value)} detail="Time advantage vs. coordination debt" />
                <Slider label="Evidence depth" value={inputs.evidenceDepth} onChange={(value) => updateInput("evidenceDepth", value)} detail="Coverage, freshness, source diversity" />
                <Slider label="Risk appetite" value={inputs.riskAppetite} onChange={(value) => updateInput("riskAppetite", value)} detail="Board-approved downside tolerance" />
              </div>
              <div className="live-model">
                <span>LIVE MODEL</span>
                <strong>{simulation.successProbability}<sup>%</sup></strong>
                <small>SUCCESS PROBABILITY</small>
                <div className="confidence-bar"><i style={{ width: `${simulation.confidence}%` }} /></div>
                <p>{simulation.confidence}% epistemic confidence</p>
              </div>
            </div>
          </section>

          <section
            id="view-evidence"
            tabIndex={-1}
            className={`evidence-panel panel view-anchor ${activeView === "evidence" ? "active-view" : ""}`}
            aria-labelledby="view-evidence-title"
          >
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">EVIDENCE LEDGER</p>
                <h3 id="view-evidence-title">Every claim has a spine.</h3>
              </div>
              <span className="sources-count">{evidence.length} SOURCES · 2 CONFLICTS</span>
            </div>
            <div className="evidence-search">
              <span>⌕</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Interrogate the evidence…"
                aria-label="Search the evidence ledger"
              />
              <kbd>RAG</kbd>
            </div>
            <div className="evidence-list">
              {rankedEvidence.map((item) => (
                <article key={item.id} className="evidence-item">
                  <div className="evidence-score">
                    <strong>{item.relevance}</strong><span>MATCH</span>
                  </div>
                  <div className="evidence-copy">
                    <div className="evidence-title"><span className={`stance ${item.stance}`} /> <strong>{item.title}</strong></div>
                    <p>{item.excerpt}</p>
                    <div><span>{item.id}</span><span>{item.source}</span><span>{item.timestamp}</span></div>
                  </div>
                  <div className="trust-score"><span>TRUST</span><strong>{item.trust}</strong></div>
                </article>
              ))}
            </div>
          </section>

          <aside className="red-team-panel panel">
            <div className="red-team-mark">R/</div>
            <p className="eyebrow">RED TEAM INTERCEPT</p>
            <h3>What would make this decision wrong?</h3>
            <blockquote>
              “{strongestCounterSignal?.title ?? "The next cohort fails to reproduce founder-led demand."}”
            </blockquote>
            <ul>
              <li><span>01</span> Pipeline urgency may be a founder-network artifact.</li>
              <li><span>02</span> Cross-border legal variance widens after launch.</li>
              <li><span>03</span> Field engineering becomes the true bottleneck.</li>
            </ul>
            <button onClick={() => { setQuery("conversion regulation capacity risk"); navigateToView("evidence"); }}>Inspect disconfirming evidence <span>→</span></button>
          </aside>
        </div>

        <footer className="statusbar">
          <span><i className="live-dot" /> MORROW CORE ONLINE</span>
          <span>6 SOURCES INDEXED</span>
          <span>MODEL: CAUSAL-MCS/0.4</span>
          <span>LAST COMPILED 23 JUL 2026 · 09:42 IST</span>
          <strong>PRIVATE WORKSPACE</strong>
        </footer>
      </main>
    </div>
  );
}

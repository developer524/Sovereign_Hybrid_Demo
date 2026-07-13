import React, { useEffect, useState } from "react";
import { GlobeCdn } from "./GlobeCdn";

const F_SERIF = "'Fraunces', Georgia, serif";
const F_SANS  = "'DM Sans', system-ui, sans-serif";
const F_MONO  = "'JetBrains Mono', monospace";

type Confidence = "high" | "moderate";

type FeedEvent = {
  id: string;
  confidence: Confidence;
  tag: string;
  horizon: string;
  headline: string;
  chain: string[];
  source: string;
};

type CausalEdge = {
  id: number;
  document_name: string;
  cause: string;
  effect: string;
  sector: string | null;
  confidence: number;
  time_horizon: string | null;
};

type CausalChain = {
  edges: CausalEdge[];
};

/* Demo chains — in production these stream from the Sovereign appliance's
   /api/causal-graph endpoint. Content mirrors the treasury-desk corpus. */
const DEMO_CHAINS: CausalChain[] = [
  { edges: [
    { id: 1, document_name: "BTC_treasury_policy.pdf",
      cause: "Fed signals two additional rate cuts before Q4",
      effect: "USD funding costs fall", sector: "macro", confidence: 0.81, time_horizon: "1–2 quarters" },
    { id: 2, document_name: "hedge_book_snapshot.xlsx",
      cause: "USD funding costs fall",
      effect: "BTC treasury carry turns positive", sector: "treasury", confidence: 0.74, time_horizon: null },
  ]},
  { edges: [
    { id: 3, document_name: "counterparty_exposure_memo.pdf",
      cause: "Prime broker tightens rehypothecation limits",
      effect: "Collateral demand rises across desks", sector: "credit", confidence: 0.69, time_horizon: "2–4 weeks" },
    { id: 4, document_name: "ISDA_confirms_Q2.pdf",
      cause: "Collateral demand rises across desks",
      effect: "CSA thresholds renegotiated", sector: "credit", confidence: 0.62, time_horizon: null },
  ]},
  { edges: [
    { id: 5, document_name: "board_pack_2026.pdf",
      cause: "EU MiCA enforcement phase begins",
      effect: "Custody venue consolidation accelerates", sector: "regulatory", confidence: 0.77, time_horizon: "2 quarters" },
    { id: 6, document_name: "BTC_treasury_policy.pdf",
      cause: "Custody venue consolidation accelerates",
      effect: "Counterparty concentration risk breaches policy cap", sector: "treasury", confidence: 0.71, time_horizon: null },
  ]},
  { edges: [
    { id: 7, document_name: "hedge_book_snapshot.xlsx",
      cause: "Implied vol term structure inverts on BTC options",
      effect: "Hedge roll costs spike near-dated", sector: "derivatives", confidence: 0.58, time_horizon: "1–2 weeks" },
  ]},
];

function mapChainToFeedEvent(chain: CausalChain): FeedEvent {
  const hops = chain.edges;
  const first = hops[0];
  // Weakest hop sets the chain's overall confidence -- a multi-hop chain is
  // only as trustworthy as its shakiest link, never its strongest.
  const minConfidence = Math.min(...hops.map((h) => h.confidence));
  const sector = hops.find((h) => h.sector)?.sector ?? null;
  const documentNames = Array.from(new Set(hops.map((h) => h.document_name)));

  return {
    id: String(first.id),
    confidence: minConfidence >= 0.66 ? "high" : "moderate",
    tag: sector ? sector.toUpperCase() : "GENERAL",
    horizon: first.time_horizon ?? "—",
    headline: first.cause,
    chain: hops.map((h) => h.effect),
    source: documentNames.join(", "),
  };
}

const CONFIDENCE_DOT: Record<Confidence, string> = {
  high: "#1E40AF",
  moderate: "#94a3b8",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
};

function utcNow() {
  return new Date().toISOString().slice(11, 19);
}

export function ImpactGraph({ dm }: { dm: boolean }) {
  const [paused, setPaused] = useState(false);
  const [updated, setUpdated] = useState(() => utcNow());

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setUpdated(utcNow()), 15_000);
    return () => clearInterval(id);
  }, [paused]);

  const chains = DEMO_CHAINS;
  const feed = chains.map(mapChainToFeedEvent);
  // Metrics are computed from every hop across every chain, not one-per-chain,
  // so a 3-hop chain counts its 3 documents/sectors/confidences, not just 1.
  const allEdges = chains.flatMap((c) => c.edges);
  const documentCount = new Set(allEdges.map((e) => e.document_name)).size;
  const sectorCount = new Set(allEdges.filter((e) => e.sector).map((e) => e.sector)).size;
  const avgConfidence =
    allEdges.length > 0
      ? Math.round((allEdges.reduce((sum, e) => sum + e.confidence, 0) / allEdges.length) * 100)
      : null;

  /* theme */
  const card    = dm ? "#17152E" : "#FFFFFF";
  const border  = dm ? "rgba(165,180,252,0.09)" : "rgba(26,18,8,0.09)";
  const ink     = dm ? "#E8EDF5" : "#18120A";
  const mid     = dm ? "#8A94A6" : "#6B5F52";
  const dim     = dm ? "#4E5668" : "#A89A8C";
  const panelBg = dm ? "rgba(255,255,255,0.03)" : "#FAFAF7";
  const chipBg  = dm ? "rgba(255,255,255,0.07)" : "rgba(26,18,8,0.06)";

  return (
    <div style={{
      borderRadius: 22, background: card, border: `1px solid ${border}`, overflow: "hidden",
      boxShadow: dm
        ? "0 0 0 1px rgba(255,255,255,0.05),0 8px 32px rgba(0,0,0,0.3)"
        : "0 8px 40px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr" }}>

        {/* ── Globe panel ── */}
        <div style={{ padding: "26px 28px", borderRight: `1px solid ${border}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center",
                        justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <div>
              <p style={{ fontFamily: F_MONO, fontSize: 11, textTransform: "uppercase",
                          letterSpacing: "0.18em", color: mid }}>
                Global Impact Graph · {feed.length} active
              </p>
              <h2 style={{ fontFamily: F_SERIF, fontStyle: "italic", fontWeight: 300,
                           fontSize: 24, color: ink, marginTop: 4, letterSpacing: "-0.02em" }}>
                Live signal propagation
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16,
                          fontFamily: F_SANS, fontSize: 11, color: mid }}>
              <Legend dot="#B91C1C" label="Negative" />
              <Legend dot="#15803D" label="Positive" />
              <Legend dot="#1E40AF" label="Neutral" />
            </div>
          </div>

          <div style={{ position: "relative", margin: "0 auto", width: "100%", maxWidth: 520 }}>
            <GlobeCdn speed={0.004} dark={dm} />
          </div>

          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 6 }}>
            <h3 style={{ fontFamily: F_SANS, fontSize: 30, fontWeight: 800,
                         letterSpacing: "-0.03em", color: ink }}>
              Agentix
            </h3>
            <p style={{ fontFamily: F_SERIF, fontStyle: "italic", fontWeight: 300,
                        fontSize: 20, minHeight: "1.35em", display: "flex", alignItems: "baseline" }}>
              <GreenRotatingWord />
            </p>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <Metric label="Signals"        value={String(feed.length)}     dm={dm} />
            <Metric label="Documents"      value={String(documentCount)}   dm={dm} />
            <Metric label="Sectors"        value={String(sectorCount)}     dm={dm} />
            <Metric label="Avg confidence" value={avgConfidence !== null ? `${avgConfidence}%` : "—"} dm={dm} />
          </div>
        </div>

        {/* ── Live feed ── */}
        <div style={{ display: "flex", flexDirection: "column", background: panelBg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: `1px solid ${border}`, padding: "16px 22px" }}>
            <p style={{ fontFamily: F_MONO, fontSize: 11, textTransform: "uppercase",
                        letterSpacing: "0.18em", color: mid }}>
              Live Feed
            </p>
            <span style={{ borderRadius: 999, background: chipBg, padding: "3px 10px",
                           fontFamily: F_MONO, fontSize: 10, textTransform: "uppercase",
                           letterSpacing: "0.08em", color: mid }}>
              {paused ? "Paused" : "Streaming"}
            </span>
          </div>

          <ul style={{ flex: 1, overflowY: "auto", listStyle: "none", maxHeight: 560 }}>
            {feed.map((event, i) => (
              <li key={event.id} style={{ padding: "16px 22px",
                                          borderBottom: i < feed.length - 1 ? `1px solid ${border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ marginTop: 6, width: 8, height: 8, flexShrink: 0,
                                 borderRadius: "50%", background: CONFIDENCE_DOT[event.confidence] }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <span style={{ borderRadius: 5, background: chipBg, padding: "2px 8px",
                                     fontFamily: F_MONO, fontSize: 10, textTransform: "uppercase",
                                     letterSpacing: "0.08em", color: mid }}>
                        {event.tag}
                      </span>
                      <span style={{ fontFamily: F_MONO, fontSize: 10, color: dim }}>{event.horizon}</span>
                      <span style={{ fontFamily: F_MONO, fontSize: 10, color: dim }}>
                        {CONFIDENCE_LABEL[event.confidence]}
                      </span>
                    </div>
                    <p style={{ marginTop: 8, fontFamily: F_SANS, fontSize: 13,
                                lineHeight: 1.4, color: ink }}>{event.headline}</p>
                    <p style={{ marginTop: 8, fontFamily: F_MONO, fontSize: 11, color: mid, lineHeight: 1.6 }}>
                      {event.chain.slice(0, -1).join(" -> ")}{event.chain.length > 1 ? " -> " : ""}
                      <span style={{ color: "#15803D" }}>
                        {event.chain[event.chain.length - 1]}
                      </span>
                    </p>
                    <p style={{ marginTop: 4, fontFamily: F_MONO, fontSize: 10, color: dim }}>
                      Source: {event.source}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderTop: `1px solid ${border}`, background: card, padding: "12px 22px" }}>
            <span style={{ fontFamily: F_MONO, fontSize: 10, textTransform: "uppercase",
                           letterSpacing: "0.08em", color: dim }}>
              Updated {updated} UTC
            </span>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              style={{ borderRadius: 10, border: `1px solid ${border}`, background: "transparent",
                       padding: "6px 12px", fontFamily: F_MONO, fontSize: 11, color: mid,
                       cursor: "pointer", transition: "color .15s,border-color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = mid)}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROTATING_WORDS = ["Market Intelligence", "Risk Detection", "Signal Analysis"];

function GreenRotatingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    let swapTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setPhase("exit");
      swapTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setPhase("enter");
      }, 350);
    }, 2200);
    return () => {
      clearInterval(interval);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
  }, []);

  return (
    <span style={{ position: "relative", display: "inline-block", minWidth: "17ch" }}>
      <style>{`
        @keyframes word-enter { from { opacity: 0; transform: translateY(8px); }
                                to   { opacity: 1; transform: translateY(0); } }
        @keyframes word-exit  { from { opacity: 1; transform: translateY(0); }
                                to   { opacity: 0; transform: translateY(-8px); } }
      `}</style>
      <span
        key={`${index}-${phase}`}
        style={{ display: "inline-block", color: "#15803D",
                 animation: `${phase === "enter" ? "word-enter" : "word-exit"} .35s ease forwards` }}
      >
        {ROTATING_WORDS[index]}
      </span>
    </span>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
      {label}
    </span>
  );
}

function Metric({ label, value, dm }: { label: string; value: string; dm: boolean }) {
  return (
    <div style={{
      borderRadius: 12, padding: "12px 14px",
      border: `1px solid ${dm ? "rgba(255,255,255,0.1)" : "rgba(26,18,8,0.06)"}`,
      background: dm ? "#1c1c2e" : "#FAFAF7",
    }}>
      <p style={{ fontFamily: F_MONO, fontSize: 10, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: dm ? "#8A94A6" : "#6B5F52" }}>{label}</p>
      <p style={{ marginTop: 4, fontFamily: F_SERIF, fontStyle: "italic", fontWeight: 300,
                  fontSize: 20, color: dm ? "#E8EDF5" : "#18120A" }}>{value}</p>
    </div>
  );
}

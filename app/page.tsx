"use client";

import { useEffect, useMemo, useState } from "react";
import { Board } from "@/components/Board";
import { Keyboard } from "@/components/Keyboard";
import { Modal } from "@/components/Modal";
import {
  GameState,
  getLAKey,
  newGame,
  validateGuess,
  applyGuess,
  overallLetterKnowledge,
  shareText,
  countRack,
} from "@/lib/game";

type Stats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  winDist: Record<string, number>; // "1".."8"
  lastPlayedKey?: string;
};

const STATS_KEY = "rackle_stats_v1";

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, winDist: {} };
    return JSON.parse(raw) as Stats;
  } catch {
    return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, winDist: {} };
  }
}

function saveStats(s: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}

function stateKey(dateKey: string) {
  return `rackle_state_${dateKey}_v1`;
}

function loadState(dateKey: string): GameState | null {
  try {
    const raw = localStorage.getItem(stateKey(dateKey));
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

function saveState(state: GameState) {
  localStorage.setItem(stateKey(state.dateKey), JSON.stringify(state));
}

export default function Page() {
  const [dateKey, setDateKey] = useState<string>("");
  const [state, setState] = useState<GameState | null>(null);
  const [input, setInput] = useState<string>("");
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "error" | "muted" } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    const dk = getLAKey();
    setDateKey(dk);
    const loaded = loadState(dk);
    if (loaded) {
      setState(loaded);
    } else {
      const fresh = newGame(dk);
      setState(fresh);
      saveState(fresh);
    }
  }, []);

  const knowledge = useMemo(() => overallLetterKnowledge(state?.guesses ?? []), [state?.guesses]);
  const canPlay = state?.status === "playing";

  function showToast(text: string, kind: "ok" | "error" | "muted" = "muted") {
    setToast({ text, kind });
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 2200);
  }

  function onPickLetter(ch: string) {
    if (!state || !canPlay) return;
    if (input.length >= 5) return;
    setInput((prev) => (prev + ch).toUpperCase());
  }

  function onBackspace() {
    if (!canPlay) return;
    setInput((v) => v.slice(0, -1));
  }

  function updateStatsOnFinish(finalState: GameState) {
    const stats = loadStats();
    const alreadyCounted = stats.lastPlayedKey === finalState.dateKey;
    if (alreadyCounted) return;

    stats.played += 1;
    stats.lastPlayedKey = finalState.dateKey;

    if (finalState.status === "won") {
      stats.wins += 1;
      stats.currentStreak += 1;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
      const k = String(finalState.guesses.length);
      stats.winDist[k] = (stats.winDist[k] ?? 0) + 1;
    } else {
      stats.currentStreak = 0;
    }

    saveStats(stats);
  }

  function onEnter() {
    if (!state || !canPlay) return;
    const w = input.trim().toLowerCase();
    const err = validateGuess(w, state.rack);
    if (err) {
      showToast(err, "error");
      return;
    }

    const next = applyGuess(state, w);
    setState(next);
    saveState(next);
    setInput("");

    if (next.status !== "playing") {
      updateStatsOnFinish(next);
      setStatsOpen(true);
    }
  }

  async function onShare() {
    if (!state) return;
    const text = shareText(state);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied results to clipboard.", "ok");
    } catch {
      showToast("Couldn't copy. (Browser permissions)", "error");
    }
  }

  function onReset() {
    if (!dateKey) return;
    const fresh = newGame(dateKey);
    setState(fresh);
    saveState(fresh);
    setInput("");
    showToast("Reset today's run.", "muted");
  }

  const rackLeft = state ? countRack(state.rack) : 0;
  const stats = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return loadStats();
    } catch {
      return null;
    }
  }, [statsOpen]);

  return (
    <div className="container">
      <div className="topbar">
        <div className="title">
          <h1>Rackle</h1>
         </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => setHelpOpen(true)}>How to play</button>
          <button className="btn" onClick={() => setStatsOpen(true)}>Stats</button>
          <button className="btn" onClick={onShare} disabled={!state || state.guesses.length === 0}>Share</button>
          <button className="btn" onClick={onReset}>Reset</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <Board guesses={state?.guesses ?? []} currentInput={canPlay ? input : ""} maxRounds={state?.maxRounds ?? 5} />
          <div className={"message " + (toast?.kind === "error" ? "error" : toast?.kind === "ok" ? "ok" : "")}>
            {toast?.text ??
              (state?.message ??
                "Build a word using only letters in your rack. Gray tiles burn; you draw 2 new letters each round.")}
          </div>

          <div className="inputRow">
            <div className="pill">Input: <span style={{ letterSpacing: 2 }}>{input.padEnd(5, "•")}</span></div>
            <div className="pill">Rounds: {state ? state.guesses.length : 0}/{state ? state.maxRounds : 5}</div>
            <div className="pill">Rack left: {rackLeft}</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Keyboard
              rack={state?.rack ?? {}}
              knowledge={knowledge}
              onLetter={onPickLetter}
              onEnter={onEnter}
              onBackspace={onBackspace}
              disabled={!canPlay}
            />
          </div>

          <div className="footerNote">
          </div>
        </div>
      </div>

      <Modal open={helpOpen} title="How to play" onClose={() => setHelpOpen(false)}>
        <ul>
          <li>Guess the daily 5-letter word in <b>5</b> rounds.</li>
          <li>You can only use letters currently in your <b>rack</b> (counts matter).</li>
          <li>After each guess: <b>gray</b> letters are burned (removed from your rack, per instance), while <b>yellow</b>/<b>green</b> tiles stay.</li>
          <li>Then you automatically <b>draw 2 new letters</b>.</li>
          <li>The initial rack always contains the letters needed for today’s answer (so it’s solvable).</li>
        </ul>
        <p style={{ marginTop: 10 }}>
          Tip: early on, you can “probe” with risky letters, but burning too many tiles can leave you with awkward racks later.
        </p>
      </Modal>

      <Modal open={statsOpen} title="Stats" onClose={() => setStatsOpen(false)}>
        {!stats ? (
          <p>Stats unavailable.</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div className="pill">Played: {stats.played}</div>
              <div className="pill">Wins: {stats.wins}</div>
              <div className="pill">Win%: {stats.played ? Math.round((stats.wins / stats.played) * 100) : 0}</div>
              <div className="pill">Streak: {stats.currentStreak}</div>
              <div className="pill">Max streak: {stats.maxStreak}</div>
            </div>

            <hr className="hr" />

            <p><b>Win distribution</b></p>
            <div style={{ display: "grid", gap: 6 }}>
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => {
                const c = stats.winDist[String(n)] ?? 0;
                return (
                  <div key={n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 22, color: "var(--muted)" }}>{n}</div>
                    <div style={{
                      flex: 1,
                      height: 12,
                      borderRadius: 999,
                      border: "1px solid rgba(42,42,54,0.9)",
                      background: "rgba(27,27,35,0.65)",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${stats.wins ? Math.max(4, (c / stats.wins) * 100) : 0}%`,
                        background: "rgba(122,162,255,0.65)"
                      }} />
                    </div>
                    <div style={{ width: 30, textAlign: "right", color: "var(--muted)" }}>{c}</div>
                  </div>
                );
              })}
            </div>

            <div className="actions" style={{ justifyContent: "space-between" }}>
              <button className="btn" onClick={onShare} disabled={!state || state.guesses.length === 0}>Copy Share Text</button>
              <button className="btn" onClick={() => setHelpOpen(true)}>Rules</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
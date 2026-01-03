import { WORDS } from "./words";
import { seededInt, seededLetter } from "./prng";

export type TileStatus = "correct" | "present" | "absent";
export type Guess = { word: string; statuses: TileStatus[] };

export type GameStatus = "playing" | "won" | "lost";

export type GameState = {
  dateKey: string; // YYYY-MM-DD in America/Los_Angeles
  answer: string; // lowercase 5 letters
  rack: Record<string, number>; // uppercase letter -> count
  guesses: Guess[];
  maxRounds: number;
  rackSizeStart: number;
  drawPerRound: number;
  status: GameStatus;
  message?: string;
};

const SALT = "rackle:v1:core";

export function getLAKey(d: Date = new Date()): string {
  // YYYY-MM-DD in America/Los_Angeles
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // en-CA => 2026-01-02
}

export function pickAnswer(dateKey: string): string {
  const idx = seededInt(`${SALT}:answer:${dateKey}`, WORDS.length);
  return WORDS[idx];
}

function addToRack(rack: Record<string, number>, letter: string, n = 1) {
  rack[letter] = (rack[letter] ?? 0) + n;
}

export function countRack(rack: Record<string, number>): number {
  return Object.values(rack).reduce((a, b) => a + b, 0);
}

export function buildInitialRack(dateKey: string, answer: string, rackSizeStart: number): Record<string, number> {
  const rack: Record<string, number> = {};
  // Ensure the rack contains all letters needed for the answer (including duplicates).
  for (const ch of answer.toUpperCase()) addToRack(rack, ch, 1);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let i = 0;
  while (countRack(rack) < rackSizeStart && i < 2000) {
    const ch = letters[seededInt(`${SALT}:init:${dateKey}:${i}`, letters.length)];
    addToRack(rack, ch, 1);
    i++;
  }
  return rack;
}

export function canMakeWordFromRack(wordUpper: string, rack: Record<string, number>): boolean {
  const need: Record<string, number> = {};
  for (const ch of wordUpper) need[ch] = (need[ch] ?? 0) + 1;
  for (const [ch, n] of Object.entries(need)) {
    if ((rack[ch] ?? 0) < n) return false;
  }
  return true;
}

export function validateGuess(word: string, rack: Record<string, number>): string | null {
  const w = word.trim().toLowerCase();
  if (!/^[a-z]{5}$/.test(w)) return "Enter a 5-letter word.";
  const upper = w.toUpperCase();
  if (!canMakeWordFromRack(upper, rack)) return "You don't have those letters in your rack.";
  // Dictionary check (demo list).
  if (!WORDS.includes(w)) return "Not in word list (demo list).";
  return null;
}

// Standard Wordle-style feedback with duplicate handling.
export function scoreGuess(guess: string, answer: string): TileStatus[] {
  const g = guess.toLowerCase().split("");
  const a = answer.toLowerCase().split("");

  const res: TileStatus[] = Array(5).fill("absent");
  const remaining: Record<string, number> = {};

  // Pass 1: correct
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) {
      res[i] = "correct";
    } else {
      remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
    }
  }

  // Pass 2: present
  for (let i = 0; i < 5; i++) {
    if (res[i] === "correct") continue;
    const ch = g[i];
    if ((remaining[ch] ?? 0) > 0) {
      res[i] = "present";
      remaining[ch] -= 1;
    }
  }

  return res;
}

export function applyGuess(state: GameState, guessWord: string): GameState {
  if (state.status !== "playing") return state;

  const guess = guessWord.toLowerCase();
  const statuses = scoreGuess(guess, state.answer);
  const nextRack = { ...state.rack };

  // Burn gray tiles (per-instance).
  const guessUpper = guess.toUpperCase();
  for (let i = 0; i < 5; i++) {
    const ch = guessUpper[i];
    if (statuses[i] === "absent") {
      nextRack[ch] = Math.max(0, (nextRack[ch] ?? 0) - 1);
      if (nextRack[ch] === 0) delete nextRack[ch];
    }
  }

  const nextGuesses = [...state.guesses, { word: guessUpper, statuses }];
  const roundIndex = nextGuesses.length - 1;

  // Draw new letters (deterministic per date + round).
  for (let j = 0; j < state.drawPerRound; j++) {
    const l = seededLetter(`${SALT}:draw:${state.dateKey}:r${roundIndex}:i${j}`);
    addToRack(nextRack, l, 1);
  }

  let status: GameStatus = "playing";
  let message: string | undefined;

  if (guess === state.answer) {
    status = "won";
    message = "You solved it!";
  } else if (nextGuesses.length >= state.maxRounds) {
    status = "lost";
    message = `Out of rounds. Answer: ${state.answer.toUpperCase()}`;
  }

  return { ...state, rack: nextRack, guesses: nextGuesses, status, message };
}

export function newGame(dateKey: string): GameState {
  const answer = pickAnswer(dateKey);
  const rackSizeStart = 12;
  const maxRounds = 8;
  const drawPerRound = 2;

  return {
    dateKey,
    answer,
    rack: buildInitialRack(dateKey, answer, rackSizeStart),
    guesses: [],
    maxRounds,
    rackSizeStart,
    drawPerRound,
    status: "playing",
  };
}

export function overallLetterKnowledge(guesses: Guess[]): Record<string, TileStatus> {
  // best status per letter: correct > present > absent
  const rank: Record<TileStatus, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, TileStatus> = {};
  for (const g of guesses) {
    for (let i = 0; i < 5; i++) {
      const ch = g.word[i];
      const st = g.statuses[i];
      const prev = out[ch];
      if (!prev || rank[st] > rank[prev]) out[ch] = st;
    }
  }
  return out;
}

export function emojiForStatus(st: TileStatus): string {
  if (st === "correct") return "🟩";
  if (st === "present") return "🟨";
  return "⬜";
}

export function shareText(state: GameState): string {
  const score = state.status === "won" ? `${state.guesses.length}/${state.maxRounds}` : `X/${state.maxRounds}`;
  const lines: string[] = [];
  lines.push(`Rackle ${state.dateKey} ${score}`);
  for (const g of state.guesses) {
    lines.push(g.statuses.map(emojiForStatus).join(""));
  }
  lines.push(`Rack left: ${countRack(state.rack)}`);
  return lines.join("\n");
}

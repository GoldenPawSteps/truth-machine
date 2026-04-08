import type { Statement, User } from './types';

export function logSumExp(values: number[]): number {
  if (values.length === 0) return -Infinity;
  const M = Math.max(...values);
  if (!isFinite(M)) return M;
  return M + Math.log(values.reduce((sum, v) => sum + Math.exp(v - M), 0));
}

export function computeCost(q: number[], probs: number[], beta: number): number {
  if (q.length !== probs.length) throw new Error(`computeCost: length mismatch (q=${q.length}, probs=${probs.length})`);
  if (!(beta > 0)) throw new Error(`computeCost: beta must be > 0 (got ${beta})`);
  if (!probs.every(p => p >= 0 && Number.isFinite(p))) throw new Error('computeCost: all probabilities must be finite and non-negative');
  if (!q.every(Number.isFinite)) throw new Error('computeCost: all q entries must be finite');
  // C(q) = β · log(Σ p_i · exp(q_i / β))
  const scaled = q.map((qi, i) => Math.log(probs[i]) + qi / beta);
  return beta * logSumExp(scaled);
}

export function computeDC(q: number[], h: number[], probs: number[], beta: number): number {
  if (q.length !== probs.length || h.length !== q.length) throw new Error(`computeDC: length mismatch (q=${q.length}, h=${h.length}, probs=${probs.length})`);
  if (!(beta > 0)) throw new Error(`computeDC: beta must be > 0 (got ${beta})`);
  if (!probs.every(p => p >= 0 && Number.isFinite(p))) throw new Error('computeDC: all probabilities must be finite and non-negative');
  if (!q.every(Number.isFinite)) throw new Error('computeDC: all q entries must be finite');
  if (!h.every(Number.isFinite)) throw new Error('computeDC: all h entries must be finite');
  // DC(q)[h] = Σ h_i * w_i where w_i = p_i*exp(q_i/β) / Σ p_j*exp(q_j/β)
  const logWeights = q.map((qi, i) => Math.log(probs[i]) + qi / beta);
  const logNorm = logSumExp(logWeights);
  const weights = logWeights.map(lw => Math.exp(lw - logNorm));
  return h.reduce((sum, hi, i) => sum + hi * weights[i], 0);
}

export interface TradeResult {
  deltaC: number;
  deltaPiTaker: number;
  deltaPiMaker: number;
  deltaMinTaker: number;
  newQMaker: number[];
  newQTaker: number[];
  valid: boolean;
  takerSolvent: boolean;
  makerSafe: boolean;
  errorMessage?: string;
}

export function computeTrade(
  statement: Statement,
  taker: User,
  deltaQ: number[]
): TradeResult {
  const { qMaker, probabilities, beta, maxLoss, positions } = statement;

  if (deltaQ.length !== qMaker.length) {
    return {
      deltaC: 0,
      deltaPiTaker: 0,
      deltaPiMaker: 0,
      deltaMinTaker: 0,
      newQMaker: qMaker.slice(),
      newQTaker: (positions[taker.id] ?? qMaker.map(() => 0)).slice(),
      valid: false,
      takerSolvent: false,
      makerSafe: false,
      errorMessage: `Invalid trade vector length. Expected ${qMaker.length}, received ${deltaQ.length}.`,
    };
  }

  if (deltaQ.some(dq => !Number.isFinite(dq))) {
    return {
      deltaC: 0,
      deltaPiTaker: 0,
      deltaPiMaker: 0,
      deltaMinTaker: 0,
      newQMaker: qMaker.slice(),
      newQTaker: (positions[taker.id] ?? qMaker.map(() => 0)).slice(),
      valid: false,
      takerSolvent: false,
      makerSafe: false,
      errorMessage: 'Invalid trade vector. All deltaQ entries must be finite numbers.',
    };
  }

  const qTaker = positions[taker.id] ?? qMaker.map(() => 0);

  const newQMaker = qMaker.map((q, i) => q + deltaQ[i]);
  const newQTaker = qTaker.map((q, i) => q + deltaQ[i]);

  const cOld = computeCost(qMaker, probabilities, beta);
  const cNew = computeCost(newQMaker, probabilities, beta);
  const deltaC = cNew - cOld;

  const deltaPiTaker = computeDC(newQMaker, newQTaker, probabilities, beta)
    - computeDC(qMaker, qTaker, probabilities, beta);

  const deltaPiMaker = computeDC(newQMaker, newQMaker, probabilities, beta)
    - computeDC(qMaker, qMaker, probabilities, beta);

  const deltaMinTaker = Math.min(...newQTaker) - Math.min(...qTaker);

  const availableTaker = taker.balance + taker.exposure;
  const takerSolvent = availableTaker + deltaPiTaker + deltaMinTaker >= deltaC;
  const makerSafe = maxLoss + cNew >= Math.max(...newQMaker);

  const valid = takerSolvent && makerSafe;

  let errorMessage: string | undefined;
  if (!takerSolvent) {
    const needed = deltaC - deltaPiTaker - deltaMinTaker;
    errorMessage = `Insufficient available balance. Need ${needed.toFixed(6)} more.`;
  } else if (!makerSafe) {
    errorMessage = `Trade would violate maker safety constraint (L + C(q') < max(q')).`;
  }

  return {
    deltaC,
    deltaPiTaker,
    deltaPiMaker,
    deltaMinTaker,
    newQMaker,
    newQTaker,
    valid,
    takerSolvent,
    makerSafe,
    errorMessage,
  };
}

import { useState, useEffect } from 'react';
import type { Statement } from '../lib/types';
import { useAppContext } from '../lib/store';
import { computeTrade } from '../lib/mathEngine';
import { CostChart } from './CostChart';

interface Props {
  statement: Statement;
  onClose: () => void;
}

export function TradePanel({ statement, onClose }: Props) {
  const { state, dispatch } = useAppContext();
  const taker = state.users[state.currentUserId];
  const currentPos = statement.positions[taker.id] ?? statement.outcomes.map(() => 0);
  const [deltaQ, setDeltaQ] = useState<number[]>(statement.outcomes.map(() => 0));

  useEffect(() => {
    setDeltaQ(statement.outcomes.map(() => 0));
  }, [statement.id, state.currentUserId]);

  const result = computeTrade(statement, taker, deltaQ);
  const allZero = deltaQ.every(d => d === 0);

  function handleExecute() {
    if (!result.valid || allZero) return;
    dispatch({ type: 'TAKE_POSITION', payload: { statementId: statement.id, deltaQ } });
    setDeltaQ(statement.outcomes.map(() => 0));
  }

  const maker = state.users[statement.makerId];

  return (
    <div className="trade-panel card">
      <div className="trade-panel-header">
        <div>
          <h2 className="section-title">{statement.description}</h2>
          <span className="meta">Maker: {maker?.name} · β={statement.beta} · L={statement.maxLoss}</span>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>✕ Close</button>
      </div>

      <div className="trade-layout">
        <div className="trade-inputs">
          <h3 className="subsection-title">Current Position</h3>
          <div className="position-grid">
            {statement.outcomes.map((label, i) => (
              <div key={i} className="position-row">
                <span className="outcome-label">{label}</span>
                <span className="mono">{currentPos[i].toFixed(6)}</span>
              </div>
            ))}
          </div>

          <h3 className="subsection-title">Enter Δq (trade vector)</h3>
          <div className="delta-grid">
            {statement.outcomes.map((label, i) => (
              <div key={i} className="delta-row">
                <label className="outcome-label">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={deltaQ[i]}
                  onChange={e => {
                    const n = [...deltaQ]; n[i] = Number(e.target.value); setDeltaQ(n);
                  }}
                  className="form-input mono"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="trade-results">
          <h3 className="subsection-title">Trade Preview</h3>
          <div className="result-grid">
            <div className="result-row">
              <span className="result-label">ΔC (cost of trade)</span>
              <span className={`mono ${result.deltaC > 0 ? 'negative-val' : 'positive-val'}`}>
                {result.deltaC.toFixed(6)}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">ΔΠ_t (mark-to-market)</span>
              <span className={`mono ${result.deltaPiTaker >= 0 ? 'positive-val' : 'negative-val'}`}>
                {result.deltaPiTaker.toFixed(6)}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Δmin_t (exposure change)</span>
              <span className={`mono ${result.deltaMinTaker >= 0 ? 'positive-val' : 'negative-val'}`}>
                {result.deltaMinTaker.toFixed(6)}
              </span>
            </div>
            <div className="result-row result-row-total">
              <span className="result-label">Net cost to taker</span>
              <span className={`mono ${(result.deltaC - result.deltaPiTaker - result.deltaMinTaker) <= 0 ? 'positive-val' : 'negative-val'}`}>
                {(result.deltaC - result.deltaPiTaker - result.deltaMinTaker).toFixed(6)}
              </span>
            </div>
          </div>

          <div className="validation-badges">
            <span className={`badge ${result.takerSolvent ? 'badge-ok' : 'badge-err'}`}>
              Taker: {result.takerSolvent ? '✓ Solvent' : '✗ Insolvent'}
            </span>
            <span className={`badge ${result.makerSafe ? 'badge-ok' : 'badge-err'}`}>
              Maker: {result.makerSafe ? '✓ Safe' : '✗ Unsafe'}
            </span>
          </div>

          {result.errorMessage && (
            <div className="error-msg">{result.errorMessage}</div>
          )}

          {allZero && <div className="warn-msg">Enter non-zero Δq values to trade.</div>}

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={!result.valid || allZero}
          >
            Execute Trade
          </button>
        </div>
      </div>

      <CostChart statement={statement} />
    </div>
  );
}

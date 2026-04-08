import type { Statement } from '../lib/types';
import { computeCost } from '../lib/mathEngine';

interface Props {
  statement: Statement;
}

export function CostChart({ statement }: Props) {
  const { qMaker, probabilities, beta, outcomes } = statement;
  const cost = computeCost(qMaker, probabilities, beta);
  const maxQ = Math.max(...qMaker.map(Math.abs), 0.001);

  return (
    <div className="cost-chart card">
      <h3 className="section-title">Position Chart</h3>
      <div className="chart-cost">
        <span className="metric-label">Current Cost C(q)</span>
        <span className="metric-value mono">{cost.toFixed(6)}</span>
      </div>
      <div className="bar-chart">
        {qMaker.map((q, i) => {
          const pct = Math.abs(q) / maxQ * 100;
          return (
            <div key={i} className="bar-row">
              <span className="bar-label">{outcomes[i]}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${q >= 0 ? 'positive' : 'negative'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="bar-value mono">{q.toFixed(4)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

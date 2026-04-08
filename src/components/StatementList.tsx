import { useAppContext } from '../lib/store';
import type { Statement } from '../lib/types';
import { computeCost } from '../lib/mathEngine';

interface Props {
  onSelect: (stmt: Statement) => void;
  selectedId: string | null;
}

export function StatementList({ onSelect, selectedId }: Props) {
  const { state } = useAppContext();
  const statements = Object.values(state.statements);

  if (statements.length === 0) {
    return (
      <div className="card empty-state">
        <p>No statements yet. Create one in the "Create" tab.</p>
      </div>
    );
  }

  return (
    <div className="statement-list">
      {statements.map(stmt => {
        const cost = computeCost(stmt.qMaker, stmt.probabilities, stmt.beta);
        const maker = state.users[stmt.makerId];
        return (
          <div
            key={stmt.id}
            className={`statement-card card ${selectedId === stmt.id ? 'selected' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={selectedId === stmt.id}
            onClick={() => onSelect(stmt)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(stmt);
              }
            }}
          >
            <div className="stmt-header">
              <span className="stmt-description">{stmt.description}</span>
              <span className="stmt-cost mono">C={cost.toFixed(6)}</span>
            </div>
            <div className="stmt-meta">
              <span>Maker: {maker?.name}</span>
              <span>β={stmt.beta}</span>
              <span>L={stmt.maxLoss}</span>
              <span>{stmt.outcomes.length} outcomes</span>
            </div>
            <div className="stmt-outcomes">
              {stmt.outcomes.map((o, i) => (
                <span key={i} className="outcome-chip">
                  {o} ({(stmt.probabilities[i] * 100).toFixed(1)}%)
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

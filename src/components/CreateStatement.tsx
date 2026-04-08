import { useState } from 'react';
import { useAppContext } from '../lib/store';

export function CreateStatement() {
  const { state, dispatch } = useAppContext();
  const user = state.users[state.currentUserId];
  const available = user.balance + user.exposure;

  const [description, setDescription] = useState('');
  const [numOutcomes, setNumOutcomes] = useState(2);
  const [outcomes, setOutcomes] = useState(['Yes', 'No']);
  const [probs, setProbs] = useState([0.5, 0.5]);
  const [beta, setBeta] = useState(1.0);
  const [maxLoss, setMaxLoss] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);

  const probSum = probs.reduce((a, b) => a + b, 0);
  const probsValid = Math.abs(probSum - 1) < 1e-9;
  const canAfford = available >= maxLoss;
  const isValid = description.trim() && probsValid && beta > 0 && maxLoss > 0 && canAfford;

  function handleNumOutcomesChange(n: number) {
    const clamped = Math.max(2, Math.min(5, n));
    setNumOutcomes(clamped);
    const newOutcomes = Array.from({ length: clamped }, (_, i) => outcomes[i] ?? `Outcome ${i + 1}`);
    const newProbs = Array.from({ length: clamped }, (_, i) => probs[i] ?? 1 / clamped);
    setOutcomes(newOutcomes);
    setProbs(newProbs);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    dispatch({
      type: 'CREATE_STATEMENT',
      payload: { description, outcomes, probabilities: probs, beta, maxLoss, makerId: user.id },
    });
    setDescription('');
    setOutcomes(['Yes', 'No']);
    setProbs([0.5, 0.5]);
    setNumOutcomes(2);
    setBeta(1.0);
    setMaxLoss(0.5);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <div className="card">
      <h2 className="section-title">Create Statement</h2>
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this statement about?"
            className="form-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Number of Outcomes</label>
            <input
              type="number"
              min={2} max={5}
              value={numOutcomes}
              onChange={e => handleNumOutcomesChange(Number(e.target.value))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Liquidity β</label>
            <input
              type="number"
              step="0.01" min="0.01"
              value={beta}
              onChange={e => setBeta(Number(e.target.value))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Max Loss L</label>
            <input
              type="number"
              step="0.01" min="0.01"
              value={maxLoss}
              onChange={e => setMaxLoss(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>

        <div className="outcomes-grid">
          <div className="outcomes-header">
            <span>Outcome Label</span>
            <span>Probability</span>
          </div>
          {outcomes.map((label, i) => (
            <div key={i} className="outcome-row">
              <input
                type="text"
                value={label}
                onChange={e => {
                  const n = [...outcomes]; n[i] = e.target.value; setOutcomes(n);
                }}
                className="form-input"
                placeholder={`Outcome ${i + 1}`}
              />
              <input
                type="number"
                step="0.01" min="0" max="1"
                value={probs[i]}
                onChange={e => {
                  const n = [...probs]; n[i] = Number(e.target.value); setProbs(n);
                }}
                className="form-input mono"
              />
            </div>
          ))}
        </div>

        <div className="validation-status">
          <span className={probsValid ? 'valid' : 'invalid'}>
            Prob sum: {probSum.toFixed(6)} {probsValid ? '✓' : '✗ (must be 1)'}
          </span>
          <span className={canAfford ? 'valid' : 'invalid'}>
            Available: {available.toFixed(6)} {canAfford ? '≥' : '<'} L={maxLoss.toFixed(6)} {canAfford ? '✓' : '✗'}
          </span>
        </div>

        {submitted && <div className="success-msg">Statement created successfully!</div>}

        <button type="submit" disabled={!isValid} className="btn btn-primary">
          Create Statement
        </button>
      </form>
    </div>
  );
}

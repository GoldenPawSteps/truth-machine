import { useAppContext } from '../lib/store';

export function Dashboard() {
  const { state } = useAppContext();
  const user = state.users[state.currentUserId];
  const available = user.balance + user.exposure;

  return (
    <div className="dashboard card">
      <h2 className="section-title">Portfolio</h2>
      <div className="dashboard-grid">
        <div className="metric-card">
          <span className="metric-label">Balance (B)</span>
          <span className="metric-value mono">{user.balance.toFixed(6)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Exposure (E)</span>
          <span className="metric-value mono exposure">{user.exposure.toFixed(6)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Available (A = B + E)</span>
          <span className="metric-value mono available">{available.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}

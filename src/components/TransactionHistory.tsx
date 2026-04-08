import { useAppContext } from '../lib/store';

export function TransactionHistory() {
  const { state } = useAppContext();
  const txs = [...state.transactions].reverse();

  if (txs.length === 0) {
    return (
      <div className="card empty-state">
        <p>No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Transaction History</h2>
      <div className="tx-table-wrapper">
        <table className="tx-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>User</th>
              <th>Statement</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(tx => {
              const user = state.users[tx.userId];
              const stmt = state.statements[tx.statementId];
              return (
                <tr key={tx.id}>
                  <td className="mono">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                  <td><span className={`badge badge-type-${tx.type}`}>{tx.type}</span></td>
                  <td>{user?.name}</td>
                  <td className="stmt-desc-cell">{stmt?.description}</td>
                  <td className="mono detail-cell">
                    {Object.entries(tx.details).map(([k, v]) => (
                      <span key={k} className="detail-item">{k}: {v.toFixed(6)}</span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AppProvider, useAppContext } from './lib/store';
import { Dashboard } from './components/Dashboard';
import { CreateStatement } from './components/CreateStatement';
import { StatementList } from './components/StatementList';
import { TradePanel } from './components/TradePanel';
import { TransactionHistory } from './components/TransactionHistory';
import { UserSelector } from './components/UserSelector';
import type { Statement } from './lib/types';

type Tab = 'statements' | 'create' | 'history';

function AppInner() {
  const [tab, setTab] = useState<Tab>('statements');
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const { state } = useAppContext();

  // Keep selected statement in sync with latest state
  const liveStatement = selectedStatement
    ? state.statements[selectedStatement.id] ?? null
    : null;

  function handleSelect(stmt: Statement) {
    setSelectedStatement(stmt);
  }

  function handleClosePanel() {
    setSelectedStatement(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">⟨T⟩</span>
          <h1 className="brand-name">Truth App</h1>
          <span className="brand-subtitle">Conviction-Based Market Protocol</span>
        </div>
        <UserSelector />
      </header>

      <main className="app-main">
        <div className="sidebar">
          <Dashboard />
          <nav className="tab-nav">
            {(['statements', 'create', 'history'] as Tab[]).map(t => (
              <button
                key={t}
                className={`tab-btn ${tab === t ? 'active' : ''}`}
                onClick={() => { setTab(t); if (t !== 'statements') setSelectedStatement(null); }}
              >
                {t === 'statements' ? '📋 Statements' : t === 'create' ? '➕ Create' : '📜 History'}
              </button>
            ))}
          </nav>
        </div>

        <div className="content">
          {tab === 'statements' && (
            <>
              <StatementList onSelect={handleSelect} selectedId={liveStatement?.id ?? null} />
              {liveStatement && (
                <TradePanel statement={liveStatement} onClose={handleClosePanel} />
              )}
            </>
          )}
          {tab === 'create' && <CreateStatement />}
          {tab === 'history' && <TransactionHistory />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

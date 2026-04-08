import React, { createContext, useContext, useReducer } from 'react';
import type { AppState, Statement, Transaction, User } from './types';
import { computeTrade, computeDC } from './mathEngine';

const initialState: AppState = {
  users: {
    alice: { id: 'alice', name: 'Alice', balance: 1, exposure: 0 },
    bob: { id: 'bob', name: 'Bob', balance: 1, exposure: 0 },
    charlie: { id: 'charlie', name: 'Charlie', balance: 1, exposure: 0 },
  },
  statements: {},
  transactions: [],
  currentUserId: 'alice',
};

type Action =
  | { type: 'CREATE_STATEMENT'; payload: Omit<Statement, 'id' | 'makerId' | 'qMaker' | 'positions' | 'createdAt'> }
  | { type: 'TAKE_POSITION'; payload: { statementId: string; deltaQ: number[] } }
  | { type: 'SWITCH_USER'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_STATEMENT': {
      const maker = state.users[state.currentUserId];
      const available = maker.balance + maker.exposure;
      if (available < action.payload.maxLoss) return state;

      const id = `stmt_${Date.now()}`;
      const statement: Statement = {
        ...action.payload,
        id,
        makerId: maker.id,
        qMaker: new Array(action.payload.outcomes.length).fill(0),
        positions: {},
        createdAt: Date.now(),
      };

      const tx: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'create',
        statementId: id,
        userId: maker.id,
        timestamp: Date.now(),
        details: { maxLoss: action.payload.maxLoss, beta: action.payload.beta },
      };

      return {
        ...state,
        users: {
          ...state.users,
          [maker.id]: { ...maker, exposure: maker.exposure - action.payload.maxLoss },
        },
        statements: { ...state.statements, [id]: statement },
        transactions: [...state.transactions, tx],
      };
    }

    case 'TAKE_POSITION': {
      const { statementId, deltaQ } = action.payload;
      const statement = state.statements[statementId];
      if (!statement) return state;

      const taker = state.users[state.currentUserId];
      const result = computeTrade(statement, taker, deltaQ);
      if (!result.valid) return state;

      const { deltaC, deltaPiTaker, deltaPiMaker, deltaMinTaker, newQMaker, newQTaker } = result;

      // Update taker
      const updatedTaker: User = {
        ...taker,
        balance: taker.balance + deltaPiTaker - deltaC,
        exposure: taker.exposure + deltaMinTaker,
      };

      // Update maker
      const maker = state.users[statement.makerId];
      const updatedMaker: User = {
        ...maker,
        balance: maker.balance - (deltaPiMaker - deltaC),
      };

      // Update other takers' balances
      const isSelfTrade = taker.id === maker.id;

      const updatedUsers: Record<string, User> = isSelfTrade
        ? {
            ...state.users,
            [taker.id]: {
              ...taker,
              balance: taker.balance + deltaPiTaker - deltaPiMaker,
              exposure: taker.exposure + deltaMinTaker,
            },
          }
        : {
            ...state.users,
            [taker.id]: updatedTaker,
            [maker.id]: updatedMaker,
          };

      // Compute deltaPi for other takers
      for (const [userId, qTaker] of Object.entries(statement.positions)) {
        if (userId === taker.id) continue;
        const otherUser = state.users[userId];
        if (!otherUser) continue;
        const oldDC = computeDC(statement.qMaker, qTaker, statement.probabilities, statement.beta);
        const newDC = computeDC(newQMaker, qTaker, statement.probabilities, statement.beta);
        const deltaPiOther = newDC - oldDC;
        updatedUsers[userId] = {
          ...otherUser,
          balance: otherUser.balance + deltaPiOther,
        };
      }

      const updatedStatement: Statement = {
        ...statement,
        qMaker: newQMaker,
        positions: {
          ...statement.positions,
          [taker.id]: newQTaker,
        },
      };

      const tx: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'trade',
        statementId,
        userId: taker.id,
        timestamp: Date.now(),
        details: { deltaC, deltaPiTaker, deltaPiMaker, deltaMinTaker },
      };

      return {
        ...state,
        users: updatedUsers,
        statements: { ...state.statements, [statementId]: updatedStatement },
        transactions: [...state.transactions, tx],
      };
    }

    case 'SWITCH_USER':
      return { ...state, currentUserId: action.payload };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return React.createElement(AppContext.Provider, { value: { state, dispatch } }, children);
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

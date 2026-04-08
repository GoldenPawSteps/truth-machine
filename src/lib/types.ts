export interface User {
  id: string;
  name: string;
  balance: number;
  exposure: number;
}

export interface Statement {
  id: string;
  makerId: string;
  description: string;
  outcomes: string[];
  probabilities: number[];
  beta: number;
  maxLoss: number;
  qMaker: number[];
  positions: Record<string, number[]>;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: 'create' | 'trade';
  statementId: string;
  userId: string;
  timestamp: number;
  details: Record<string, number>;
}

export interface AppState {
  users: Record<string, User>;
  statements: Record<string, Statement>;
  transactions: Transaction[];
  currentUserId: string;
}

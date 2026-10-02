// Types for Ethers.js Prediction Market dApp

export type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
};

export type EIP6963ProviderDetail = {
  info: {
    rdns: string;
  };
  provider: EIP1193Provider;
};

export type EIP6963ProviderEvent = CustomEvent<EIP6963ProviderDetail>;

export type ProviderError = Error & {
  code?: number;
};

export enum MarketOutcome {
  PENDING = 0,
  YES = 1,
  NO = 2,
  CANCELED = 3,
}

export type EIP6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

export interface PredictionMarketData {
  id: number;
  title: string;
  category: string;
  endTime: number;
  outcome: MarketOutcome;
  totalYesPool: string;
  totalNoPool: string;
  resolved: boolean;
  userYesBet: string;
  userNoBet: string;
  userClaimed: boolean;
  userEstimatedWinnings: string;
  isExpired: boolean;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface PredictionEventLog {
  id: string;
  type: "MarketCreated" | "BetPlaced" | "MarketResolved" | "WinningsClaimed";
  marketId: number;
  user?: string;
  amount?: string;
  outcome?: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: string;
}

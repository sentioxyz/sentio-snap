export type Simulation = {
  blockNumber: string,
  createAt: string,
  from: string,
  gas: string,
  gasPrice: string,
  id: string,
  input: string,
  networkId: string,
  to: string,
  transactionIndex: string,
  value: string,
  result?: Simulation_Result;
}

export interface Simulation_Result {
  transaction: Transaction | undefined;
  transactionReceipt:
    | TransactionReceipt
    | undefined;
  /** @deprecated */
  trace:
    | { [key: string]: any }
    | undefined;
  /** @deprecated */
  stateDiff:
    | { [key: string]: any }
    | undefined;
  /** @deprecated */
  code: { [key: string]: any } | undefined;
}

export interface Transaction {
  blockNumber: string;
  blockHash: string;
  transactionIndex: string;
  hash: string;
  chainId: string;
  type: string;
  from: string;
  to: string;
  input: string;
  value: string;
  nonce: string;
  gas: string;
  gasPrice: string;
}

export interface TransactionReceipt {
  gasUsed: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  status: string;
  error: string;
  revertReason: string;
  logs: Array<any> | undefined;
}

export type SimulationResponse = {
  simulation?: Simulation,
  code?: number,
  message?: string,
}

export type BalanceChange ={
  in: Balance
  out: Balance
}

export type Balance = {
  [token: string]: Token
}

export type Token = {
  amount: bigint,
  label?: string,
  price?: number,
  tokenDecimals?: number,
  isNft?: boolean,
}

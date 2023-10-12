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

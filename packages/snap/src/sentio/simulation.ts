import { Json } from '@metamask/utils';
import {SimulationResponse} from "./types";
import { SentioExternalCallTrace } from '@sentio/debugger-common'
import {baseUrl} from "./constants";


export const hex2int = (hex: string | Json): number | null => {
  return hex ? parseInt(hex.toString(), 16) : null;
};

/**
 * This function simulates something.
 *
 * @param transaction - The transaction object.
 * @param transactionOrigin - The transaction origin.
 * @param chainId - The chain ID.
 * @returns A Promise that resolves to a Panel.
 */
export async function simulate(
  transaction: { [key: string]: Json },
  transactionOrigin: string,
  chainId: string,
) {
  /**
   * Get the chain ID from the Ethereum provider.
   */
  const ethereumChainId = await ethereum.request({ method: 'eth_chainId' });
  const networkId = hex2int(ethereumChainId as string);

  if (networkId === null) {
    throw new Error('Invalid network ID');
  }

  /**
   * Create a simulation.
   */
  const simulationResponse = await createSimulation(networkId, transaction);
  if (simulationResponse.code != null ) {
    throw new Error(simulationResponse.message);
    // return errorPanel(simulationResponse?.message);
  }
  const traceResponse = await getTraces(simulationResponse.simulation!.id, networkId);


  return { traceResponse, simulationResponse };
}


/**
 * Creates a simulation.
 *
 * @param networkId - The network ID.
 * @param transaction - The transaction object.
 * @returns A Promise that resolves to a JSON object.
 */
async function createSimulation(
  networkId: number,
  transaction: { [key: string]: Json },
): Promise<SimulationResponse> {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    simulation: {
      networkId: `${networkId}`,
      blockNumber: 'latest',
      transactionIndex: '0',
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gas: transaction.gas,
      gasPrice: transaction.maxFeePerGas,
      input: transaction.data,
      // stateOverrides: {
      //   '0x0811fd1808e14f0b93f0514313965a5f142c5539': {
      //     balance: '0x1111111111111111',
      //   },
      // },
      // blockOverride: {
      //   baseFee: '0x0',
      // },
    },
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
  };

  return await fetch(
    baseUrl + '/api/v1/solidity/simulate',
    requestOptions,
  ).then((response) => response.json());
}

async function getTraces(simulationId: string, networkId: number): Promise<SentioExternalCallTrace> {
  const url = baseUrl + '/api/v1/solidity/traces' + `?networkId=${networkId}&txId.simulationId=${simulationId}`;
  return await fetch(url).then((response) => response.json());
}

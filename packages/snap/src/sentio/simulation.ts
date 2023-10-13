import { Json } from '@metamask/utils';
import { SentioExternalCallTrace } from '@sentio/debugger-common';
import { SimulationResponse } from './types';
import { baseUrl } from './constants';
import { getState } from './store';

/**
 * Gets the block number for the given network ID.
 *
 * @param hex
 * @returns A Promise that resolves to a JSON object.
 */
export const hex2int = (hex: string | Json): number | null => {
  return hex ? parseInt(hex.toString(), 16) : null;
};

/**
 * This function simulates something.
 *
 * @param transaction - The transaction object.
 * @returns A Promise
 */
export async function simulate(transaction: { [key: string]: Json }) {
  /**
   * Get the chain ID from the Ethereum provider.
   */
  const ethereumChainId = await ethereum.request({ method: 'eth_chainId' });
  const networkId = hex2int(ethereumChainId as string);

  if (networkId === null) {
    throw new Error('Invalid network ID');
  }

  const simulationResponse = await createSimulation(networkId, transaction);
  if (simulationResponse.code !== null) {
    throw new Error(simulationResponse.message);
    // return errorPanel(simulationResponse?.message);
  }
  const traceResponse = await getTraces(
    simulationResponse.simulation!.id,
    networkId,
  );

  return { traceResponse, simulationResponse };
}

/**
 * Gets the block number for the given network ID.
 *
 * @param networkId - The network ID.
 * @returns A Promise that resolves to a JSON object.
 */
async function getBlockNumber(
  networkId: number,
): Promise<{ blockNumber: number }> {
  const url = `${baseUrl}/api/v1/solidity/block_number?networkId=${networkId}`;
  return await fetch(url).then((response) => response.json());
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

  const blockNumber = await getBlockNumber(networkId);

  const request: any = {
    simulation: {
      networkId: `${networkId}`,
      blockNumber: blockNumber.blockNumber,
      transactionIndex: '0',
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gas: transaction.gas,
      gasPrice: transaction.maxFeePerGas,
      input: transaction.data,
    },
  };

  const state = await getState();
  if (state?.project) {
    const [owner, slug] = state.project.split('/');
    request.projectOwner = owner;
    request.projectSlug = slug;
  }

  const raw = JSON.stringify(request);
  if (state?.apiKey) {
    myHeaders.append('api-key', state.apiKey as string);
  }

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
  };

  const simulationResponse = await fetch(
    `${baseUrl}/api/v1/solidity/simulate`,
    requestOptions,
  ).then((res) => res.json());

  const sim = simulationResponse.simulation;
  if (sim) {
    if (state.project) {
      sim.url = `${baseUrl}/${state.project}/simulator/${sim.networkId}/${sim.id}`;
    } else {
      sim.url = `${baseUrl}/sim/${sim.networkId}/${sim.id}`;
    }
  }
  return simulationResponse;
}

/**
 * Gets the traces for the given simulation ID and network ID.
 *
 * @param simulationId - The simulation ID.
 * @param networkId - The network ID.
 * @returns A Promise that resolves to a JSON object.
 */
async function getTraces(
  simulationId: string,
  networkId: number,
): Promise<SentioExternalCallTrace> {
  const url = `${baseUrl}/api/v1/solidity/call_trace?networkId=${networkId}&txId.simulationId=${simulationId}`;
  return await fetch(url).then((response) => response.json());
}

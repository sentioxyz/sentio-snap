import {Json} from '@metamask/utils';
import {SentioExternalCallTrace, } from '@sentio/debugger-common';
import {Simulation, SimulationResponse} from './types';
import {baseUrl} from './constants';
import {getState} from './store';
import {api} from "./api";
import {SupportedChains, getChainName} from '@sentio/chain'

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
  if (!SupportedChains[networkId]) {
    const chain = getChainName(networkId);
    throw new Error(`Chain ${chain} (${networkId}) is not supported by Sentio.xyz yet.`);
  }

  const simulationResponse = await createSimulation(networkId, transaction);

  if (simulationResponse.simulation ) {
    const traceResponse = await getTraces(simulationResponse.simulation);

    return { traceResponse, simulationResponse };
  } else {
    throw new Error(simulationResponse.message);
  }
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
  return await api(url, 'GET');
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

  const simulationResponse = await api(`${baseUrl}/api/v1/solidity/simulate`, 'POST', request) as SimulationResponse;

  const sim = simulationResponse.simulation;
  if (sim && state?.project) {
    sim.project = state.project;
  }
  return simulationResponse;
}

/**
 * Gets the traces for the given simulation ID and network ID.
 *
 * @returns A Promise that resolves to a JSON object.
 * @param simulation
 */
async function getTraces(simulation: Simulation): Promise<SentioExternalCallTrace> {
  const { id, networkId, project } = simulation;
  let url = `${baseUrl}/api/v1/solidity/call_trace?txId.simulationId=${id}&networkId=${networkId}`;
  if (project) {
    const [owner, slug] = project.split('/');
    url+= `&projectOwner=${owner}&projectSlug=${slug}`;
  }
  return await api(url, 'GET');
}

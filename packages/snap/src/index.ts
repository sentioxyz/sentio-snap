import {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import { NodeType } from '@metamask/snaps-ui';
import { hasProperty, isObject } from '@metamask/utils';
import {
  simulate,
  resultPanel,
  errorPanel,
  computeBalanceChange,
} from './sentio';
import { fillTokenInfo } from './sentio/ui';
import { getState, setState } from './sentio/store';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'set_project': {
      const { project, apiKey } = request.params as any;
      await setState({ project, apiKey });
      return null;
    }

    case 'get_project': {
      const state = await getState();
      return state?.project;
    }
    default:
      console.error("Method not found.2", request.method)
      throw new Error('Method not found.');
  }
};

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  // transactionOrigin,
  // chainId,
}) => {
  console.error('onTransaction');

  if (!isObject(transaction) || !hasProperty(transaction, 'to')) {
    return {
      content: {
        value: 'Unknown transaction type',
        type: NodeType.Text,
      },
    };
  }

  try {
    const { traceResponse, simulationResponse } = await simulate(transaction);

    const { simulation } = simulationResponse;
    if (!simulation) {
      throw new Error('Simulation response is missing simulation object');
    }
    const balanceChange = computeBalanceChange(
      simulation.networkId,
      simulation.from,
      traceResponse,
    );
    await fillTokenInfo(simulation.networkId, balanceChange);
    return {
      content: {
        children: [resultPanel(simulation, balanceChange)],
        type: NodeType.Panel,
      },
    };
  } catch (e) {
    return {
      content: {
        children: [errorPanel(e.message)],
        type: NodeType.Panel,
      },
    };
  }
};

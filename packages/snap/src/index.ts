import {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import {NodeType, panel, text} from '@metamask/snaps-ui';
import {hasProperty, isObject} from '@metamask/utils';
import {simulate, resultPanel, errorPanel, computeBalanceChange} from './sentio';
import {fillTokenInfo} from "./sentio/ui";

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = ({origin, request}) => {
/*
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });
    default:
      throw new Error('Method not found.');
  }
*/
  return Promise.resolve(null);
};


export const onTransaction: OnTransactionHandler = async ({
                                                            transaction,
                                                            // transactionOrigin,
                                                            // chainId,
                                                          }) => {
  if (!isObject(transaction) || !hasProperty(transaction, 'to')) {
    return {
      content: {
        value: 'Unknown transaction type',
        type: NodeType.Text,
      },
    };
  }

  try {
    const {traceResponse, simulationResponse} = await simulate(transaction);

    const simulation = simulationResponse.simulation!;
    const balanceChange = computeBalanceChange(simulation.networkId, simulation.from, traceResponse);
    await fillTokenInfo(simulation.networkId, balanceChange)
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
      }
    };
  }
};

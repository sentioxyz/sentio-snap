/* eslint-disable jsdoc/require-jsdoc */
import { SentioExternalCallTrace } from '@sentio/debugger-common';
import pick from 'lodash/pick';
import Web3 from 'web3';
import { ChainId, SupportedChains } from '@sentio/chain';
import BigDecimal from '@sentio/bigdecimal';
import { hex2int } from './simulation';

export const BD = BigDecimal.clone({
  EXPONENTIAL_AT: [-20, 20],
});

export const formatCurrency = (value: number, maxValidDigits = 2) => {
  // can't use Intl.NumberFormat because the limitation of https://docs.metamask.io/snaps/concepts/execution-environment/
  const str = value.toFixed(maxValidDigits);
  const [int, decimal] = str.split('.');
  const intStr = int.replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
  return decimal ? `$${intStr}.${decimal}` : `${intStr}`;
};

export function getNumberWithDecimal(
  hex?: string | bigint,
  decimal?: number,
  asNumber?: boolean,
) {
  if (hex === undefined || decimal === undefined) {
    return null;
  }
  const bigInt = typeof hex === 'bigint' ? hex : BigInt(hex2int(hex) || 0);
  const n = BD(bigInt.toString()).div(decimal > 0 ? BD(10).pow(decimal) : 1);
  if (asNumber) {
    return n.toNumber();
  }
  return n.toString();
}

const ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256', // TODO if
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'src',
        type: 'address',
      },
      {
        indexed: false,
        name: 'wad',
        type: 'uint256',
      },
    ],
    name: 'Withdrawal',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'dst',
        type: 'address',
      },
      {
        indexed: false,
        name: 'wad',
        type: 'uint256',
      },
    ],
    name: 'Deposit',
    type: 'event',
  },
];

const web3 = new Web3();

const EVENT_MAP = new Map<string, number>();

for (const [idx, abiItem] of ABI.entries()) {
  EVENT_MAP.set(web3.eth.abi.encodeEventSignature(abiItem), idx);
}

export function isZeroValue(data: string) {
  return data === '0x0' || data === '0x' || data === '0';
}

export function filterFundTraces(rootTrace: SentioExternalCallTrace) {
  const res: any[] = [];
  const walk = (entry: any) => {
    // TODO add typing
    const { traces, value, error } = entry;
    const calls: any[] = [];
    const logs: any[] = [];

    if (error) {
      return;
    }

    if (value && !isZeroValue(value)) {
      res.push(pick(entry, ['from', 'to', 'value', 'startIndex']));
    }

    if (!traces) {
      return;
    }

    for (const trace of traces) {
      if (trace.type.startsWith('LOG')) {
        logs.push(trace as any);
      } else {
        calls.push(trace as any);
      }
    }

    logs.forEach((rawLog) => {
      const log = decodeLog(rawLog);
      if (!log) {
        return;
      }

      try {
        if (log.name === 'Transfer') {
          const [from, to, value] = log.events;
          if (isNumeric(value) && value !== '0') {
            res.push(log);
          }
        } else if (log.name === 'Withdrawal') {
          const [from, value] = log.events;
          if (isNumeric(value) && value !== '0') {
            res.push(log);
          }
        } else if (log.name === 'Deposit') {
          const [dst, wad] = log.events;
          // if (dst?.type === 'address' && wad?.type?.startsWith('uint') && wad && wad?.value !== '0') {
          if (isNumeric(wad) && wad !== '0') {
            res.push(log);
          }
          // }
        }
      } catch {
        // ignore
      }
    });
    calls.forEach(walk);
  };

  if (rootTrace) {
    walk(rootTrace);
  }
  return res;
}

export function decodeLog(log: any) {
  const idx = EVENT_MAP.get(log?.topics?.[0]);
  if (idx === undefined) {
    return undefined;
  }
  const abiItem = ABI[idx];
  if (!abiItem.inputs) {
    return undefined;
  }

  // if (idx > 0 && !isWrappedNativeToken(log.address)) {
  //   return undefined
  // }
  try {
    const event = web3.eth.abi.decodeLog(
      abiItem.inputs,
      log.data,
      log.topics.slice(1),
    );
    const arr = [];
    for (let i = 0; i < abiItem.inputs.length; i++) {
      // @ts-ignore actually has index
      arr.push(event[i]);
    }
    return {
      ...log,
      name: abiItem.name,
      events: arr,
    };
  } catch (e) {
    // ignore
    console.error(e);
  }

  return undefined;
}

const defaultChain = SupportedChains[ChainId.ETHEREUM];

export const getNativeToken = (chainId?: string) => {
  if (!chainId) {
    return defaultChain;
  }
  return SupportedChains[chainId] || defaultChain;
};

export function isNumeric(value: any) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'number') {
    return true;
  }

  if (typeof value === 'bigint') {
    return true;
  }

  if (typeof value === 'string') {
    return !isNaN(parseFloat(value)) && isFinite(Number(value));
  }
  return false;
}

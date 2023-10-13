import { SentioExternalCallTrace } from '@sentio/debugger-common';
import { BalanceChange } from './types';
import { filterFundTraces, getNativeToken, isZeroValue } from './helper';

// eslint-disable-next-line jsdoc/require-jsdoc
export function computeBalanceChange(
  chainId: string,
  sender: string,
  traces: SentioExternalCallTrace,
) {
  const fundFlows = filterFundTraces(traces);

  const balanceChange: BalanceChange = { in: {}, out: {} };
  const addBalance = (
    address: string,
    token: string,
    value: string,
    negative = false,
  ) => {
    if (address.toLowerCase() != sender.toLowerCase()) {
      return; // ignore other addresses
    }

    if (!value || isZeroValue(value)) {
      return;
    }
    const inOut = negative ? 'out' : 'in';
    const balance = balanceChange[inOut] || {};
    const tokenAmount = balance[token] || { amount: BigInt(0) };
    tokenAmount.amount = (tokenAmount.amount || BigInt(0)) + BigInt(value);
    balance[token] = tokenAmount;
    balanceChange[inOut] = balance;
  };

  const nativeToken = getNativeToken(chainId);
  for (const item of fundFlows) {
    if (item.address) {
      const { events: inputs, address, name } = item;
      if (name === 'Transfer') {
        const [from, to, value] = inputs;
        addBalance(from, address, value, true);
        addBalance(to, address, value);
      } else if (name === 'Withdrawal') {
        const [from, value] = inputs;
        addBalance(from, address, value, true);
        addBalance(address, address, value);
      } else if (name === 'Deposit') {
        const [dst, wad] = inputs;
        addBalance(address, address, wad, true);
        addBalance(dst, address, wad);
      }
    } else {
      const { from, to, value } = item;
      addBalance(from, nativeToken.tokenAddress, value, true);
      addBalance(to, nativeToken.tokenAddress, value);
    }
  }

  return balanceChange;
}

/* eslint-disable jsdoc/require-jsdoc */
import {
  Component,
  divider,
  panel,
  Panel,
  text,
  heading,
  copyable,
} from '@metamask/snaps-ui';
import { multiply } from 'lodash';
import { BalanceChange, Simulation, Token } from './types';
import { formatCurrency, getNativeToken, getNumberWithDecimal } from './helper';
import { ERC20Token, getTag } from './tag';
import { getPrice } from './price';
import { hex2int } from './simulation';
import {baseUrl} from "./constants";

/**
 * Returns a panel with an error message.
 *
 * /**
 * Returns a panel with an error message.
 *
 * @param message - The error message to display.
 * @returns A panel with the error message.
 */
export function errorPanel(message?: string): Panel {
  return panel([text(message || 'Got an error.')]);
}

export function resultPanel(
  simulation: Simulation,
  balanceChange: BalanceChange,
): Panel {
  const panelOutputs = [
    ...assertChanges(balanceChange),
    divider(),
    ...gasEstimate(simulation),
    divider(),
    ...sentioUrl(simulation),
  ];

  return panel(panelOutputs);
}

function gasEstimate(simulation: Simulation): Component[] {
  const ret: Component[] = [heading('Gas Estimate')];
  const gasUsed = simulation.result?.transactionReceipt?.gasUsed;
  if (gasUsed) {
    ret.push(text(`Used: **${hex2int(gasUsed)}**`));
  }

  ret.push(
    text(`Price: **${getNumberWithDecimal(simulation.gasPrice, 9)} Gwei**`),
  );
  return ret;
}

const formatAmount = (token: Token) => {
  return getNumberWithDecimal(
    token.amount,
    token.tokenDecimals || 18,
  ) as string;
};

function tokenUI(token: Token, tokenAddress: string, sign = '+'): Component[] {
  const ret = [];
  const symbolName: string = token.label || tokenAddress;
  ret.push(text(`**${symbolName}**`));
  let value = `Value: ${sign} ${formatAmount(token)}`;
  const usdValue = formatUsdValue(token);
  if (usdValue) {
    value += ` (≈ ${usdValue})`;
  }
  ret.push(text(value));
  return ret;
}

function assertChanges(balanceChange: BalanceChange): Component[] {
  const panelOutputs: Component[] = [heading('Asset Changes')];
  if (Object.keys(balanceChange).length === 0) {
    panelOutputs.push(text('No asset changes'));
    return panelOutputs;
  }

  const assetsInOutputs: Component[] = [text('💹 **Assets In**')];
  for (const [tokenAddress, token] of Object.entries(balanceChange.in)) {
    assetsInOutputs.push(...tokenUI(token, tokenAddress, '+'));
  }

  const assetsOutOutputs: Component[] = [text('〽️️ **Assets Out**')];
  for (const [tokenAddress, token] of Object.entries(balanceChange.out)) {
    assetsOutOutputs.push(...tokenUI(token, tokenAddress, '-'));
  }

  if (assetsInOutputs.length > 1 && assetsOutOutputs.length > 1) {
    assetsOutOutputs.push(divider());
  }

  panelOutputs.push(
    ...(assetsOutOutputs.length > 1 ? assetsOutOutputs : []),
    ...(assetsInOutputs.length > 1 ? assetsInOutputs : []),
  );
  return panelOutputs;
}

export function sentioUrl(sim: Simulation): Component[] {
  const ret : Component[] = [
    heading('Sentio Simulation'),
    text('See full simulation details in Sentio.'),
  ];

  if (sim.project) {
    const url = `${baseUrl}/${sim.project}/simulator/${sim.networkId}/${sim.id}`;
    ret.push(copyable(url));
  } else {
    const url = `${baseUrl}/sim/${sim.networkId}/${sim.id}`;
    ret.push(copyable(url));
    ret.push(text('_Please note this link will expire in 1 hour._'))
  }

  return ret
}

function formatUsdValue(token: Token) {
  if (token.price) {
    const amountEther = getNumberWithDecimal(
      token.amount,
      token.tokenDecimals || 18,
      true,
    ) as number;
    const value = multiply(Math.abs(amountEther), token.price);
    return formatCurrency(value);
  }
  return '';
}

async function getTokenInfo(chainId: string, address: string) {
  const nativeToken = getNativeToken(chainId);
  let info: any;
  if (address === nativeToken.tokenAddress) {
    info = {
      symbol: nativeToken.tokenSymbol,
      decimals: nativeToken.tokenDecimals,
      name: nativeToken.name,
    };
  } else {
    const tag = await getTag(chainId, address);
    const t = tag.token?.erc20 || tag.token?.erc721;
    info = {
      symbol: t?.symbol,
      decimals: (t as ERC20Token)?.decimals,
      name: t?.name,
      isNft: Boolean(tag.token?.erc721),
    };
  }
  info.price = await getPrice(chainId, address, new Date().toISOString());

  return info;
}

export async function fillTokenInfo(
  chainId: string,
  balanceChange: BalanceChange,
) {
  const tokenInfoMap: Record<string, any> = {};

  for (const balance of [balanceChange.in, balanceChange.out]) {
    for (const address of Object.keys(balance)) {
      let info = tokenInfoMap[address];
      if (!info) {
        info = await getTokenInfo(chainId, address);
        tokenInfoMap[address] = info;
      }
      const token = balance[address];
      token.label = info.symbol;
      token.tokenDecimals = info.decimals;
      token.price = info.price;
      token.isNft = info.isNft;
    }
  }
}

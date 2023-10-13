import {
  Component, divider, panel, Panel, text, heading, copyable,
} from "@metamask/snaps-ui";
import {BalanceChange, Simulation, Token} from "./types";
import {formatCurrency, getNativeToken, getNumberWithDecimal} from "./helper";
import {ERC20Token, getTag} from "./tag";
import {getPrice} from "./price";
import {baseUrl} from "./constants";
import {multiply} from "lodash";


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
  return panel([text(message || "Got an error.")]);
}


export function resultPanel(simulation: Simulation, balanceChange: BalanceChange): Panel {
  const panelOutputs = [
    ...assertChanges(balanceChange),
    divider(),
    ...sentioUrl(simulation),
  ];

  return panel(panelOutputs);
}

function assertChanges(balanceChange: BalanceChange): Component[] {
  const panelOutputs: Component[] = [heading('Asset Changes')];
  if (Object.keys(balanceChange).length === 0) {
    panelOutputs.push(text('No asset changes'));
    return panelOutputs;
  }

  const assetsInOutputs: Component[] = [text('💹 **Assets In**')];
  const assetsOutOutputs: Component[] = [text('〽️️ **Assets Out**')];

  for (const [tokenAddress, token] of Object.entries(balanceChange.in)) {
    const symbolName: string = token.label || tokenAddress;
    assetsInOutputs.push(text(`**${symbolName}**`));
    let value = `Value: + ${formatAmount(token)}`;
    const usdValue = formatUsdValue(token);
    if (usdValue) {
      value += ` (≈ ${usdValue})`
    }
    assetsOutOutputs.push(text(value));
  }

  for (const [tokenAddress, token] of Object.entries(balanceChange.out)) {
    const symbolName: string = token.label || tokenAddress;
    assetsOutOutputs.push(text(`**${symbolName}**`));
    let value = `Value: - ${formatAmount(token)}`;
    const usdValue = formatUsdValue(token);
    if (usdValue) {
      value += ` (≈ ${usdValue})`
    }
    assetsOutOutputs.push(text(value));
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

export function sentioUrl(simulation: Simulation): Component[] {
  const simulationUrl = baseUrl + `/sim/${simulation.networkId}/${simulation.id}`;

  return [
    heading('Sentio Simulation'),
    text('See full simulation details in Sentio.'),
    copyable(`${simulationUrl}`),
  ];
}

const formatAmount = (token: Token) => {
  return getNumberWithDecimal(token.amount, token.tokenDecimals || 18) as string
}

function formatUsdValue(token: Token) {
  if (token.price) {
    const amountEther = getNumberWithDecimal(token.amount, token.tokenDecimals || 18, true) as number
    const value = multiply(Math.abs(amountEther), token.price)
    return formatCurrency(value)
  }
}

async function getTokenInfo(chainId: string, address: string) {
  const nativeToken = getNativeToken(chainId)
  let info: any
  if (address === nativeToken.tokenAddress) {
    info = {
      symbol: nativeToken.tokenSymbol,
      decimals: nativeToken.tokenDecimals,
      name: nativeToken.name,
    }
  } else {
    const tag = await getTag(chainId, address)
    const t = tag.token?.erc20 || tag.token?.erc721
    info = {
      symbol: t?.symbol,
      decimals: (t as ERC20Token)?.decimals,
      name: t?.name,
      isNft: !!tag.token?.erc721,
    }
  }
  info.price = (await getPrice(chainId, address, new Date().toString()))?.price

  return info
}

export async function fillTokenLabels(chainId: string, balanceChange: BalanceChange) {
  const tokenInfoMap: Record<string, any> = {}

  for (const balance of [balanceChange.in, balanceChange.out]) {
    for (const address of Object.keys(balance)) {
      const info = tokenInfoMap[address] || await getTokenInfo(chainId, address)
      const token = balance[address]
      token.label = info.symbol
      token.tokenDecimals = info.decimals
      token.price = info.price
      token.isNft = info.isNft
    }
  }
}

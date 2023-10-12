import {
  Component, divider, panel, Panel, text, heading,
} from "@metamask/snaps-ui";
import {Balance, BalanceChange, Simulation, Token} from "./types";
import {getNativeToken, getNumberWithDecimal} from "./helper";
import {ERC20Token, getTag} from "./tag";
import {getPrice} from "./price";


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

  Object.entries(balanceChange.in).forEach(([tokenAddress, token]) => {
    const symbolName: string = token.label || tokenAddress;
    assetsInOutputs.push(text(`**${symbolName}**`));
    assetsInOutputs.push(text(`+ ${formatAmount(token)} (≈ ${formatUsdValue(token)})`));
  })

  Object.entries(balanceChange.out).forEach(([tokenAddress, token]) => {
    const symbolName: string = token.label || tokenAddress;
    assetsInOutputs.push(text(`**${symbolName}**`));
    assetsInOutputs.push(text(`- ${formatAmount(token)} (≈ ${formatUsdValue(token)})`));
  })

  if (assetsInOutputs.length > 1 && assetsOutOutputs.length > 1) {
    assetsOutOutputs.push(divider());
  }

  panelOutputs.push(
    ...(assetsOutOutputs.length > 1 ? assetsOutOutputs : []),
    ...(assetsInOutputs.length > 1 ? assetsInOutputs : []),
  );
  return panelOutputs;
}

const formatAmount = (token: Token) => {
  return getNumberWithDecimal(token.amount, token.tokenDecimals || 18) as string
}

function formatUsdValue(token: Token) {
  return "todo"
}

async function getTokenInfo(chainId: string, address: string) {
  const nativeToken = getNativeToken(chainId)
  let info: any = {}
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
    for (const [address] of Object.keys(balance)) {
      const info = tokenInfoMap[address] || await getTokenInfo(chainId, address)
      const token = balance[address]
      token.label = info.symbol
      token.tokenDecimals = info.decimals
      token.price = info.price
      token.isNft = info.isNft
    }
  }
}

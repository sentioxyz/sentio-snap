import {baseUrl} from "./constants";

export type GetTagByAddressResponse = {
  address?: string
  primaryName?: string
  token?: TokenTag
  names?: NameTag[]
}


export type NameTag = {
  label?: string
  dataSource?: string
  updatedAt?: string
  expiresAt?: string
}


type BaseTokenTag = {
}

export type TokenTag = BaseTokenTag
  & { erc20?: ERC20Token; erc721?: ERC721Token }

export type ERC20Token = {
  contractAddress?: string
  name?: string
  symbol?: string
  decimals?: number
  logo?: string
  website?: string
}

export type ERC721Token = {
  contractAddress?: string
  name?: string
  symbol?: string
  logo?: string
  website?: string
}

export async function getTag(chainId: string, address: string) {
  const  url =  baseUrl + `/api/v1/tag/${address}/${chainId}`
  const res = await fetch(url)
  const json = await res.json()
  return json as GetTagByAddressResponse
}

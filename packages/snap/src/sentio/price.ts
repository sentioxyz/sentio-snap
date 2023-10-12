import {baseUrl} from "./constants";

export async function getPrice(chainId: string, address: string, timestamp: string) {
  const url = baseUrl+ `/api/v1/prices?timestamp=${encodeURIComponent(timestamp)}&coinId.address.address=${address}&coinId.address.chain=${chainId}`
  const res = await fetch(url)

  return (res as any).json() as { price: number, timestamp: string }
}

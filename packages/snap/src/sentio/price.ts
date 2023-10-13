import {baseUrl} from "./constants";

export async function getPrice(chainId: string, address: string, timestamp: string) {
  const url = baseUrl+ `/api/v1/prices?timestamp=${encodeURIComponent(timestamp)}&coinId.address.address=${address}&coinId.address.chain=${chainId}`
  const res = await fetch(url).then((res) => res.json())
  console.log(res)
  return res.price
}

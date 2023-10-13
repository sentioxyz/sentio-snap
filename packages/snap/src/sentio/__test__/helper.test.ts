import {testTraces} from "./traces.json";
import {filterFundTraces} from "../helper";
import {computeBalanceChange} from "../balance";

describe('traces tests', () => {
  describe('filterFundTraces', () => {
    const fundTraces = filterFundTraces(testTraces)
    expect(fundTraces).toEqual([
      {
        "from": "0xe42c24089c75ed9ca1f6402dd6c57b149e56cb1a",
        "startIndex": 0,
        "to": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
        "value": "0x2386f26fc10000",
      },
      {
        "address": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
        "codeAddress": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
        "data": "0x000000000000000000000000000000000000000000000000002386f26fc10000",
        "endIndex": 124,
        "events": [
          "0xe42c24089c75Ed9CA1F6402Dd6C57B149E56cB1a",
          10000000000000000n,
        ],
        "gas": "0x56e",
        "gasUsed": "0x565",
        "name": "Deposit",
        "pc": 1243,
        "startIndex": 123,
        "topics": [
          "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
          "0x000000000000000000000000e42c24089c75ed9ca1f6402dd6c57b149e56cb1a",
        ],
        "type": "LOG2",
      }
    ])
  })
  describe('computeBalance', () => {
    const changes = computeBalanceChange("11155111", "0xe42c24089c75ed9ca1f6402dd6c57b149e56cb1a", testTraces)
    expect(changes).toEqual({
      in: {
        "0xfff9976782d46cc05630d1f6ebab18b2324d6b14": {
          "amount": 10000000000000000n,
        }
      },
      out: {
        "0x0000000000000000000000000000000000000000": {
          "amount": 10000000000000000n,
        }
      }
    })
  })
})

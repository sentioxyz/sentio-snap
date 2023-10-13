import {SentioExternalCallTrace} from "@sentio/debugger-common";

export const testTraces = {
  "type": "CALL",
  "pc": 0,
  "startIndex": 0,
  "endIndex": 127,
  "gas": "0x5da6",
  "gasUsed": "0xafee",
  "from": "0xe42c24089c75ed9ca1f6402dd6c57b149e56cb1a",
  "to": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
  "input": "0xd0e30db0",
  "value": "0x2386f26fc10000",
  "traces": [
    {
      "type": "LOG2",
      "pc": 1243,
      "startIndex": 123,
      "endIndex": 124,
      "gas": "0x56e",
      "gasUsed": "0x565",
      "address": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
      "codeAddress": "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
      "data": "0x000000000000000000000000000000000000000000000000002386f26fc10000",
      "topics": [
        "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
        "0x000000000000000000000000e42c24089c75ed9ca1f6402dd6c57b149e56cb1a"
      ]
    }
  ]
} as SentioExternalCallTrace

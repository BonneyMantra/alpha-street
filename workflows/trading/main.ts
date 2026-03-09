/**
 * Alpha Street — Trading Workflow
 *
 * HTTP Trigger → EVM Read (vault state)
 *             → ConfidentialHTTP (CoinGecko prices — inside TEE)
 *             → ConfidentialHTTP (Claude Service AI decision — API key in TEE)
 *             → Report + EVM Write (record trade + update NAV)
 *
 * Simulate: cre workflow simulate trading --broadcast
 * Trigger:  cre workflow simulate trading --http-payload '{}' --broadcast
 *
 * IMPORTANT: No module-level function calls — everything inside handlers.
 * IMPORTANT: encodedPayload stays hex, never convert to base64.
 * IMPORTANT: No Buffer/btoa — use custom stringToBase64 from utils.
 */
import {
  HTTPCapability,
  handler,
  type Runtime,
  type HTTPPayload,
  Runner,
  EVMClient,
  ConfidentialHTTPClient,
  TxStatus,
  prepareReportRequest,
  bytesToHex,
  ok,
  text,
  encodeCallMsg,
} from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeAbiParameters,
  parseAbiParameters,
  parseAbi,
  zeroAddress,
} from "viem";

type Config = {
  receiverAddress: string;
  gasLimit: number;
  claudeServiceUrl: string;
};

const onHttpTrigger = (
  runtime: Runtime<Config>,
  _payload: HTTPPayload,
): Record<string, never> => {
  // --- All ABI parsing INSIDE handler (module-level crashes WASM) ---
  const alphaVaultAbi = parseAbi([
    "function totalAssets() view returns (uint256)",
    "function currentNAV() view returns (uint256)",
    "function getTradeCount() view returns (uint256)",
  ]);

  const vaultAddr = runtime.config.receiverAddress as `0x${string}`;

  // --- Step 1: EVM Read — vault state ---
  const evmClient = new EVMClient(
    EVMClient.SUPPORTED_CHAIN_SELECTORS["avalanche-testnet-fuji"],
  );

  const totalAssetsCall = encodeFunctionData({
    abi: alphaVaultAbi,
    functionName: "totalAssets",
  });
  const currentNAVCall = encodeFunctionData({
    abi: alphaVaultAbi,
    functionName: "currentNAV",
  });
  const tradeCountCall = encodeFunctionData({
    abi: alphaVaultAbi,
    functionName: "getTradeCount",
  });

  const totalAssetsResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: vaultAddr,
        data: totalAssetsCall,
      }),
    })
    .result();

  const currentNAVResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: vaultAddr,
        data: currentNAVCall,
      }),
    })
    .result();

  const tradeCountResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: vaultAddr,
        data: tradeCountCall,
      }),
    })
    .result();

  const totalAssets = decodeFunctionResult({
    abi: alphaVaultAbi,
    functionName: "totalAssets",
    data: bytesToHex(totalAssetsResult.data) as `0x${string}`,
  }) as bigint;

  const currentNAV = decodeFunctionResult({
    abi: alphaVaultAbi,
    functionName: "currentNAV",
    data: bytesToHex(currentNAVResult.data) as `0x${string}`,
  }) as bigint;

  const tradeCount = decodeFunctionResult({
    abi: alphaVaultAbi,
    functionName: "getTradeCount",
    data: bytesToHex(tradeCountResult.data) as `0x${string}`,
  }) as bigint;

  runtime.log(
    `Vault state — totalAssets: ${totalAssets}, NAV: ${currentNAV}, trades: ${tradeCount}`,
  );

  // --- Step 2: Confidential HTTP — CoinGecko market prices (inside TEE) ---
  const confidentialHttp = new ConfidentialHTTPClient();

  const priceResponse = confidentialHttp
    .sendRequest(runtime, {
      request: {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,avalanche-2&vs_currencies=usd&include_24hr_change=true",
        method: "GET",
        multiHeaders: {
          accept: { values: ["application/json"] },
        },
      },
    })
    .result();

  if (!ok(priceResponse)) {
    throw new Error("CoinGecko API call failed");
  }

  const priceData = JSON.parse(text(priceResponse)) as {
    ethereum: { usd: number; usd_24h_change: number };
    bitcoin: { usd: number; usd_24h_change: number };
    "avalanche-2": { usd: number; usd_24h_change: number };
  };

  runtime.log(
    `Prices — ETH: $${priceData.ethereum.usd}, BTC: $${priceData.bitcoin.usd}, AVAX: $${priceData["avalanche-2"].usd}`,
  );

  // --- Step 3: Confidential HTTP — Claude Service AI trading decision ---
  const claudeApiKey = runtime
    .getSecret({ id: "CLAUDE_SERVICE_API_KEY" })
    .result().value;

  // Build prompt as single string (Claude Service uses `prompt` field, not `messages`)
  const prompt = `You are an AI trading algorithm for an on-chain hedge fund vault. Given market data and vault state, return ONLY a valid JSON object with your trading decision. No markdown, no explanation outside the JSON.

Format: { "action": "BUY"|"SELL"|"HOLD", "tokenPair": "ETH/USD"|"BTC/USD"|"AVAX/USD", "amount": <number in USDC with 6 decimals, e.g. 1000000 = 1 USDC>, "confidence": <0-100>, "reasoning": "<brief explanation>", "newNAV": <new NAV value in USDC with 6 decimals after this trade> }

Rules:
- This is a demo/testnet environment. Be ACTIVE — make trades to demonstrate the system.
- Prefer BUY when 24h change is positive, SELL when negative. Only HOLD if all markets are completely flat.
- Amount should be 5-10% of totalAssets (in 6-decimal USDC).
- Confidence should reflect your conviction (60-95 range for active trades).
- newNAV should equal totalAssets for simplicity (NAV tracks deposits, not market P&L).
- If totalAssets is 0, return HOLD with amount 0 and newNAV 0.
- Be deterministic.

Market Data:
- ETH: $${priceData.ethereum.usd} (24h change: ${priceData.ethereum.usd_24h_change}%)
- BTC: $${priceData.bitcoin.usd} (24h change: ${priceData.bitcoin.usd_24h_change}%)
- AVAX: $${priceData["avalanche-2"].usd} (24h change: ${priceData["avalanche-2"].usd_24h_change}%)

Vault State:
- totalAssets: ${totalAssets.toString()} (6 decimals USDC)
- currentNAV: ${currentNAV.toString()}
- tradeCount: ${tradeCount.toString()}

Return ONLY the JSON object.`;

  const claudeBody = JSON.stringify({
    prompt,
    model: "sonnet",
    stream: false,
  });

  const claudeResponse = confidentialHttp
    .sendRequest(runtime, {
      request: {
        url: `${runtime.config.claudeServiceUrl}/chat`,
        method: "POST",
        bodyString: claudeBody,
        multiHeaders: {
          "content-type": { values: ["application/json"] },
          "x-api-key": { values: [claudeApiKey] },
        },
      },
    })
    .result();

  if (!ok(claudeResponse)) {
    throw new Error("Claude Service AI call failed");
  }

  const claudeRaw = text(claudeResponse);

  // Claude Service returns NDJSON events — find the "result" event
  let aiContent = "";
  const lines = claudeRaw.split("\n").filter((l: string) => l.trim());
  for (const line of lines) {
    try {
      const evt = JSON.parse(line) as {
        type?: string;
        data?: { type?: string; result?: string };
      };
      if (evt.data?.type === "result" && evt.data?.result) {
        aiContent = evt.data.result;
        break;
      }
    } catch {
      // skip non-JSON lines
    }
  }

  if (!aiContent) {
    // Fallback: try to find any JSON object in the raw response
    const jsonMatch = claudeRaw.match(/"result"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/);
    if (jsonMatch) {
      aiContent = jsonMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      throw new Error(`Could not extract AI result from response`);
    }
  }

  // Extract JSON decision from AI content
  const decisionMatch = aiContent.match(/\{[\s\S]*\}/);
  if (!decisionMatch) {
    throw new Error(`Could not parse AI decision as JSON: ${aiContent}`);
  }

  const decision = JSON.parse(decisionMatch[0]) as {
    action: string;
    tokenPair: string;
    amount: number;
    confidence: number;
    reasoning: string;
    newNAV: number;
  };

  runtime.log(
    `AI decision — ${decision.action} ${decision.tokenPair}, amount: ${decision.amount}, confidence: ${decision.confidence}`,
  );
  runtime.log(`Reasoning (TEE-only): ${decision.reasoning}`);

  // --- Short-circuit on HOLD ---
  if (decision.action === "HOLD") {
    runtime.log("Decision is HOLD — no on-chain trade.");
    return {};
  }

  // --- Step 4: Encode report and write on-chain ---
  const actionEnum =
    decision.action === "BUY" ? 0 : decision.action === "SELL" ? 1 : 2;

  const priceMap: Record<string, number> = {
    "ETH/USD": priceData.ethereum.usd,
    "BTC/USD": priceData.bitcoin.usd,
    "AVAX/USD": priceData["avalanche-2"].usd,
  };
  const priceUsd = priceMap[decision.tokenPair] || 0;
  const priceFixed = BigInt(Math.round(priceUsd * 1e6));

  // Encode payload — STAYS AS HEX, never convert to base64
  const encodedPayload = encodeAbiParameters(
    parseAbiParameters("uint8, string, uint256, uint256, uint256, uint256"),
    [
      actionEnum,
      decision.tokenPair,
      BigInt(decision.amount),
      priceFixed,
      BigInt(decision.confidence),
      BigInt(decision.newNAV),
    ],
  );

  // Create signed report via prepareReportRequest
  const reportRequest = prepareReportRequest(encodedPayload);
  const report = runtime.report(reportRequest).result();

  // Write to AlphaVault.onReport()
  const writeResult = evmClient
    .writeReport(runtime, {
      receiver: runtime.config.receiverAddress,
      report: report,
      gasConfig: { gasLimit: String(runtime.config.gasLimit) },
    })
    .result();

  if (writeResult.txStatus === TxStatus.SUCCESS) {
    const txHash = writeResult.txHash
      ? bytesToHex(writeResult.txHash)
      : "unknown";
    runtime.log(`Trade recorded on-chain — TX: ${txHash}`);
  } else {
    runtime.log(
      `EVM write status: ${writeResult.txStatus} — check on-chain receipt`,
    );
  }

  return {};
};

const initWorkflow = (config: Config) => {
  const http = new HTTPCapability();
  return [handler(http.trigger({}), onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}

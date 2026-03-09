# Alpha Street -- AI Hedge Fund on CRE

**Hackathon:** Chainlink Convergence + Avalanche Build Games (dual submission)
**Tracks:** Privacy (primary) + DeFi + AI (multi-track submission)
**Tagline:** An autonomous AI hedge fund where the trading algorithm is private -- encrypted in Vault DON, decrypted only inside TEE enclaves. Anyone can invest. Performance is publicly verifiable. The strategy is completely hidden. Powered by CRE Confidential Compute.

---

## Table of Contents

1. [Product Overview and Problem Statement](#1-product-overview-and-problem-statement)
2. [Core Features](#2-core-features)
3. [What is Private vs What is Public](#3-what-is-private-vs-what-is-public)
4. [Full CRE Architecture](#4-full-cre-architecture)
5. [Smart Contracts](#5-smart-contracts)
6. [How the Algorithm Stays Private](#6-how-the-algorithm-stays-private)
7. [Comparison vs Existing Protocols](#7-comparison-vs-existing-protocols)
8. [Frontend Pages](#8-frontend-pages)
9. [External Integrations](#9-external-integrations)
10. [Hackathon Demo Flow](#10-hackathon-demo-flow)
11. [Business Model](#11-business-model)
12. [Technical Hackathon Scope](#12-technical-hackathon-scope)
13. [Tracks and Prizes](#13-tracks-and-prizes)
14. [Avalanche Build Games Integration](#14-avalanche-build-games-integration)
15. [Build Games Demo Angle](#15-build-games-demo-angle)

---

## 1. Product Overview and Problem Statement

### The Hedge Fund Industry is a Walled Garden

The global hedge fund industry manages approximately $4.5 trillion in assets. It is one of the most lucrative and secretive industries in finance. The dominant business model -- the "2 and 20" fee structure (2% annual management fee on total assets, 20% performance fee on profits) -- has generated extraordinary wealth for fund managers. Renaissance Technologies' Medallion Fund returned 66% annualized before fees from 1988 to 2018. Bridgewater's Pure Alpha has generated over $50 billion in profit for investors since inception. Citadel Securities alone generated $16 billion in revenue in 2022.

**The structural problems for everyone who is not already inside the gates:**

| Problem | Impact | Scale |
|---------|--------|-------|
| **Accreditation barriers** | Hedge funds require investors to be "accredited" -- minimum $1M net worth or $200K+ annual income. This excludes 90%+ of the population from the best-performing investment vehicles. | Only 13% of US households qualify as accredited investors (SEC). The remaining 87% are restricted to mutual funds, ETFs, and retail products that consistently underperform. |
| **Minimum investment thresholds** | Even among accredited investors, minimum investments range from $100K to $25M. Small capital is unwelcome. | Bridgewater's minimum: $7.5M. Renaissance Medallion: closed to outside investors entirely since 1993. Average hedge fund minimum: $1M. |
| **Lock-up periods** | Investor capital is locked for 1-3 years with limited redemption windows (quarterly or annually). Liquidity is poor. | Average lock-up: 12 months. Some funds (Icahn, Third Point) have 3-year lock-ups. Redemption gates can freeze withdrawals during market stress. |
| **Opacity** | Investors rarely know the actual strategy, positions, or risk exposure. Quarterly letters are vague. Audits are annual and backward-looking. The manager has information asymmetry. | The SEC found that 50%+ of hedge fund audits revealed "material compliance issues" in 2023 examinations. Investors discover problems after the fact. |
| **Fraud risk** | Opaque structures combined with large capital pools create systemic fraud risk. The manager controls the capital. | Madoff: $65B. Bayou Group: $450M. Platinum Partners: $1B. Long-Term Capital Management: $4.6B bailout. Archegos: $10B in bank losses. |

### On-Chain Transparency Kills Competitive Trading

DeFi has solved some of these problems. Yield vaults (Yearn), asset management protocols (Enzyme, dHEDGE), and automated strategies (TokenSets) allow permissionless investment with transparent on-chain execution. No accreditation required. No lock-ups. No custodial risk.

But they introduced a fatal new problem: **strategy transparency**.

Every on-chain trading bot, every automated vault, every algorithmic strategy is deployed as public bytecode on a blockchain. Anyone can:

1. **Read the strategy.** Decompile the bytecode, analyze the logic, understand every signal, threshold, and parameter.
2. **Copy the strategy.** Fork the contract, deploy an identical vault, undercut on fees.
3. **Front-run the strategy.** Watch the mempool for the bot's transactions, execute the same trade milliseconds before it, extract value via MEV.
4. **Counter-trade the strategy.** If you know what the bot will do, you can position against it.

The result: **alpha decays to zero**. Any strategy that is profitable and publicly visible will be copied, front-run, or counter-traded until the edge disappears. This is why no serious quantitative trading firm will deploy proprietary logic on-chain.

**This is the fundamental tension:** DeFi gives everyone access but kills the strategy. TradFi keeps the strategy private but locks everyone out.

### Why CRE Confidential Compute Changes Everything

Chainlink's CRE (Chainlink Runtime Environment) with Confidential Compute resolves this tension. It provides a unique infrastructure that did not exist before:

| Component | What It Does | Why It Matters for Alpha Street |
|-----------|-------------|------------------------------|
| **TEE Enclaves** | Trusted Execution Environments (Intel TDX / AMD SEV-SNP) create isolated hardware enclaves on DON nodes. Code and data inside the enclave are invisible to the host operating system, the node operator, and any external observer. | The trading algorithm runs inside the TEE. Nobody -- not even Chainlink node operators -- can see the logic. |
| **Vault DON Threshold Encryption** | Secrets (algorithm code, model weights, API keys) are split into shares using Shamir's Secret Sharing and distributed across DON nodes. No single node holds the complete secret. Reconstruction requires a threshold (e.g., 3-of-5 nodes). | The algorithm is never stored in one place. It only exists as a complete entity inside a TEE during execution, then is discarded from memory. |
| **Confidential HTTP** | HTTP requests made from inside the TEE are encrypted end-to-end. The request URL, headers, body, and response are invisible to anyone outside the enclave. Even the DON node operator cannot see what API is being called or what data is returned. | Market data sources are private. AI inference endpoints are private. Nobody can deduce the strategy by watching what data it consumes. |
| **AES-GCM Response Encryption** | Responses from Confidential HTTP are encrypted with AES-GCM before leaving the TEE. Only the intended recipient (another TEE enclave or a designated smart contract) can decrypt them. | Trade decisions exit the TEE as encrypted payloads. The output is a trade instruction (buy/sell/amount), not the reasoning behind it. |
| **CRE Cron Workflows** | Automated, repeating workflows that execute on a schedule (every 5 minutes, hourly, daily). Each execution runs inside the TEE with access to encrypted secrets. | The fund operates autonomously. No human triggers the trades. The cron fires, the TEE runs the analysis, and the trade executes. 24/7, fully automated. |

**Alpha Street combines all of these into a single product:** an autonomous AI hedge fund where:

- Anyone can invest (deposit into an ERC-4626 vault -- no minimum, no accreditation)
- The trading algorithm is completely private (threshold-encrypted, runs only in TEE)
- Performance is publicly verifiable (NAV updated on-chain, trade history on DEX)
- The fund manager cannot steal funds (all trades via CRE, non-custodial)
- Front-running is impossible (you cannot front-run an algorithm you cannot see)

**This is the killer app for Confidential Compute.** It solves a real, multi-trillion-dollar problem that no other infrastructure can address.

---

## 2. Core Features

### 2.1 Private Algorithm Execution

**What it does:** The trading algorithm -- the core logic that decides what to buy, what to sell, when, and how much -- is encrypted using Vault DON threshold encryption and stored as distributed shares across DON nodes. At execution time, the shares are recombined exclusively inside a TEE enclave on the executing node. The algorithm runs, produces a trade instruction, and is immediately discarded from enclave memory. At no point does the complete algorithm exist outside a TEE.

**Why it matters:** This is the foundational feature. Without it, Alpha Street is just another transparent on-chain vault. With it, Alpha Street preserves alpha the same way Renaissance Technologies preserves alpha -- by keeping the strategy secret. The difference is that Alpha Street does it without requiring investors to trust a single entity. The TEE is the trust anchor, not a fund manager's promise.

### 2.2 Private AI Model

**What it does:** The AI model used for market analysis and trade decisions (model weights, architecture, hyperparameters) is itself threshold-encrypted and stored in Vault DON. During execution, the model is reconstructed inside the TEE, inference runs against current market data, and the model is discarded after the trade decision is produced.

**Why it matters:** In traditional quant finance, the model IS the product. Two Sigma, DE Shaw, and Citadel spend hundreds of millions on model development. If the model is public, the fund has no competitive advantage. Alpha Street's model is as private as any Wall Street firm's -- but the execution is trustless and verifiable.

### 2.3 Private Data Sources

**What it does:** Market data is fetched via Confidential HTTP inside the TEE. The URLs, API keys, request parameters, and response data are all invisible to anyone outside the enclave. Even the list of data sources consulted is private.

**Why it matters:** A sophisticated observer can reverse-engineer a strategy by watching what data it consumes. If you see a bot polling a specific obscure API (e.g., satellite imagery of oil tankers, real-time shipping data, social sentiment from a niche forum), you can deduce the strategy. Confidential HTTP eliminates this attack vector entirely.

### 2.4 Private Trade Reasoning

**What it does:** The AI produces a trade decision that includes internal reasoning (e.g., "Buy LINK because on-chain accumulation by whales exceeds 2-sigma threshold and RSI divergence on 4H chart signals reversal"). This reasoning is logged inside the TEE for auditability but never leaves the enclave. Only the trade instruction (action, token, amount, slippage) exits.

**Why it matters:** Even if someone sees the trade (which they will -- it executes on a public DEX), they cannot determine WHY the trade was made. Without the reasoning, they cannot replicate the strategy. They see the output, never the input or the logic.

### 2.5 Public Performance

**What it does:** The fund's Net Asset Value (NAV) is calculated periodically (every hour) and written on-chain. Historical NAV, cumulative returns, drawdown metrics, and Sharpe ratio are all publicly available and independently verifiable. Anyone can audit the fund's performance without trusting the fund manager's self-reported numbers.

**Why it matters:** This is the key tradeoff that makes Alpha Street investable. Investors cannot see the strategy, but they CAN see the results. This is exactly how traditional hedge funds work -- LPs see quarterly performance reports, not the algorithm. The difference is that Alpha Street's performance data is on-chain, real-time, and tamper-proof.

### 2.6 Investor Vault (ERC-4626)

**What it does:** Investors deposit ETH or supported tokens into an ERC-4626 tokenized vault. They receive vault shares proportional to the current NAV. Shares can be redeemed at any time for the proportional value of the fund's assets. No lock-up periods. No minimum investment. No accreditation required.

**Why it matters:** ERC-4626 is the standard for tokenized vaults in DeFi. It provides composability (shares can be used as collateral in other protocols), transparency (share price is deterministic), and simplicity (deposit/withdraw are single transactions).

### 2.7 Automated Rebalancing

**What it does:** A CRE cron workflow triggers every 5-15 minutes. Each trigger initiates the full analysis-decision-execution loop inside the TEE. The AI analyzes current market conditions, evaluates existing positions, and decides whether to rebalance (buy, sell, hold, or adjust position sizes). If a trade is warranted, it executes automatically via DEX swap.

**Why it matters:** The fund operates 24/7 without human intervention. It does not sleep, it does not take weekends off, it does not panic-sell at 3 AM. Every rebalancing decision is made by the AI inside the TEE with access to real-time market data.

### 2.8 On-Chain Fee Collection

**What it does:** Fees are calculated and collected automatically via CRE workflow:
- **Management fee:** 2% annually, pro-rated daily. Deducted from fund assets.
- **Performance fee:** 20% of profits above the high-water mark. Only charged on new profits -- if the fund drops and recovers, no performance fee is charged until the previous peak is exceeded.
- All fee calculations, deductions, and transfers are executed on-chain with full transparency.

**Why it matters:** In traditional hedge funds, fee calculations are opaque and occasionally disputed. Alpha Street's fees are deterministic, auditable, and automatically enforced by smart contracts. Investors can verify every fee deduction on-chain.

### 2.9 Front-Running Resistance

**What it does:** Because the trading algorithm and its decisions are invisible until the trade is submitted to the DEX, MEV bots and front-runners cannot anticipate the trade. They see it only when it hits the mempool, at which point the opportunity for information-based front-running is eliminated.

**Why it matters:** MEV extraction costs DeFi users billions annually. Strategies that are visible in the mempool before execution are systematically exploited. Alpha Street's trades emerge from the TEE fully formed -- there is no preview, no signal, no opportunity to front-run based on strategy knowledge.

### 2.10 Non-Custodial Operation

**What it does:** The fund manager deploys the strategy and configures the parameters but never has direct access to investor funds. All trades are executed via CRE workflows through the smart contract. The fund manager cannot withdraw investor assets, execute unauthorized trades, or manipulate NAV.

**Why it matters:** This eliminates the single largest risk in traditional hedge funds: manager fraud. Madoff, Bayou, Platinum Partners -- all were possible because the manager controlled the capital. In Alpha Street, the CRE workflow controls trade execution, and the smart contract controls fund custody. The manager controls only the strategy (encrypted in Vault DON).

---

## 3. What is Private vs What is Public

Understanding the privacy boundary is critical to understanding Alpha Street. The Confidential Compute layer creates a sharp line between what is visible to the world and what is locked inside TEE enclaves.

### Privacy Matrix

| Data | Visibility | Where It Lives | Who Can See It |
|------|-----------|----------------|----------------|
| **Trading algorithm source code** | PRIVATE | Vault DON (threshold-encrypted shares) | Nobody. Reconstructed only inside TEE during execution, then discarded. |
| **AI model weights** | PRIVATE | Vault DON (threshold-encrypted shares) | Nobody. Loaded into TEE for inference, then discarded. |
| **Model architecture and hyperparameters** | PRIVATE | Vault DON (threshold-encrypted shares) | Nobody. Part of the encrypted algorithm bundle. |
| **Data source URLs and API keys** | PRIVATE | Vault DON secrets | Nobody. Confidential HTTP requests are invisible outside TEE. |
| **Raw market data fetched** | PRIVATE | TEE enclave memory (ephemeral) | Nobody. Fetched via Confidential HTTP, processed in TEE, never persisted. |
| **Trade reasoning and signal analysis** | PRIVATE | TEE enclave memory (ephemeral) | Nobody. The "why" behind each trade never leaves the enclave. |
| **Position sizing logic** | PRIVATE | Part of encrypted algorithm | Nobody. How the AI decides trade size is part of the private strategy. |
| **Risk model parameters** | PRIVATE | Part of encrypted algorithm | Nobody. Drawdown thresholds, correlation limits, etc. are private. |
| **Trade executions (DEX swaps)** | PUBLIC | On-chain (DEX router transactions) | Everyone. Swap transactions are visible on the blockchain. |
| **Fund NAV** | PUBLIC | On-chain (FundVault contract) | Everyone. Updated hourly, verifiable. |
| **Cumulative returns** | PUBLIC | On-chain (derived from NAV history) | Everyone. Calculated from NAV checkpoints. |
| **Fee collections** | PUBLIC | On-chain (FeeCollector contract events) | Everyone. Every fee deduction emits an event. |
| **Investor deposits and withdrawals** | PUBLIC | On-chain (ERC-4626 events) | Everyone. Standard vault events. |
| **Share price** | PUBLIC | On-chain (derived from NAV / total shares) | Everyone. Deterministic from public on-chain data. |
| **Token balances held by fund** | PUBLIC | On-chain (ERC-20 balanceOf) | Everyone. Anyone can query the fund wallet's token balances. |
| **Circuit breaker activations** | PUBLIC | On-chain (RiskManager events) | Everyone. Trading halts are visible. |

### What an External Observer Sees

An external observer monitoring the blockchain can construct the following picture of Alpha Street:

```
VISIBLE:
  - The fund holds 10,000 USDC, 500 LINK, 2.5 ETH
  - At 14:32 UTC, the fund swapped 1,000 USDC for 150 LINK on Uniswap
  - At 14:47 UTC, the fund swapped 0.5 ETH for 800 USDC on Uniswap
  - NAV was updated to $45,230 at 15:00 UTC (up 2.1% from previous)
  - Management fee of $2.48 was collected at 00:00 UTC
  - Investor 0xABC deposited 5 ETH and received 142.3 vault shares

INVISIBLE:
  - WHY the fund bought 150 LINK (what signal triggered it?)
  - WHAT data sources were consulted (price feeds? sentiment? on-chain metrics?)
  - WHAT AI model produced the decision (architecture? training data? weights?)
  - HOW the position size was determined (why 1,000 USDC and not 2,000?)
  - WHAT the fund's predictive model says about LINK's next 24h price
  - WHAT risk parameters govern maximum position sizes
  - WHETHER the fund is about to make another trade
```

### Why This Privacy Boundary is Sufficient

The visible information (trade executions, balances, NAV) is intentionally public because:

1. **Investors need performance data.** You cannot raise capital without showing returns.
2. **Trade executions are inherently public on DEXs.** There is no way to hide a Uniswap swap on a public blockchain (without additional infrastructure like private mempools, which are out of scope).
3. **Token balances are inherently public.** ERC-20 balanceOf is a public view function.

The invisible information (algorithm, model, data sources, reasoning) is sufficient to protect the strategy because:

1. **Knowing WHAT was traded does not reveal WHY.** A USDC-to-LINK swap could be driven by technical analysis, fundamental analysis, sentiment analysis, on-chain whale tracking, options flow, or any other signal. The trade itself reveals nothing about the signal.
2. **Knowing the positions does not reveal the model.** Current positions are a snapshot. The model's logic for entering and exiting positions -- the actual alpha -- is hidden.
3. **Knowing the frequency does not reveal the strategy.** The cron fires every 5-15 minutes. Whether the AI decides to trade or hold on any given trigger is invisible until a trade appears.

---

## 4. Full CRE Architecture

### Architecture Overview

```
+------------------------------------------------------------------+
|                        CRE WORKFLOW ENGINE                        |
|                     (Runs on DON Nodes in TEE)                    |
|                                                                   |
|  +--------------------+    +--------------------+                 |
|  | Workflow 1:        |    | Workflow 2:        |                 |
|  | Market Analysis +  |    | NAV Calculation    |                 |
|  | Trade Execution    |    | (Hourly)           |                 |
|  | (Every 5-15 min)   |    +--------------------+                 |
|  +--------------------+                                           |
|                            +--------------------+                 |
|  +--------------------+    | Workflow 4:        |                 |
|  | Workflow 3:        |    | Investor Deposit/  |                 |
|  | Fee Collection     |    | Withdrawal         |                 |
|  | (Daily)            |    | (Log Trigger)      |                 |
|  +--------------------+    +--------------------+                 |
|                                                                   |
|  +--------------------+                                           |
|  | Workflow 5:        |                                           |
|  | Risk Management    |                                           |
|  | (Every 5 min)      |                                           |
|  +--------------------+                                           |
+------------------------------------------------------------------+
          |                    |                     |
          v                    v                     v
+------------------+  +------------------+  +------------------+
| VAULT DON        |  | CONFIDENTIAL     |  | ON-CHAIN         |
| (Encrypted       |  | HTTP             |  | CONTRACTS        |
|  Secrets)        |  | (Private APIs)   |  |                  |
|                  |  |                  |  | FundVault.sol    |
| - Algorithm code |  | - Market data    |  | TradeExecutor.sol|
| - Model weights  |  | - AI inference   |  | FeeCollector.sol |
| - API keys       |  | - Sentiment APIs |  | RiskManager.sol  |
| - Risk params    |  | - On-chain data  |  |                  |
+------------------+  +------------------+  +------------------+
                                                    |
                                                    v
                                            +------------------+
                                            | DEX              |
                                            | (Uniswap Router) |
                                            |                  |
                                            | Swap execution   |
                                            | Liquidity pools  |
                                            +------------------+
```

### Workflow 1: Market Analysis + Trade Execution (Core Loop)

This is the primary workflow -- the heartbeat of the fund. It runs every 5-15 minutes and executes the full analysis-decision-trade loop.

```
TRIGGER: Cron (every 5-15 minutes)
    |
    v
STEP 1: Confidential HTTP -- Fetch Market Data
    |   Target: Multiple data APIs (prices, volumes, order book depth,
    |           on-chain metrics, social sentiment)
    |   Privacy: Request URLs, API keys, and response data are all
    |            invisible outside the TEE. Even the LIST of data
    |            sources consulted is private.
    |   Output: Raw market data bundle (stays inside TEE)
    |
    v
STEP 2: Vault DON -- Load Encrypted Algorithm
    |   Action: Request threshold-encrypted algorithm shares from
    |           Vault DON nodes. Minimum threshold (e.g., 3-of-5)
    |           of shares are recombined inside the TEE.
    |   Privacy: No single DON node holds the complete algorithm.
    |            Reconstruction happens exclusively in TEE memory.
    |   Output: Decrypted algorithm + model weights (in TEE memory only)
    |
    v
STEP 3: Confidential HTTP -- AI Inference
    |   Action: Run inference using the decrypted model against the
    |           fetched market data. This may call an external AI
    |           endpoint via Confidential HTTP (e.g., a private
    |           fine-tuned model hosted on a secure server) or run
    |           inference locally within the TEE if model is small enough.
    |   Privacy: The inference request, model input, and model output
    |            are all encrypted end-to-end.
    |   Output: Trade decision object:
    |           {
    |             action: "buy" | "sell" | "hold",
    |             token: "LINK",
    |             amount: "500",
    |             slippage: "0.5%",
    |             confidence: 0.87,
    |             reasoning: "STAYS IN TEE -- never exits"
    |           }
    |
    v
STEP 4: EVM Read -- Check Fund State
    |   Action: Read current fund state from on-chain contracts:
    |           - Fund wallet token balances
    |           - Current positions and their values
    |           - Total investor shares outstanding
    |           - Current NAV
    |           - Circuit breaker status (is trading paused?)
    |   Output: Fund state snapshot
    |
    v
STEP 5: Decision Validation (inside TEE)
    |   Action: Validate the trade decision against fund state:
    |           - Sufficient balance for the trade?
    |           - Position size within risk limits?
    |           - Trading not paused by circuit breaker?
    |           - Confidence above minimum threshold?
    |   Output: Validated trade instruction or NO-OP
    |
    v
STEP 6: Consensus
    |   Action: DON nodes reach consensus on the trade instruction.
    |           Each node independently ran the same workflow in its
    |           own TEE and produced a trade decision. Consensus
    |           ensures all nodes agree on the action, token, and
    |           amount. They do NOT reach consensus on the reasoning
    |           (which stays private in each TEE).
    |   Mode: byFields (action, token, amount must match exactly)
    |   Output: Agreed trade instruction
    |
    v
STEP 7: EVM Write -- Execute Trade
    |   Action: Call TradeExecutor.sol with the trade instruction.
    |           TradeExecutor calls the DEX router (Uniswap) to
    |           execute the swap with specified slippage protection.
    |   Output: Trade execution transaction hash
    |
    v
STEP 8: EVM Write -- Update NAV
    |   Action: Call FundVault.sol to update the NAV based on
    |           post-trade portfolio value.
    |   Output: PerformanceUpdated event emitted
    |
    v
STEP 9: Cleanup
    Action: Algorithm, model weights, market data, and reasoning
            are purged from TEE enclave memory. Nothing persists
            between cron executions.
```

**CRE Workflow Definition (TypeScript):**

```typescript
import { CREWorkflow, ConfidentialHTTP, EVMRead, EVMWrite, VaultDON } from "@chainlink/cre-sdk";

const tradingWorkflow = new CREWorkflow({
  name: "alpha-street-trading",
  trigger: { type: "cron", schedule: "*/5 * * * *" }, // every 5 minutes

  steps: [
    // Step 1: Fetch market data (sources are private)
    {
      id: "fetch_market_data",
      type: "confidential_http",
      config: {
        // URLs, headers, API keys are encrypted -- invisible outside TEE
        requests: [
          { url: "{{secrets.MARKET_DATA_API_1}}", headers: { "Authorization": "Bearer {{secrets.API_KEY_1}}" } },
          { url: "{{secrets.MARKET_DATA_API_2}}", headers: { "Authorization": "Bearer {{secrets.API_KEY_2}}" } },
          { url: "{{secrets.SENTIMENT_API}}", headers: { "Authorization": "Bearer {{secrets.API_KEY_3}}" } },
        ],
        encryption: "aes-gcm"
      }
    },

    // Step 2: Load algorithm from Vault DON
    {
      id: "load_algorithm",
      type: "vault_don_decrypt",
      config: {
        secretId: "alpha-street-algorithm-v1",
        threshold: 3,  // 3-of-5 shares needed
        // Decryption happens exclusively inside TEE
      }
    },

    // Step 3: Run AI inference (private endpoint)
    {
      id: "ai_inference",
      type: "confidential_http",
      config: {
        url: "{{secrets.AI_INFERENCE_ENDPOINT}}",
        method: "POST",
        body: {
          market_data: "{{steps.fetch_market_data.output}}",
          algorithm: "{{steps.load_algorithm.output}}",
          current_positions: "{{steps.read_fund_state.output}}"
        },
        encryption: "aes-gcm"
      }
    },

    // Step 4: Read fund state
    {
      id: "read_fund_state",
      type: "evm_read",
      config: {
        contract: "{{config.FUND_VAULT_ADDRESS}}",
        method: "getFundState",
        abi: ["function getFundState() view returns (uint256 nav, uint256 totalShares, bool tradingPaused)"]
      }
    },

    // Step 5-6: Consensus on trade decision
    {
      id: "trade_consensus",
      type: "consensus",
      config: {
        mode: "byFields",
        fields: ["action", "token", "amount"],
        input: "{{steps.ai_inference.output.tradeInstruction}}"
        // Note: reasoning field is excluded from consensus -- stays private
      }
    },

    // Step 7: Execute trade on DEX
    {
      id: "execute_trade",
      type: "evm_write",
      config: {
        contract: "{{config.TRADE_EXECUTOR_ADDRESS}}",
        method: "executeTrade",
        args: [
          "{{steps.trade_consensus.output.action}}",
          "{{steps.trade_consensus.output.token}}",
          "{{steps.trade_consensus.output.amount}}",
          "{{config.MAX_SLIPPAGE_BPS}}"
        ],
        abi: ["function executeTrade(uint8 action, address token, uint256 amount, uint256 maxSlippageBps)"]
      }
    },

    // Step 8: Update NAV
    {
      id: "update_nav",
      type: "evm_write",
      config: {
        contract: "{{config.FUND_VAULT_ADDRESS}}",
        method: "updateNAV",
        args: ["{{steps.execute_trade.output.postTradeNAV}}"],
        abi: ["function updateNAV(uint256 newNAV)"]
      }
    }
  ]
});
```

### Workflow 2: NAV Calculation (Periodic)

Independently calculates and updates the fund's Net Asset Value on-chain.

```
TRIGGER: Cron (every hour)
    |
    v
STEP 1: HTTP Client -- Fetch Current Prices
    |   Action: Fetch spot prices for all tokens held by the fund
    |           from multiple price feeds (Chainlink Data Feeds,
    |           CoinGecko, exchange APIs).
    |   Note: This uses standard HTTP Client (not Confidential HTTP)
    |         because price data is public information. No need to
    |         hide what price feeds are used for NAV calculation.
    |   Output: Price map { LINK: 18.50, ETH: 3200.00, USDC: 1.00, ... }
    |
    v
STEP 2: EVM Read -- Get Fund Token Balances
    |   Action: For each token in the fund's portfolio, call
    |           balanceOf(fundWallet) on the token's ERC-20 contract.
    |   Output: Balance map { LINK: 500, ETH: 2.5, USDC: 10000, ... }
    |
    v
STEP 3: Calculate NAV
    |   Action: NAV = SUM(token_balance * token_price) for all positions
    |           Example: (500 * 18.50) + (2.5 * 3200) + (10000 * 1.00)
    |                  = 9,250 + 8,000 + 10,000 = $27,250
    |   Output: NAV value in USD (denominated in USDC)
    |
    v
STEP 4: Consensus
    |   Action: DON nodes agree on the calculated NAV value.
    |   Mode: byMedian (use median of all node calculations to
    |          handle minor price discrepancies between sources)
    |   Output: Agreed NAV value
    |
    v
STEP 5: EVM Write -- Update NAV On-Chain
    Action: Call FundVault.sol updateNAV(navValue) to store the
            new NAV and emit NAVUpdated event with timestamp.
    Output: NAVUpdated(uint256 nav, uint256 timestamp) event
```

**CRE Workflow Definition (TypeScript):**

```typescript
const navWorkflow = new CREWorkflow({
  name: "alpha-street-nav",
  trigger: { type: "cron", schedule: "0 * * * *" }, // every hour

  steps: [
    {
      id: "fetch_prices",
      type: "http_client",
      config: {
        requests: [
          { url: "https://api.coingecko.com/api/v3/simple/price?ids=chainlink,ethereum&vs_currencies=usd" },
        ]
      }
    },
    {
      id: "read_balances",
      type: "evm_read",
      config: {
        contract: "{{config.FUND_VAULT_ADDRESS}}",
        method: "getAllBalances",
        abi: ["function getAllBalances() view returns (address[] tokens, uint256[] balances)"]
      }
    },
    {
      id: "calculate_nav",
      type: "compute",
      config: {
        fn: (prices, balances) => {
          let nav = 0;
          for (let i = 0; i < balances.tokens.length; i++) {
            nav += balances.balances[i] * prices[balances.tokens[i]];
          }
          return nav;
        },
        inputs: ["{{steps.fetch_prices.output}}", "{{steps.read_balances.output}}"]
      }
    },
    {
      id: "nav_consensus",
      type: "consensus",
      config: { mode: "byMedian", input: "{{steps.calculate_nav.output}}" }
    },
    {
      id: "update_nav",
      type: "evm_write",
      config: {
        contract: "{{config.FUND_VAULT_ADDRESS}}",
        method: "updateNAV",
        args: ["{{steps.nav_consensus.output}}"],
        abi: ["function updateNAV(uint256 newNAV)"]
      }
    }
  ]
});
```

### Workflow 3: Fee Collection (Periodic)

Calculates and collects management and performance fees daily.

```
TRIGGER: Cron (daily at 00:00 UTC)
    |
    v
STEP 1: EVM Read -- Get Fee State
    |   Action: Read from FeeCollector contract:
    |           - Current NAV
    |           - Last fee collection timestamp
    |           - High-water mark (highest NAV at which performance fee was charged)
    |           - Total shares outstanding
    |           - Accumulated management fee since last collection
    |   Output: Fee state object
    |
    v
STEP 2: Calculate Management Fee
    |   Action: managementFee = NAV * 0.02 * (daysSinceLastCollection / 365)
    |           Example: $27,250 * 0.02 * (1/365) = $1.49/day
    |   Output: Management fee amount in USDC
    |
    v
STEP 3: Calculate Performance Fee
    |   Action: If currentNAV > highWaterMark:
    |             profit = currentNAV - highWaterMark
    |             performanceFee = profit * 0.20
    |           Else:
    |             performanceFee = 0
    |           Example: NAV = $27,250, HWM = $25,000
    |                    profit = $2,250, fee = $450
    |   Output: Performance fee amount in USDC
    |
    v
STEP 4: Consensus
    |   Mode: byFields (managementFee, performanceFee must match)
    |
    v
STEP 5: EVM Write -- Collect Fees
    Action: Call FeeCollector.sol collectFees(managementFee, performanceFee)
            Contract deducts fees from fund assets, transfers to manager
            address, updates high-water mark if applicable.
    Output: FeesCollected(uint256 managementFee, uint256 performanceFee,
            uint256 newHighWaterMark, uint256 timestamp) event
```

### Workflow 4: Investor Deposit / Withdrawal

Event-driven workflow triggered when investors deposit or request withdrawal.

```
TRIGGER: Log (Deposit event or WithdrawRequested event on FundVault)
    |
    v
STEP 1: EVM Read -- Get Current Fund State
    |   Action: Read current NAV and total shares outstanding.
    |   Output: { nav: 27250, totalShares: 1000 }
    |
    v
STEP 2: Calculate Shares (Deposit) or Assets (Withdrawal)
    |
    |   FOR DEPOSIT:
    |     sharePrice = NAV / totalShares = $27.25
    |     sharesToMint = depositAmount / sharePrice
    |     Example: deposit 5 ETH ($16,000) -> mint 587.16 shares
    |
    |   FOR WITHDRAWAL:
    |     sharePrice = NAV / totalShares = $27.25
    |     assetsToReturn = sharesToBurn * sharePrice
    |     Example: burn 200 shares -> return $5,450 in assets
    |
    v
STEP 3: Consensus
    |   Mode: byFields (sharesToMint or assetsToReturn)
    |
    v
STEP 4: EVM Write -- Execute
    |
    |   FOR DEPOSIT:
    |     Call FundVault.sol completeDeposit(investor, sharesToMint)
    |     Mint shares to investor, accept deposited assets into fund
    |
    |   FOR WITHDRAWAL:
    |     Call FundVault.sol completeWithdrawal(investor, assetsToReturn)
    |     Burn investor's shares, transfer proportional assets back
    |
    v
OUTPUT: SharesMinted or SharesBurned event with details
```

### Workflow 5: Risk Management (Circuit Breaker)

Monitors fund health and activates emergency measures if drawdown exceeds limits.

```
TRIGGER: Cron (every 5 minutes)
    |
    v
STEP 1: EVM Read -- Check Drawdown
    |   Action: Read from RiskManager contract:
    |           - Current NAV
    |           - Peak NAV (all-time high)
    |           - Drawdown = (peakNAV - currentNAV) / peakNAV
    |   Output: { currentNAV: 23000, peakNAV: 27250, drawdown: 0.156 }
    |
    v
STEP 2: Evaluate Drawdown Threshold
    |   If drawdown <= 15%: NO ACTION (exit workflow)
    |   If drawdown > 15%: CONTINUE to circuit breaker
    |
    v
STEP 3: EVM Write -- Pause Trading
    |   Action: Call RiskManager.sol pauseTrading()
    |   Output: CircuitBreaker(uint256 drawdown, uint256 timestamp) event
    |
    v
STEP 4: Confidential HTTP -- AI Risk Analysis (inside TEE)
    |   Action: Send portfolio data and market conditions to AI model
    |           for risk assessment. The AI determines whether the
    |           drawdown is caused by:
    |           (a) Broad market crash (systematic risk -- not strategy failure)
    |           (b) Strategy-specific failure (the algorithm made bad trades)
    |   Privacy: Risk analysis reasoning stays inside TEE.
    |   Output: { cause: "market_crash" | "strategy_failure", confidence: 0.92 }
    |
    v
STEP 5: Conditional Response
    |
    |   IF cause == "market_crash" AND confidence > 0.8:
    |     EVM Write: Call RiskManager.sol resumeWithReducedSize(50)
    |     Resume trading with 50% position size limits until drawdown recovers
    |
    |   IF cause == "strategy_failure" OR confidence < 0.8:
    |     EVM Write: Call RiskManager.sol haltUntilReview()
    |     Halt all trading until fund manager manually reviews and approves
    |     Emit StrategyHalted(string reason, uint256 timestamp) event
    |
    v
OUTPUT: Trading resumed with limits OR halted pending review
```

---

## 5. Smart Contracts

### 5.1 FundVault.sol

The core vault contract. Implements ERC-4626 for tokenized vault shares. Handles investor deposits, withdrawals, NAV tracking, and trade execution authorization.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FundVault -- Alpha Street Investor Vault
/// @notice ERC-4626 vault for investor deposits and withdrawals.
///         NAV is updated by CRE workflows. Trades are executed via TradeExecutor.
contract FundVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- State ---
    uint256 public currentNAV;
    uint256 public lastNAVUpdate;
    uint256 public peakNAV;
    bool public tradingPaused;

    address public creForwarder;       // CRE forwarder address (only caller for CRE functions)
    address public tradeExecutor;      // TradeExecutor contract
    address public feeCollector;       // FeeCollector contract
    address public riskManager;        // RiskManager contract

    // --- Events ---
    event NAVUpdated(uint256 nav, uint256 timestamp);
    event TradingPaused(uint256 timestamp);
    event TradingResumed(uint256 timestamp);
    event TradeAuthorized(address indexed executor, address token, uint256 amount);

    // --- Errors ---
    error OnlyCREForwarder();
    error TradingIsPaused();
    error InvalidNAV();

    modifier onlyCRE() {
        if (msg.sender != creForwarder) revert OnlyCREForwarder();
        _;
    }

    constructor(
        IERC20 _asset,          // Base asset (e.g., USDC)
        address _creForwarder,
        string memory _name,    // e.g., "Alpha Street Fund Shares"
        string memory _symbol   // e.g., "vmFUND"
    )
        ERC4626(_asset)
        ERC20(_name, _symbol)
        Ownable(msg.sender)
    {
        creForwarder = _creForwarder;
    }

    // --- Configuration (Owner only, set once) ---

    function setContracts(
        address _tradeExecutor,
        address _feeCollector,
        address _riskManager
    ) external onlyOwner {
        tradeExecutor = _tradeExecutor;
        feeCollector = _feeCollector;
        riskManager = _riskManager;
    }

    // --- NAV Management (CRE only) ---

    /// @notice Update the fund's Net Asset Value. Called by CRE NAV workflow.
    /// @param newNAV The new NAV in base asset units (e.g., USDC with 6 decimals)
    function updateNAV(uint256 newNAV) external onlyCRE {
        if (newNAV == 0) revert InvalidNAV();

        currentNAV = newNAV;
        lastNAVUpdate = block.timestamp;

        if (newNAV > peakNAV) {
            peakNAV = newNAV;
        }

        emit NAVUpdated(newNAV, block.timestamp);
    }

    // --- ERC-4626 Overrides ---

    /// @notice Total assets managed by the fund (= current NAV)
    function totalAssets() public view override returns (uint256) {
        return currentNAV;
    }

    /// @notice Deposit assets and receive vault shares
    function deposit(uint256 assets, address receiver)
        public
        override
        nonReentrant
        returns (uint256 shares)
    {
        shares = super.deposit(assets, receiver);
    }

    /// @notice Withdraw assets by burning vault shares
    function withdraw(uint256 assets, address receiver, address owner_)
        public
        override
        nonReentrant
        returns (uint256 shares)
    {
        shares = super.withdraw(assets, receiver, owner_);
    }

    /// @notice Redeem vault shares for underlying assets
    function redeem(uint256 shares, address receiver, address owner_)
        public
        override
        nonReentrant
        returns (uint256 assets)
    {
        assets = super.redeem(shares, receiver, owner_);
    }

    // --- Trade Authorization (CRE only) ---

    /// @notice Approve TradeExecutor to spend fund assets for a trade.
    ///         Called by CRE trading workflow before executing a swap.
    /// @param token The token to approve for trading
    /// @param amount The amount to approve
    function authorizeTrade(address token, uint256 amount) external onlyCRE {
        if (tradingPaused) revert TradingIsPaused();
        IERC20(token).safeIncreaseAllowance(tradeExecutor, amount);
        emit TradeAuthorized(tradeExecutor, token, amount);
    }

    // --- Circuit Breaker (RiskManager only) ---

    function pauseTrading() external {
        require(msg.sender == riskManager, "Only RiskManager");
        tradingPaused = true;
        emit TradingPaused(block.timestamp);
    }

    function resumeTrading() external {
        require(msg.sender == riskManager, "Only RiskManager");
        tradingPaused = false;
        emit TradingResumed(block.timestamp);
    }

    // --- View Functions ---

    function getFundState()
        external
        view
        returns (uint256 nav, uint256 totalShares, bool paused)
    {
        return (currentNAV, totalSupply(), tradingPaused);
    }

    function getSharePrice() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18; // 1:1 initial price
        return (currentNAV * 1e18) / supply;
    }

    function getDrawdown() external view returns (uint256) {
        if (peakNAV == 0) return 0;
        if (currentNAV >= peakNAV) return 0;
        return ((peakNAV - currentNAV) * 10000) / peakNAV; // basis points
    }
}
```

### 5.2 TradeExecutor.sol

Receives trade instructions from CRE and executes swaps on a DEX. Only callable by the CRE forwarder. Enforces slippage limits.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/// @title TradeExecutor -- Alpha Street Trade Execution
/// @notice Executes DEX swaps on behalf of the fund. Only callable by CRE forwarder.
contract TradeExecutor {
    using SafeERC20 for IERC20;

    enum Action { BUY, SELL }

    address public immutable fundVault;
    address public immutable creForwarder;
    ISwapRouter public immutable swapRouter;
    address public immutable baseAsset; // USDC

    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5% absolute max

    // --- Events ---
    event TradeExecuted(
        Action action,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );

    // --- Errors ---
    error OnlyCREForwarder();
    error SlippageTooHigh();
    error InvalidAction();

    modifier onlyCRE() {
        if (msg.sender != creForwarder) revert OnlyCREForwarder();
        _;
    }

    constructor(
        address _fundVault,
        address _creForwarder,
        address _swapRouter,
        address _baseAsset
    ) {
        fundVault = _fundVault;
        creForwarder = _creForwarder;
        swapRouter = ISwapRouter(_swapRouter);
        baseAsset = _baseAsset;
    }

    /// @notice Execute a trade on the DEX. Called by CRE trading workflow.
    /// @param action 0 = BUY (swap baseAsset for token), 1 = SELL (swap token for baseAsset)
    /// @param token The token to buy or sell
    /// @param amount The amount of tokenIn to swap
    /// @param maxSlippageBps Maximum acceptable slippage in basis points
    function executeTrade(
        uint8 action,
        address token,
        uint256 amount,
        uint256 maxSlippageBps
    ) external onlyCRE returns (uint256 amountOut) {
        if (maxSlippageBps > MAX_SLIPPAGE_BPS) revert SlippageTooHigh();

        address tokenIn;
        address tokenOut;

        if (Action(action) == Action.BUY) {
            tokenIn = baseAsset;
            tokenOut = token;
        } else if (Action(action) == Action.SELL) {
            tokenIn = token;
            tokenOut = baseAsset;
        } else {
            revert InvalidAction();
        }

        // Transfer tokenIn from fund vault to this contract
        IERC20(tokenIn).safeTransferFrom(fundVault, address(this), amount);

        // Approve router
        IERC20(tokenIn).safeIncreaseAllowance(address(swapRouter), amount);

        // Calculate minimum output (slippage protection)
        // In production, this would use an oracle price. For hackathon, simplified.
        uint256 amountOutMinimum = (amount * (10000 - maxSlippageBps)) / 10000;

        // Execute swap
        amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 3000, // 0.3% pool fee
                recipient: fundVault, // Tokens go directly back to fund
                amountIn: amount,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );

        emit TradeExecuted(
            Action(action),
            tokenIn,
            tokenOut,
            amount,
            amountOut,
            block.timestamp
        );
    }
}
```

### 5.3 FeeCollector.sol

Calculates and collects management and performance fees with high-water mark logic.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title FeeCollector -- Alpha Street Fee Management
/// @notice Collects management fees (2% annual) and performance fees (20% of profits
///         above high-water mark). All calculations are transparent and on-chain.
contract FeeCollector {
    using SafeERC20 for IERC20;

    // --- Fee Parameters ---
    uint256 public constant MANAGEMENT_FEE_BPS = 200;    // 2.00% annual
    uint256 public constant PERFORMANCE_FEE_BPS = 2000;  // 20.00% of profits
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // --- State ---
    address public immutable fundVault;
    address public immutable creForwarder;
    address public immutable baseAsset;
    address public feeRecipient;             // Fund manager address

    uint256 public highWaterMark;             // Highest NAV at which performance fee was charged
    uint256 public lastFeeCollection;         // Timestamp of last fee collection
    uint256 public totalManagementFeesCollected;
    uint256 public totalPerformanceFeesCollected;

    // --- Events ---
    event FeesCollected(
        uint256 managementFee,
        uint256 performanceFee,
        uint256 newHighWaterMark,
        uint256 timestamp
    );
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    // --- Errors ---
    error OnlyCREForwarder();
    error TooSoon();

    modifier onlyCRE() {
        if (msg.sender != creForwarder) revert OnlyCREForwarder();
        _;
    }

    constructor(
        address _fundVault,
        address _creForwarder,
        address _baseAsset,
        address _feeRecipient
    ) {
        fundVault = _fundVault;
        creForwarder = _creForwarder;
        baseAsset = _baseAsset;
        feeRecipient = _feeRecipient;
        lastFeeCollection = block.timestamp;
        highWaterMark = 0;
    }

    /// @notice Collect management and performance fees. Called by CRE fee workflow (daily).
    /// @param currentNAV The current NAV of the fund (passed by CRE after reading from vault)
    function collectFees(uint256 currentNAV) external onlyCRE {
        // Minimum 12 hours between collections to prevent abuse
        if (block.timestamp - lastFeeCollection < 12 hours) revert TooSoon();

        uint256 timeElapsed = block.timestamp - lastFeeCollection;
        uint256 managementFee = 0;
        uint256 performanceFee = 0;

        // --- Management Fee ---
        // 2% annual, pro-rated by time elapsed since last collection
        // Formula: NAV * 0.02 * (timeElapsed / secondsPerYear)
        managementFee = (currentNAV * MANAGEMENT_FEE_BPS * timeElapsed)
                        / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        // --- Performance Fee ---
        // 20% of profits above the high-water mark
        // Only charged when NAV exceeds the previous peak at which fees were collected
        if (currentNAV > highWaterMark && highWaterMark > 0) {
            uint256 profit = currentNAV - highWaterMark;
            performanceFee = (profit * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
            highWaterMark = currentNAV;
        } else if (highWaterMark == 0) {
            // First fee collection -- set initial high-water mark
            highWaterMark = currentNAV;
        }
        // If currentNAV <= highWaterMark, no performance fee is charged.
        // The fund must recover to its previous peak before performance fees resume.

        uint256 totalFee = managementFee + performanceFee;

        if (totalFee > 0) {
            // Transfer fees from fund vault to fee recipient
            IERC20(baseAsset).safeTransferFrom(fundVault, feeRecipient, totalFee);
        }

        // Update state
        lastFeeCollection = block.timestamp;
        totalManagementFeesCollected += managementFee;
        totalPerformanceFeesCollected += performanceFee;

        emit FeesCollected(managementFee, performanceFee, highWaterMark, block.timestamp);
    }

    // --- View Functions ---

    /// @notice Preview fees that would be collected if collectFees were called now
    function previewFees(uint256 currentNAV)
        external
        view
        returns (uint256 managementFee, uint256 performanceFee)
    {
        uint256 timeElapsed = block.timestamp - lastFeeCollection;

        managementFee = (currentNAV * MANAGEMENT_FEE_BPS * timeElapsed)
                        / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        if (currentNAV > highWaterMark && highWaterMark > 0) {
            uint256 profit = currentNAV - highWaterMark;
            performanceFee = (profit * PERFORMANCE_FEE_BPS) / BPS_DENOMINATOR;
        }
    }

    /// @notice Get the fee state for CRE workflow consumption
    function getFeeState()
        external
        view
        returns (
            uint256 _highWaterMark,
            uint256 _lastFeeCollection,
            uint256 _totalManagementFees,
            uint256 _totalPerformanceFees
        )
    {
        return (
            highWaterMark,
            lastFeeCollection,
            totalManagementFeesCollected,
            totalPerformanceFeesCollected
        );
    }
}
```

### 5.4 RiskManager.sol

Circuit breaker and risk management. Monitors drawdown and can pause/resume trading.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RiskManager -- Alpha Street Risk Controls
/// @notice Circuit breaker, drawdown limits, and position size controls.
contract RiskManager {

    address public immutable fundVault;
    address public immutable creForwarder;
    address public owner;

    uint256 public maxDrawdownBps = 1500;      // 15% default circuit breaker
    uint256 public positionSizeLimitBps = 10000; // 100% (no limit initially)
    bool public tradingHalted;                   // Manual halt (requires owner review)

    // --- Events ---
    event CircuitBreakerTriggered(uint256 drawdownBps, uint256 timestamp);
    event TradingResumedWithLimits(uint256 positionSizeLimitBps, uint256 timestamp);
    event TradingHalted(string reason, uint256 timestamp);
    event TradingFullyResumed(uint256 timestamp);
    event DrawdownThresholdUpdated(uint256 oldBps, uint256 newBps);

    modifier onlyCRE() {
        require(msg.sender == creForwarder, "Only CRE");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _fundVault, address _creForwarder) {
        fundVault = _fundVault;
        creForwarder = _creForwarder;
        owner = msg.sender;
    }

    /// @notice Called by CRE risk workflow when drawdown exceeds threshold
    function triggerCircuitBreaker(uint256 currentDrawdownBps) external onlyCRE {
        require(currentDrawdownBps > maxDrawdownBps, "Drawdown within limits");

        // Pause trading on the vault
        IFundVault(fundVault).pauseTrading();

        emit CircuitBreakerTriggered(currentDrawdownBps, block.timestamp);
    }

    /// @notice Resume trading with reduced position sizes (market crash scenario)
    function resumeWithReducedSize(uint256 newLimitBps) external onlyCRE {
        positionSizeLimitBps = newLimitBps;
        tradingHalted = false;
        IFundVault(fundVault).resumeTrading();

        emit TradingResumedWithLimits(newLimitBps, block.timestamp);
    }

    /// @notice Halt trading until manual review (strategy failure scenario)
    function haltUntilReview() external onlyCRE {
        tradingHalted = true;
        emit TradingHalted("Strategy failure detected", block.timestamp);
    }

    /// @notice Owner manually resumes after review
    function manualResume() external onlyOwner {
        tradingHalted = false;
        positionSizeLimitBps = 10000; // Reset to full position sizes
        IFundVault(fundVault).resumeTrading();
        emit TradingFullyResumed(block.timestamp);
    }

    /// @notice Update drawdown threshold
    function setMaxDrawdown(uint256 newBps) external onlyOwner {
        uint256 old = maxDrawdownBps;
        maxDrawdownBps = newBps;
        emit DrawdownThresholdUpdated(old, newBps);
    }
}

interface IFundVault {
    function pauseTrading() external;
    function resumeTrading() external;
}
```

### Contract Deployment Order

```
1. Deploy FundVault(USDC_ADDRESS, CRE_FORWARDER, "Alpha Street Shares", "vmFUND")
2. Deploy TradeExecutor(fundVault, CRE_FORWARDER, UNISWAP_ROUTER, USDC_ADDRESS)
3. Deploy FeeCollector(fundVault, CRE_FORWARDER, USDC_ADDRESS, MANAGER_ADDRESS)
4. Deploy RiskManager(fundVault, CRE_FORWARDER)
5. Call FundVault.setContracts(tradeExecutor, feeCollector, riskManager)
6. Register CRE workflows with contract addresses as config
7. Upload encrypted algorithm to Vault DON
```

---

## 6. How the Algorithm Stays Private

This section provides a detailed technical explanation of the full lifecycle of a private algorithm in Alpha Street -- from deployment to execution to disposal.

### Step 1: Strategy Development (Off-Chain)

The fund manager develops the trading strategy off-chain. This is a standard software development process:

```
Fund manager's local machine:
  - Develop trading algorithm (Python, TypeScript, or any language)
  - Train AI model on historical market data
  - Backtest against historical prices
  - Optimize hyperparameters
  - Package algorithm + model weights into a single deployable bundle

Output: algorithm_bundle.tar.gz (code + model weights + config)
```

At this point, the algorithm exists in plaintext only on the fund manager's machine. Nobody else has seen it.

### Step 2: Threshold Encryption (Off-Chain to Vault DON)

The fund manager encrypts the algorithm bundle using Vault DON's threshold encryption:

```
Fund manager's machine:
  |
  v
Vault DON Encryption SDK:
  1. Generate a random AES-256 encryption key (K)
  2. Encrypt the algorithm bundle: E = AES-256-GCM(K, algorithm_bundle)
  3. Split K into N shares using Shamir's Secret Sharing:
     K -> {S1, S2, S3, S4, S5}  (5 shares, threshold = 3)
  4. Distribute shares to DON nodes:
     Node A receives S1
     Node B receives S2
     Node C receives S3
     Node D receives S4
     Node E receives S5
  5. Store encrypted bundle E in shared storage (IPFS or DON storage)
  6. Destroy plaintext K from memory

Result:
  - Encrypted bundle E is stored (useless without K)
  - K does not exist anywhere (split into 5 shares)
  - No single node has more than 1 share
  - Any 3 nodes can reconstruct K, but only inside TEE
```

The fund manager can now delete the plaintext algorithm from their machine if they choose. The algorithm exists only in encrypted form, distributed across the DON.

### Step 3: Execution Trigger (CRE Cron)

Every 5-15 minutes, the CRE cron triggers the trading workflow. What happens next occurs entirely inside TEE enclaves:

```
CRE Cron fires
  |
  v
DON Node A's TEE Enclave:
  1. Request shares from peer nodes (via secure attestation)
  2. Receive S2 from Node B, S3 from Node C (total: S1 + S2 + S3 = threshold met)
  3. Reconstruct K = RecombineShares(S1, S2, S3)
  4. Decrypt algorithm: algorithm_bundle = AES-256-GCM-Decrypt(K, E)
  5. K is immediately zeroed from memory after decryption
  6. Algorithm is now in plaintext ONLY inside this TEE enclave
```

At this moment, the complete algorithm exists in exactly one place: the TEE enclave's protected memory. The host OS, the node operator, and any external observer cannot access this memory. Intel TDX / AMD SEV-SNP hardware guarantees this isolation.

### Step 4: Market Data Fetch (Confidential HTTP)

```
Inside TEE Enclave:
  1. Construct HTTP requests to market data APIs
     (URLs and API keys are from Vault DON secrets -- also decrypted in TEE)
  2. Send requests via Confidential HTTP:
     - TLS termination happens INSIDE the TEE
     - Request is encrypted from TEE to API server
     - Node operator sees encrypted traffic, not the URL or payload
  3. Receive and decrypt responses inside TEE
  4. Parse market data into algorithm's input format

External observer sees:
  - Encrypted network traffic leaving the node
  - Cannot determine: which API, what data, what parameters
```

### Step 5: AI Inference (Inside TEE)

```
Inside TEE Enclave:
  1. Load model weights (decrypted from Vault DON in Step 3)
  2. Feed market data (from Step 4) into model
  3. Run inference:
     Input: { prices, volumes, sentiment, on_chain_metrics, current_positions }
     Output: {
       action: "buy",
       token: "0x514910...",  // LINK address
       amount: 500000000,     // 500 USDC (6 decimals)
       confidence: 0.87,
       reasoning: "Whale accumulation pattern detected. RSI divergence
                   on 4H timeframe. Funding rate negative indicating
                   short squeeze potential. Position size calculated
                   using Kelly criterion with 0.5x conservative multiplier."
     }
  4. The reasoning field STAYS in the TEE. Only action, token, amount
     are passed to the consensus step.
```

### Step 6: Consensus and Trade Execution

```
All DON nodes independently execute Steps 3-5 in their own TEEs.
Each produces a trade decision.

Consensus step:
  - Compare: action, token, amount across all nodes
  - Mode: byFields (exact match required)
  - If all agree: proceed to EVM Write
  - If disagreement: no trade (safety measure)

Note: Reasoning is NOT part of consensus. Each node may phrase
reasoning differently (non-deterministic LLM output), but the
trade decision (deterministic algorithm output) must match.

EVM Write:
  - TradeExecutor.executeTrade(BUY, LINK_ADDRESS, 500_USDC, 50_BPS)
  - This is a public transaction on the blockchain
  - Anyone can see: "The fund bought 500 USDC worth of LINK"
  - Nobody can see: WHY
```

### Step 7: Memory Cleanup

```
After trade execution:
  1. Algorithm plaintext is zeroed from TEE memory
  2. Model weights are zeroed from TEE memory
  3. Market data is zeroed from TEE memory
  4. Reasoning is zeroed from TEE memory
  5. Decryption key K was already zeroed in Step 3

The TEE enclave is now clean. No trace of the algorithm,
model, data, or reasoning remains anywhere in memory.

Next cron trigger: the entire process repeats from Step 3.
The algorithm is re-decrypted from Vault DON shares each time.
```

### What Each Party Can See

| Party | Can See | Cannot See |
|-------|---------|------------|
| **External observer (blockchain)** | Trade executions, token balances, NAV, fees, deposits/withdrawals | Algorithm, model, data sources, reasoning, signals |
| **DON Node operator** | Their single secret share (useless alone), encrypted network traffic | Algorithm (even though it runs on their hardware -- TEE isolates it), market data URLs, API keys |
| **Other DON nodes** | Their own single secret share | Other nodes' shares, the complete algorithm |
| **Fund manager** | Everything (they wrote the algorithm) | They cannot access investor funds directly |
| **Investors** | NAV, returns, fees, their share balance | Algorithm, model, reasoning |
| **MEV bots** | Trade transaction in mempool (after submission) | Upcoming trades, strategy logic, when next trade will happen |

### Attack Vectors and Mitigations

| Attack | Mitigation |
|--------|-----------|
| **Compromise a single DON node** | Attacker gets one share. Useless without threshold (3-of-5). Algorithm cannot be reconstructed. |
| **Compromise threshold number of DON nodes** | TEE hardware prevents share extraction even from compromised nodes. Shares are decrypted only inside TEE, which the node operator cannot inspect. |
| **Side-channel attack on TEE** | Known academic attacks on SGX/TDX require physical access and sophisticated equipment. DON nodes are distributed globally. Practical risk is extremely low. |
| **Analyze trade patterns to reverse-engineer strategy** | Possible in theory over very long time horizons. Mitigated by: (a) strategies can be updated, (b) multiple concurrent strategies obscure individual signals, (c) the search space of possible strategies is effectively infinite. |
| **Fund manager leaks the algorithm** | Not a technical problem -- same as any hedge fund. Fund manager has reputational and financial incentive to keep it secret. |

---

## 7. Comparison vs Existing Protocols

### DeFi Vault / Asset Management Landscape

| Feature | Alpha Street | Yearn Finance | dHEDGE | Enzyme Finance | TokenSets |
|---------|-----------|---------------|--------|----------------|-----------|
| **Strategy privacy** | Complete. Algorithm encrypted in Vault DON, runs only in TEE. Nobody can see the logic. | None. Strategies are public smart contracts. Anyone can read and fork. | None. Manager's trades are visible on-chain. Can be copied in real-time. | None. All trades and positions are public. Strategy is fully transparent. | None. Rebalancing logic and trigger conditions are public. |
| **Front-running resistance** | Strong. Trades emerge from TEE with no preview. MEV bots see the trade only at mempool submission. | None. Strategy logic is public bytecode. Bots can predict trades. | Low. Manager's pending trades can be observed and front-run. | None. All trade intents are visible. | None. Rebalancing is predictable from public parameters. |
| **AI capability** | Native. AI model runs inside TEE with access to private data sources. Model weights are encrypted. | None. Strategies are deterministic smart contract code. No AI. | Limited. Manager makes decisions manually or with off-chain tools. Execution is manual. | Limited. Manager can use off-chain AI but execution is manual and visible. | None. Rules-based rebalancing only. |
| **Custodial risk** | Non-custodial. Fund manager cannot access funds. All trades via CRE forwarder. | Non-custodial. Funds are in smart contracts. | Semi-custodial. Manager has trade authority but cannot withdraw. | Non-custodial. Manager trades but cannot withdraw. | Non-custodial. Automated rebalancing. |
| **Permissionless investment** | Yes. Any amount. No minimum. No accreditation. ERC-4626 vault. | Yes. Deposit to vaults with any amount. | Yes. Deposit with varying minimums per pool. | Varies. Some pools have minimums. | Yes. Buy set tokens on open market. |
| **Performance verification** | On-chain NAV updated hourly. Full trade history on DEX. Fees transparent. | On-chain. APY visible. Historical returns auditable. | On-chain. Returns visible per pool. | On-chain. Full position and trade transparency. | On-chain. Token price reflects performance. |
| **Fee model** | 2/20 (configurable). High-water mark. All on-chain. | Protocol fee + strategy fee. Varies. | Manager sets fees. Typically 1-2% management. | Manager sets fees. Entry/exit fees possible. | Streaming fee (1-3% annual). |
| **Automated execution** | Full automation via CRE cron. 24/7. No human in loop. | Automated vault strategies. Keepers for harvesting. | Manual. Manager executes trades. | Manual. Manager executes trades. | Automated rebalancing on triggers. |
| **Strategy composability** | Limited. Strategy is encrypted, cannot be composed with other protocols. | High. Strategies can stack and compose. | Moderate. Can trade across DeFi protocols. | High. Manager can access most DeFi protocols. | Low. Limited to token basket rebalancing. |
| **Decentralization** | High. DON consensus, TEE execution, on-chain settlement. | High. Smart contract execution, keeper network. | Moderate. Manager is centralized decision-maker. | Moderate. Manager is centralized decision-maker. | Moderate. Set creator defines rules. |

### Key Differentiators

**Alpha Street is the only protocol that solves the alpha preservation problem.** Every other DeFi vault/fund protocol sacrifices strategy privacy for on-chain transparency. This is fine for simple yield farming strategies (where there is no alpha to protect) but fatal for active trading strategies.

**The competitive landscape in one sentence:** Yearn, Enzyme, and TokenSets are transparent automated vaults. dHEDGE is a transparent managed fund. Alpha Street is a private managed fund -- the first one that does not require trusting a single entity with both the strategy AND the capital.

---

## 8. Frontend Pages

### 8.1 Fund Overview (Landing Page)

**Purpose:** First impression for potential investors. Shows fund performance and builds confidence without revealing strategy details.

**Content:**
- NAV chart (line chart, 1D/1W/1M/3M/1Y/ALL timeframes)
- Cumulative return percentage (vs benchmark: ETH, BTC, S&P 500)
- Key metrics cards:
  - Current NAV
  - Share price
  - Total AUM (Assets Under Management)
  - Number of investors (unique depositors)
  - Sharpe ratio (risk-adjusted return)
  - Max drawdown (worst peak-to-trough decline)
  - Win rate (% of trades that were profitable)
- Current positions table: token, balance, value, % of portfolio (public data from on-chain balances)
- Fee structure summary: 2% management, 20% performance, high-water mark explained
- "Strategy is private -- encrypted in Chainlink Vault DON, executed in TEE enclaves" badge/banner
- Deposit CTA button

**Key design principle:** Show performance, hide strategy. The page should feel like a Bloomberg terminal view of a hedge fund -- comprehensive performance data, zero alpha leakage.

### 8.2 Invest Page

**Purpose:** Deposit and withdrawal interface.

**Content:**
- Deposit form:
  - Input: amount in base asset (USDC) or ETH
  - Display: current share price, shares to receive, estimated gas
  - Token approval step (if first deposit)
  - Deposit button -> ERC-4626 deposit transaction
- Withdrawal form:
  - Input: number of shares to redeem OR dollar amount to withdraw
  - Display: current share price, assets to receive, estimated gas
  - Redeem button -> ERC-4626 redeem transaction
- Real-time share price ticker
- Fund capacity indicator (if there is a max deposit cap)
- Risk disclaimer: "Past performance does not guarantee future results. Trading involves risk of loss."

### 8.3 My Position

**Purpose:** Individual investor dashboard.

**Content:**
- Current holdings: shares held, current value in USDC, unrealized P&L (% and absolute)
- Deposit history: table of all deposits with date, amount, shares received, share price at deposit
- Withdrawal history: table of all withdrawals with date, shares burned, amount received
- P&L breakdown: entry cost basis vs current value, realized vs unrealized gains
- Fee impact: total fees paid by this investor (proportional share of management + performance fees)
- Portfolio allocation chart: % of investor's total DeFi portfolio in Alpha Street (if wallet has other positions)

### 8.4 Performance Analytics

**Purpose:** Deep dive into historical performance for sophisticated investors.

**Content:**
- Historical NAV chart with multiple timeframes
- Returns table: daily, weekly, monthly, quarterly, annual returns
- Risk metrics:
  - Sharpe ratio (rolling 30d, 90d, 1Y)
  - Sortino ratio
  - Maximum drawdown (absolute and date range)
  - Calmar ratio (annualized return / max drawdown)
  - Beta vs ETH, BTC
  - Volatility (annualized standard deviation of returns)
- Fee transparency:
  - Total management fees collected (all time, this period)
  - Total performance fees collected (all time, this period)
  - High-water mark history
  - Net vs gross returns comparison
- Drawdown chart: peak-to-trough visualization over time
- Monthly returns heatmap (calendar grid, green/red by return magnitude)

### 8.5 Trade History

**Purpose:** Public record of all fund trades. Demonstrates activity without revealing strategy.

**Content:**
- Trade log table:
  - Timestamp
  - Action (Buy/Sell)
  - Token pair (e.g., USDC -> LINK)
  - Amount in / Amount out
  - Effective price
  - DEX used
  - Transaction hash (link to block explorer)
- Trade frequency chart (trades per day/week)
- Volume chart (total value traded per period)
- Note: "Trade reasoning is encrypted and executed inside TEE enclaves. Only the trade result is visible on-chain."
- Filter by: token, action, date range, minimum size

### 8.6 Admin Dashboard (Fund Manager Only)

**Purpose:** Fund manager controls. Wallet-gated to manager address.

**Content:**
- Strategy management:
  - Upload new algorithm bundle (encrypted upload to Vault DON)
  - View current algorithm version and deployment timestamp
  - Strategy update history
- Circuit breaker controls:
  - Current status (active / paused / halted)
  - Manual resume button (for strategy-failure halts)
  - Adjust drawdown threshold
  - Adjust position size limits
- Fee management:
  - View collected fees (management + performance breakdown)
  - Fee recipient address
- CRE workflow status:
  - Trading workflow: last execution, status, next scheduled
  - NAV workflow: last execution, current NAV
  - Fee workflow: last execution, next scheduled
  - Risk workflow: last execution, current drawdown
- Fund configuration:
  - Supported tokens list
  - DEX router address
  - Max slippage setting

---

## 9. External Integrations

### DEX Integration

| Integration | Purpose | Details |
|-------------|---------|---------|
| **Uniswap V3 Router** | Trade execution | TradeExecutor calls `exactInputSingle` for swaps. Pool fee tier: 0.3% (3000). Slippage protection via `amountOutMinimum`. |
| **Uniswap V3 Quoter** | Pre-trade price estimation | Used in CRE workflow to estimate output amounts before submitting trades. Helps set accurate slippage bounds. |

### Price Data

| Integration | Purpose | Details |
|-------------|---------|---------|
| **Chainlink Data Feeds** | On-chain price oracles | Used for NAV calculation (trusted, decentralized prices). Available for major pairs: ETH/USD, LINK/USD, BTC/USD. |
| **CoinGecko API** | Market data (backup) | Spot prices, 24h volume, market cap. Free tier: 30 calls/min. Used as secondary source for NAV consensus. |
| **Exchange APIs (via Confidential HTTP)** | Private market data | Order book depth, funding rates, open interest. Fetched inside TEE -- sources are private. |

### AI / ML

| Integration | Purpose | Details |
|-------------|---------|---------|
| **Private AI endpoint (via Confidential HTTP)** | Trade decision inference | Fund manager hosts their own model endpoint. CRE calls it from inside TEE. URL, auth, and response are all encrypted. |
| **On-chain analytics APIs (via Confidential HTTP)** | Whale tracking, flow analysis | APIs like Nansen, Arkham, or custom indexers. Data sources kept private to prevent signal reverse-engineering. |

### Blockchain

| Integration | Purpose | Details |
|-------------|---------|---------|
| **Base Sepolia (testnet)** | Contract deployment and testing | ERC-4626 vault, TradeExecutor, FeeCollector, RiskManager deployed here. |
| **Chainlink CRE (DON)** | Workflow execution | 5 workflows registered: trading, NAV, fees, deposits, risk management. |
| **Vault DON** | Secret storage | Algorithm, model weights, API keys stored as threshold-encrypted shares. |

### Frontend

| Integration | Purpose | Details |
|-------------|---------|---------|
| **wagmi / viem** | Wallet connection and contract interaction | Read NAV, deposit, withdraw, view trade history. |
| **Recharts or Lightweight Charts** | Data visualization | NAV charts, returns heatmaps, drawdown visualization. |
| **The Graph (optional)** | Event indexing | Index TradeExecuted, NAVUpdated, FeesCollected events for efficient frontend queries. |

---

## 10. Hackathon Demo Flow

**Duration:** 5 minutes
**Goal:** Show the full lifecycle -- investors deposit, AI trades privately, NAV updates, and demonstrate the privacy boundary.

### Minute 0:00-0:30 -- Problem Statement

"Every on-chain trading strategy is public. You deploy a profitable bot, someone forks it in an hour. Front-runners extract your alpha. Your strategy is dead on arrival. This is why no serious quant fund operates on-chain."

"Alpha Street changes this. It is an autonomous AI hedge fund where the algorithm is completely private -- encrypted in Chainlink's Vault DON, executed only inside TEE enclaves. Anyone can invest. Performance is public. The strategy is invisible."

### Minute 0:30-1:30 -- Architecture Walkthrough

Show the architecture diagram. Walk through:
1. Algorithm is threshold-encrypted and distributed across DON nodes
2. CRE cron triggers every 5 minutes
3. Algorithm is reconstructed ONLY inside TEE
4. Market data fetched via Confidential HTTP (sources hidden)
5. AI produces trade decision inside TEE
6. Only the trade instruction exits -- not the reasoning
7. Trade executes on DEX (public transaction)
8. NAV updates on-chain (public performance)

### Minute 1:30-2:30 -- Live Demo: Investor Deposits

Open the frontend.
1. Show Fund Overview page: NAV chart, current positions, share price
2. Connect wallet (investor wallet with test USDC)
3. Navigate to Invest page
4. Deposit 1,000 USDC into the vault
5. Show transaction confirmation: received vault shares
6. Navigate to My Position: shares held, current value

### Minute 2:30-4:00 -- Live Demo: Confidential Trade Execution

"Now watch what happens when the CRE cron fires."

1. Show CRE workflow logs (admin page or terminal):
   - "Cron triggered: alpha-street-trading"
   - "Confidential HTTP: fetching market data [ENCRYPTED]"
   - "Vault DON: reconstructing algorithm in TEE [3/5 shares]"
   - "AI inference: running inside enclave [CONFIDENTIAL]"
   - "Trade decision: BUY LINK 500 USDC [consensus reached]"
   - "EVM Write: executing swap on Uniswap"
2. Show the Trade History page: new trade appears (USDC -> LINK, 500 USDC, timestamp)
3. Show the block explorer: transaction is visible, but it is just a swap -- no reasoning
4. Show the Fund Overview: NAV updated, positions changed

**Key moment:** "Notice what you can see: the trade happened. The fund now holds LINK. The NAV is $X. But WHY did it buy LINK? What signal triggered it? What model produced this decision? You will never know. That information existed only inside the TEE enclave for the 2 seconds the algorithm ran, and it has already been wiped from memory."

### Minute 4:00-4:30 -- Privacy Contrast

Split screen or side-by-side comparison:

```
LEFT SIDE: What a Yearn vault looks like
  - Strategy code: PUBLIC (viewable on Etherscan)
  - Anyone can read the logic
  - Anyone can fork it
  - MEV bots can predict and front-run

RIGHT SIDE: What Alpha Street looks like
  - Strategy code: ENCRYPTED (in Vault DON)
  - Trade reasoning: ENCRYPTED (in TEE)
  - Data sources: ENCRYPTED (Confidential HTTP)
  - Only visible: trade execution, NAV, returns
```

### Minute 4:30-5:00 -- Closing

"Alpha Street is the first autonomous hedge fund where the algorithm is truly private on-chain. It combines Chainlink's Confidential Compute -- TEE enclaves, Vault DON threshold encryption, and Confidential HTTP -- to solve the alpha preservation problem. Investors get access to institutional-grade strategies without needing accreditation. Performance is verifiable. The strategy is invisible. This is the killer app for Confidential Compute."

---

## 11. Business Model

### Revenue Streams

**Stream 1: Fund Fees (Primary)**

The fund charges industry-standard hedge fund fees:

| Fee | Rate | Calculation | Example (on $10M AUM) |
|-----|------|------------|----------------------|
| Management fee | 2% annual | Pro-rated daily: AUM * 0.02 / 365 | $200,000/year ($548/day) |
| Performance fee | 20% of profits | Above high-water mark only | On $2M profit: $400,000 |

The high-water mark ensures investors are not charged performance fees on recovered losses. If the fund drops from $10M to $8M and recovers to $10M, no performance fee is charged until NAV exceeds $10M again.

**Annual revenue at scale:**

| AUM | Management Fee | Performance Fee (assuming 15% annual return) | Total Revenue |
|-----|---------------|---------------------------------------------|---------------|
| $1M | $20,000 | $30,000 | $50,000 |
| $10M | $200,000 | $300,000 | $500,000 |
| $100M | $2,000,000 | $3,000,000 | $5,000,000 |
| $1B | $20,000,000 | $30,000,000 | $50,000,000 |

**Stream 2: Fund-as-a-Service (Secondary)**

Alpha Street can be offered as a platform for other fund managers to deploy their own private AI strategies:

- Fund managers pay a platform fee (0.5% of AUM or 5% of their management fee revenue)
- Alpha Street handles all CRE infrastructure, Vault DON encryption, and smart contract deployment
- White-label option: managers deploy under their own branding
- Revenue share model: Alpha Street takes a cut of all fees collected through its infrastructure

**Stream 3: Institutional Tier (Future)**

Premium offering for institutional allocators:

- Enhanced reporting (detailed risk analytics, attribution analysis)
- Custom fee structures (negotiated rates for large allocations)
- Priority capacity (guaranteed allocation in high-demand strategies)
- SLA guarantees on CRE uptime and trade execution latency
- Compliance and audit support (SOC 2 reports, regulatory filings)

### Cost Structure

| Cost | Estimate | Notes |
|------|----------|-------|
| CRE workflow execution (gas + DON fees) | $50-200/month | 5 workflows, each running multiple times per day |
| AI inference API | $100-500/month | Depends on model size and call frequency |
| Data feed subscriptions | $50-300/month | Market data, on-chain analytics |
| Frontend hosting | $20-50/month | Vercel, static site |
| Smart contract deployment | One-time: $50-200 | Gas costs on L2 |
| Vault DON storage | TBD | Depends on Chainlink pricing |

At $10M AUM, costs are approximately $2,000-5,000/month against revenue of approximately $40,000/month. The business is profitable at relatively low AUM.

---

## 12. Technical Hackathon Scope

### What to Build (Realistic for Hackathon)

The hackathon demo should emphasize the ARCHITECTURE (private algorithm in TEE) not the quality of the trading strategy. A simple momentum strategy is sufficient to demonstrate the concept.

**Smart Contracts (2 contracts minimum):**

| Contract | Complexity | Hackathon Scope |
|----------|-----------|-----------------|
| FundVault.sol | Medium | Full ERC-4626 vault with NAV tracking, deposit, withdraw, trade authorization. Simplified version of the code in Section 5. |
| TradeExecutor.sol | Low | Receives CRE trade instructions, executes mock swap (or real Uniswap swap on testnet). Slippage protection. |
| FeeCollector.sol | Low (optional) | Can be simplified to a single `collectFee()` function without high-water mark for demo. |
| RiskManager.sol | Low (optional) | Circuit breaker can be a simple pause/unpause for demo. |

**CRE Workflows (1 core + 1 supporting):**

| Workflow | Priority | Hackathon Scope |
|----------|---------|-----------------|
| Trading (Workflow 1) | MUST HAVE | Core loop: Confidential HTTP fetch -> algorithm from Vault DON -> AI decision in TEE -> consensus -> EVM Write swap. This is the entire demo. |
| NAV Calculation (Workflow 2) | SHOULD HAVE | Simple: HTTP Client fetch prices -> EVM Read balances -> calculate NAV -> EVM Write update. Proves the "public performance" half. |
| Fee Collection (Workflow 3) | NICE TO HAVE | Can be omitted or hardcoded for demo. |
| Deposit/Withdrawal (Workflow 4) | HANDLED BY CONTRACT | ERC-4626 deposit/withdraw is handled by the smart contract directly. No CRE workflow needed for basic demo. |
| Risk Management (Workflow 5) | NICE TO HAVE | Can be omitted for demo. Mention in architecture slides. |

**Trading Strategy (Simple Momentum):**

For the hackathon, the "AI" can be a simple momentum indicator:

```typescript
// Simple momentum strategy (runs inside TEE)
function analyzeMarket(prices: number[]): TradeDecision {
  const shortMA = average(prices.slice(-5));   // 5-period moving average
  const longMA = average(prices.slice(-20));   // 20-period moving average

  if (shortMA > longMA * 1.02) {
    return { action: "buy", confidence: 0.8 };
  } else if (shortMA < longMA * 0.98) {
    return { action: "sell", confidence: 0.8 };
  }
  return { action: "hold", confidence: 0.5 };
}
```

The point is not that this strategy is good. The point is that this strategy is PRIVATE. Nobody watching the blockchain can see the moving average periods, the thresholds, or the logic. They only see the resulting trades.

**Frontend (3-4 pages):**

| Page | Priority | Hackathon Scope |
|------|---------|-----------------|
| Fund Overview | MUST HAVE | NAV chart, current positions, key metrics, share price. |
| Invest | MUST HAVE | Deposit and withdraw forms. ERC-4626 interaction. |
| Trade History | MUST HAVE | Table of executed trades from on-chain events. |
| My Position | SHOULD HAVE | Shares held, current value, P&L. |
| Performance Analytics | NICE TO HAVE | Simplified: just NAV history chart. |
| Admin | NICE TO HAVE | Can be a simple page showing CRE workflow status. |

**Mock DEX:**

If Uniswap is not available on the target testnet, deploy a simple MockDEX contract:

```solidity
contract MockDEX {
    // Simulates a swap with a fixed price ratio
    function swap(address tokenIn, address tokenOut, uint256 amountIn)
        external returns (uint256 amountOut)
    {
        // Fixed price: 1 USDC = 0.05 LINK (LINK = $20)
        amountOut = amountIn * getPrice(tokenIn, tokenOut) / 1e18;
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
    }
}
```

### Development Timeline (Estimated)

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Day 1-2 | Smart contracts | FundVault.sol, TradeExecutor.sol, MockDEX (if needed). Deploy to testnet. |
| Day 2-3 | CRE Workflows | Trading workflow with Confidential HTTP and Vault DON integration. NAV workflow. |
| Day 3-4 | Frontend | Fund Overview, Invest, Trade History pages. Connect to contracts. |
| Day 4-5 | Integration + Demo | End-to-end testing. Demo rehearsal. Polish. |

### Technical Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Solidity 0.8.24, OpenZeppelin, Foundry |
| CRE workflows | TypeScript, @chainlink/cre-sdk |
| Frontend | Next.js 14, wagmi, viem, Tailwind CSS, shadcn/ui |
| Charts | Recharts or Lightweight Charts |
| Testnet | Base Sepolia (or target hackathon chain) |
| Wallet | RainbowKit or ConnectKit |

---

## 13. Tracks and Prizes

### Primary Track: Privacy / Confidential Compute

**Prize pool:** Up to $16,000 (estimated based on typical Chainlink hackathon prize structures)

**Why Alpha Street is a strong entry:**
- Uses ALL Confidential Compute primitives: TEE enclaves, Vault DON threshold encryption, Confidential HTTP, AES-GCM response encryption
- Not a toy demo -- solves a real, multi-trillion-dollar problem (alpha preservation in algorithmic trading)
- The privacy is not decorative -- it is ESSENTIAL to the product. Without Confidential Compute, Alpha Street cannot exist. This is the strongest possible argument for why the technology matters.

**Judging criteria alignment:**
- Technical implementation of Confidential Compute features
- Novelty of the use case (first private AI hedge fund on CRE)
- Practical value (addresses a real market gap)
- Completeness of the demo (end-to-end working prototype)

### Secondary Track: DeFi

**Why Alpha Street qualifies:**
- ERC-4626 tokenized vault (standard DeFi primitive)
- DEX integration (Uniswap router)
- Automated market making / trading
- Fee collection and distribution
- Non-custodial fund management

### Tertiary Track: AI

**Why Alpha Street qualifies:**
- AI model runs inside TEE for trade decisions
- Confidential HTTP enables private AI inference
- AI risk analysis for circuit breaker decisions
- The AI is not just a feature -- it IS the product (the fund manager is an AI)

### Multi-Track Submission Strategy

Submit to Privacy as primary. DeFi and AI as secondary tracks. The pitch should emphasize different angles depending on the track:

| Track | Pitch Emphasis |
|-------|---------------|
| **Privacy** | "The first on-chain hedge fund where the algorithm is truly private. Uses every Confidential Compute primitive. Without CRE + TEE, this product cannot exist." |
| **DeFi** | "Permissionless access to institutional-grade trading strategies. ERC-4626 vault. Automated rebalancing. Transparent fee structure. Non-custodial." |
| **AI** | "Autonomous AI fund manager that analyzes markets and executes trades 24/7. Model weights are private. Inference runs in TEE. The fund manager is an AI you can invest in but never reverse-engineer." |

---

## 14. Avalanche Build Games Integration

### Why Avalanche

| Reason | Detail |
|--------|--------|
| **Full EVM compatibility** | Deploy on Avalanche C-Chain with zero contract changes -- Solidity contracts work as-is |
| **Sub-second finality** | Avalanche's finality is ideal for trading execution (faster than Ethereum's ~12s block times) |
| **Native USDC on C-Chain** | Circle CCTP brings native USDC to Avalanche ($600M+ in circulation) -- no bridged/wrapped assets |
| **Future L1 path** | Dedicated trading chain with custom block times (500ms) for faster execution, USDC as native gas via ICTT |

Avalanche is the natural home for a DeFi-native AI fund. The combination of sub-second finality, deep USDC liquidity, and mature DEX ecosystem (Trader Joe, BENQI, Pharaoh) makes it the best execution environment for automated trading strategies.

### Partner Integrations

**Chainlink CRE (already core)**
Price feeds, AI market analysis inside TEE (Gemini for inference), Consensus for strategy validation, Cron for automated rebalancing, CCIP for cross-chain position management. CRE is the trust layer -- everything verifiable without being visible.

**Kite AI -- Verifiable AI Agent Identity**
The AI portfolio manager gets a verifiable identity via Proof of Attributed Intelligence (PoAI). Investors can see the AI agent's track record, model version, and historical performance -- cryptographically verified, not self-reported. This directly addresses the core trust problem: investors in AI-managed funds have no way to audit the AI's history. Kite AI makes the agent's provenance verifiable on-chain. This is particularly powerful for Alpha Street: the strategy is private (CRE TEE), but the agent's identity and track record are public (Kite AI PoAI). Trust without transparency of the algorithm.

**Agora AUSD -- Institutional-Grade Base Asset**
The fund denominates in AUSD instead of volatile crypto collateral. AUSD is institutional-grade, 100% backed by US Treasuries and repos. Yield-sharing means idle AUSD held in the fund earns additional Treasury yield automatically -- the fund earns even when not trading. Investors deposit and withdraw in AUSD, eliminating dollar-peg risk from synthetic stablecoins. This makes Alpha Street compelling for institutional and conservative investors who would never touch a USDT-denominated fund.

**Tether WDK -- Self-Custodial Investor Wallets**
Investors maintain full custody of their fund shares via Tether's Wallet Development Kit. No custodian risk -- investors hold their vmFUND tokens in a self-custodial wallet powered by WDK. Multi-chain support means investors can interact with Alpha Street from any supported chain without bridging manually. This is the UX layer that makes fund participation accessible to non-crypto-native investors.

### Avalanche-Specific Architecture

```
Investor --> Deposits AUSD on Avalanche C-Chain
         --> Alpha Street AI Agent (Kite AI identity, CRE-verified)
         --> CRE TEE: Market analysis + strategy execution
         --> Trades on Avalanche DEXs (Trader Joe, Pharaoh, BENQI)
         --> Cross-chain via CCIP (Arbitrum, Base for more liquidity)

Idle Capital --> Agora AUSD yield (Treasury-backed)
Performance  --> CRE Consensus verified, on-chain leaderboard
Investor UX  --> Tether WDK self-custodial wallet (multi-chain)
AI Identity  --> Kite AI PoAI (cryptographically verified track record)
```

### Avalanche DeFi Integrations

| Protocol | Role in Alpha Street |
|----------|------------------|
| **Trader Joe** | Primary AMM for spot trades + limit order execution on C-Chain |
| **BENQI** | Lending and borrowing -- leverage positions for the fund when strategy calls for it |
| **Pharaoh Exchange** | Concentrated liquidity positions for capital efficiency |
| **Agora AUSD pools** | Idle capital earns yield across all three protocols via AUSD liquidity |

### Build Games Judging Alignment

| Criteria | Alpha Street's Angle |
|----------|------------------|
| **Builder Drive** | AI + DeFi = the hottest intersection in crypto. Alpha Street is a full-stack, production-quality implementation. |
| **Execution** | Complete fund management system: TEE-private AI, automated rebalancing via CRE, ERC-4626 vault, multi-partner integration. |
| **Crypto Culture** | Transparent, verifiable AI fund management vs. opaque TradFi hedge funds. Democratizing institutional strategies. |
| **Long-Term Intent** | Vision for AI-managed fund infrastructure on Avalanche: dedicated L1, custom block times, USDC as native gas. |

---

## 15. Build Games Demo Angle

### The Pitch

**"Watch an AI manage a portfolio -- every decision verifiable."**

The Build Games demo is not about explaining the technology. It is about showing it. The sequence:

1. **Investor deposits AUSD** into the Alpha Street vault on Avalanche C-Chain (Tether WDK wallet, self-custodial).
2. **AI analyzes the market** inside a CRE TEE -- Gemini runs inference on price data, returns a trade decision. The reasoning stays private. Only the action exits the TEE.
3. **Trade executes on Trader Joe** -- the AI's decision becomes an on-chain swap. Verifiable. Immutable. No human touched it.
4. **PnL verified by CRE Consensus** -- the DON nodes agree on the NAV update. The result is posted on-chain.
5. **Kite AI shows the agent's track record** -- not self-reported performance, but cryptographically verified history. The AI has a provable identity. Investors can audit the agent, not just the trades.

### Why This Demo Wins

| Differentiation | Others | Alpha Street |
|----------------|--------|-----------|
| **AI accountability** | "Trust our AI" (black box) | Cryptographically verified agent identity via Kite AI PoAI |
| **Strategy privacy** | Public bytecode (copyable) | TEE-encrypted algorithm (unreadable, unforkable) |
| **Asset safety** | Custodial or volatile collateral | Non-custodial shares + AUSD (Treasury-backed) |
| **Automation** | Manual or semi-automated | Fully autonomous via CRE Cron (24/7, no human trigger) |

This is not a trading bot. It is a **cryptographically accountable AI fund manager** -- the first one built on Avalanche.

# Alpha Street — Hackathon MVP Plan

**Goal:** Build the minimum viable product that demonstrates private AI hedge fund execution via CRE, deployable and demo-able for Chainlink Convergence submission.

**Chain:** Avalanche Fuji
**Auth:** Privy (embedded wallets)
**CRE:** 1 workflow (trading loop), simulated via CLI

---

## What We're Building

An ERC-4626 vault where investors deposit test USDC. A CRE cron workflow runs every 30 seconds: reads vault state, fetches market prices from CoinGecko, sends data to an AI (Claude Service) for a trading decision, reaches consensus, and writes the trade record + updated NAV on-chain. Investors see performance and trade history but never the algorithm or reasoning. The CRE TEE is the privacy boundary.

---

## Architecture

```
[Investor] → deposit USDC → [AlphaVault (ERC-4626)]
                                    ↑ onReport()
                              [Keystone Forwarder]
                                    ↑ signed report
                              [CRE DON / Simulation]
                                    |
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              [EVM Read]    [CoinGecko API]  [Claude Service]
              vault state    ETH/BTC/AVAX     AI trading
              balances       prices           decision
```

---

## Smart Contracts (Foundry)

### 1. TestUSDC.sol
Simple mintable ERC-20 (6 decimals). Owner can mint. Public `faucet(amount)` for testing.

### 2. AlphaVault.sol
ERC-4626 vault + CRE report receiver.

**State:**
- `currentNAV` (uint256) — last CRE-reported NAV
- `lastNAVUpdate` (uint256) — timestamp
- `trades` (Trade[]) — trade history array
- `keystoneForwarder` (address) — CRE forwarder address

**Structs:**
```
Trade { uint8 action, string tokenPair, uint256 amount, uint256 price, uint256 confidence, uint256 timestamp }
```
- action: 0=BUY, 1=SELL, 2=HOLD

**Key Functions:**
- `deposit(uint256 assets, address receiver)` — ERC-4626 standard
- `withdraw(uint256 assets, address receiver, address owner)` — ERC-4626 standard
- `totalAssets()` — returns currentNAV if set, otherwise underlying balance
- `onReport(bytes metadata, bytes report)` — CRE receiver; decodes report, calls `_recordTrade()` + `_updateNAV()`
- `getTradeCount()` → uint256
- `getRecentTrades(uint256 count)` → Trade[]
- `getSharePrice()` → uint256 (NAV / totalSupply, 18 decimals)

**Modifiers:**
- `onlyForwarder()` — msg.sender == keystoneForwarder

**Events:**
- `TradeExecuted(uint8 action, string tokenPair, uint256 amount, uint256 price, uint256 confidence)`
- `NAVUpdated(uint256 oldNAV, uint256 newNAV)`

**Report Encoding:**
```
abi.encode(uint8 action, string tokenPair, uint256 amount, uint256 price, uint256 confidence, uint256 newNAV)
```

### Deployment Order
1. Deploy TestUSDC
2. Mint 1,000,000 TestUSDC to deployer
3. Deploy AlphaVault(testUSDC, keystoneForwarder)

---

## CRE Workflow: `trading`

**Trigger:** Cron (every 30 seconds for demo, every 5 min production)
**Capabilities:** EVM Read, HTTP Client (x2), Consensus, EVM Write
**HTTP Calls:** 2 of 5 limit

### Flow:

**Step 1 — EVM Read: Vault State**
- Read `totalAssets()`, `currentNAV()`, `getTradeCount()` from AlphaVault
- Chain: avalanche-testnet-fuji

**Step 2 — HTTP Client #1: Market Prices**
- GET `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,avalanche-2&vs_currencies=usd&include_24hr_change=true`
- Consensus: `consensusIdenticalAggregation` (deterministic API)

**Step 3 — HTTP Client #2: AI Trading Decision**
- POST to Claude Service (`CLAUDE_SERVICE_URL/chat`)
- Headers: `X-API-Key: {secret}`, `Content-Type: application/json`
- Body: market data + vault state + system prompt asking for JSON trade decision
- System prompt instructs: return `{ action: "BUY"|"SELL"|"HOLD", tokenPair: "ETH/USD", amount: number, confidence: 0-100, reasoning: string }`
- Consensus: `consensusIdenticalAggregation` (same prompt + temperature 0 = deterministic)
- **Privacy note:** In production, this uses Confidential HTTP inside TEE. Reasoning never leaves the enclave. Only action/tokenPair/amount/confidence exit.

**Step 4 — Prepare Report**
- Encode: `(action, tokenPair, amount, price, confidence, newNAV)`
- `prepareReportRequest(encodedPayload)`

**Step 5 — EVM Write: Record Trade + Update NAV**
- `writeReport()` to AlphaVault receiver
- Vault's `onReport()` decodes and stores trade + updates NAV

### Config (config.staging.json):
```json
{
  "receiverAddress": "<deployed_AlphaVault_address>",
  "gasLimit": 500000,
  "chainSelectorName": "avalanche-testnet-fuji"
}
```

### Secrets (secrets.yaml):
```yaml
secretsNames:
  CLAUDE_SERVICE_API_KEY:
    - CLAUDE_API_KEY_VAR
```

---

## Frontend (Next.js 15)

### Page 1: `/` — Fund Overview (Landing + Dashboard)
**Sections:**
- Hero: "Alpha Street — The First Private AI Hedge Fund" with brief description
- NAV Chart: Line chart (Recharts) showing NAV over time from on-chain events
- Key Metrics: Share price, total deposits, total trades, last update time
- Current Portfolio: Table showing recent trade positions (token, action, amount, price)
- CTA: "Deposit" button linking to /invest

**Data Sources:**
- `AlphaVault.totalAssets()`, `AlphaVault.currentNAV()`, `AlphaVault.getSharePrice()`
- `AlphaVault.getRecentTrades(10)`
- NAVUpdated events for chart history

### Page 2: `/invest` — Deposit & Withdraw
**Sections:**
- Wallet balance display (TestUSDC balance)
- Faucet button: mint 1000 TestUSDC to connected wallet
- Deposit form: input amount → approve TestUSDC → deposit to vault → receive ALPHA shares
- Withdraw form: input shares → redeem for TestUSDC
- Position summary: your shares, your value, your P&L

**Data Sources:**
- `TestUSDC.balanceOf(user)`, `AlphaVault.balanceOf(user)`
- `AlphaVault.convertToAssets(userShares)` for current value

### Page 3: `/trades` — Trade History
**Sections:**
- Table: All trades executed by CRE (timestamp, action, token pair, amount, price, confidence)
- Filter: by action (BUY/SELL/HOLD), by token pair
- Note: "Strategy reasoning is private — executed inside CRE TEE"

**Data Sources:**
- TradeExecuted events from AlphaVault

### Layout
- Header: Logo + nav links + Privy wallet button (DiceBear avatar, balance pill)
- Dark theme, terminal/Bloomberg aesthetic
- No landing page feature cards — the dashboard IS the landing page

---

## File Structure

```
alpha-street/
├── contracts/
│   ├── src/
│   │   ├── AlphaVault.sol
│   │   └── TestUSDC.sol
│   ├── script/Deploy.s.sol
│   ├── test/AlphaVault.t.sol
│   ├── foundry.toml
│   └── remappings.txt
├── workflows/
│   ├── trading/
│   │   ├── main.ts
│   │   ├── workflow.yaml
│   │   └── config.staging.json
│   ├── project.yaml
│   ├── secrets.yaml
│   └── .env
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   ├── invest/page.tsx
│   │   ├── trades/page.tsx
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── src/components/
│   ├── src/hooks/
│   ├── src/lib/
│   ├── package.json
│   └── next.config.ts
├── docs/
│   ├── PRODUCT.md
│   └── MVP.md
└── CLAUDE.md
```

---

## Build Order

1. **Contracts** — Write + test AlphaVault.sol and TestUSDC.sol in Foundry
2. **Deploy** — Deploy both to Avalanche Fuji, save addresses
3. **CRE Workflow** — Write trading workflow, test with `cre workflow simulate`
4. **Frontend** — Build 3 pages, connect to deployed contracts via Privy + viem
5. **Simulate** — Run CRE simulation with `--broadcast`, verify trades appear on-chain
6. **Demo** — Record 3-5 min video showing: deposit → CRE executes trades → NAV updates → trade history visible → withdraw

---

## Hackathon Submission (Pre-filled)

**Project name:** Alpha Street

**1-line description:** Autonomous AI hedge fund with private algorithm execution via Chainlink CRE TEE

**Full description:**
Alpha Street is the first protocol that gives everyone hedge fund access while keeping the trading strategy completely private. Investors deposit into an ERC-4626 vault on Avalanche. A Chainlink CRE workflow runs autonomously — fetching market data, running AI inference for trading decisions inside a Trusted Execution Environment, and recording trades on-chain. The algorithm, data sources, and reasoning are never exposed to anyone — not even node operators. Investors see full performance transparency (NAV, trades, fees) but zero strategy leakage. This solves the fundamental tension between on-chain transparency and competitive trading: you get verifiable performance without revealing alpha.

**How is it built?**
Smart contracts (Solidity, Foundry) deployed on Avalanche Fuji: an ERC-4626 vault for investor deposits and a CRE report receiver for trade recording. One CRE cron workflow (TypeScript, CRE SDK) runs every 30 seconds: reads vault state (EVM Read), fetches ETH/BTC/AVAX prices from CoinGecko (HTTP Client), sends market data to an AI service for a trading decision (HTTP Client), reaches consensus across DON nodes, and writes the trade + updated NAV on-chain (EVM Write). Frontend built with Next.js 15, Privy for wallet auth, and Recharts for NAV visualization.

**Challenges:**
Ensuring AI inference is deterministic across DON nodes for consensus (solved with temperature 0 and structured JSON output). Designing the ERC-4626 vault to use CRE-reported NAV instead of raw balance for share price calculation. Balancing the 5 HTTP call limit per workflow while fetching multi-asset prices and AI inference.

**Chainlink Usage:**
CRE workflow using: Cron Trigger, EVM Read, HTTP Client (x2 — CoinGecko prices + AI inference), Consensus (byFields), EVM Write (trade recording + NAV update). The workflow demonstrates autonomous fund management where CRE is the sole executor — no human can directly trade fund assets (onlyForwarder modifier).

**Prize tracks:** DeFi Applications, AI Agents, Privacy-Focused Solutions

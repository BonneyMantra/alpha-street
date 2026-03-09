Avalanche Build Games — Alpha Street Submission

---

### 1. Project Name
Alpha Street

---

### 2. One Sentence Summary
Alpha Street is an autonomous AI hedge fund on Avalanche — anyone can invest, performance is publicly verifiable on-chain, and the trading algorithm runs entirely inside a Chainlink CRE Trusted Execution Environment where even node operators cannot see the strategy.

*(Character count: 240)*

---

### 3. Category
DeFi

---

### 4. Started Before Build Games?
No — new idea

---

### 5. Problem Description

The global hedge fund industry manages $4.5 trillion in assets and consistently outperforms retail investment products — but it is structurally inaccessible to 90%+ of the population. Access requires accredited investor status (minimum $1M net worth or $200K annual income), minimum investments ranging from $100K to $25M, lock-up periods of 1-3 years, and opacity so severe that investors discover problems only after the fund has already imploded (see: Madoff, Bayou, Archegos).

DeFi has partially addressed the access problem: Yearn vaults, Enzyme Protocol, dHEDGE, and TokenSets allow permissionless investment with no accreditation requirements and full on-chain transparency. But they introduced a fatal new problem — strategy transparency kills alpha. Every automated vault is public bytecode. Anyone can decompile it, clone it, undercut on fees, or front-run it in the mempool. This is why no serious quantitative trading firm will deploy proprietary logic on-chain. The result: DeFi vaults either run simple strategies that generate mediocre returns, or they eventually decay to zero once the strategy is discovered and counter-traded.

This is the fundamental tension the market has not resolved: DeFi gives everyone access but kills the strategy. TradFi keeps the strategy private but locks everyone out. The multi-trillion-dollar question is whether you can have both simultaneously.

---

### 6. Primary User Persona

**B2C — two personas:**

**Retail Investor (Passive):** Someone with $500-$50K who wants exposure to a sophisticated, actively managed crypto strategy but has no access to hedge funds (not accredited, or capital is too small), no time to manage active trading themselves, and no trust in opaque "yield protocols" where they cannot verify the manager is not stealing. Their frustration: every DeFi vault that claims "AI-powered" or "algorithmic" is either a black box they cannot verify or a public strategy that decays immediately. They want verifiable performance and no lock-up.

**Fund Manager / Quant Developer (Strategy Side):** A developer or small trading firm with a profitable algorithmic strategy. Their frustration: they cannot deploy it on-chain without making it public (which destroys the edge), and they cannot raise capital through traditional fund structures (regulatory burden, minimum fund size, legal costs). They want a platform where they can deploy their strategy in an encrypted enclave, raise capital permissionlessly, and collect the 2-and-20 fee structure — without the regulatory overhead of running a licensed hedge fund.

---

l

**Yearn Finance:** Yield aggregator with transparent on-chain strategies. Strategies are public Solidity contracts — anyone can fork them, and MEV bots routinely extract value from predictable vault rebalancing patterns. No active management, no AI.

**Enzyme Protocol / dHEDGE:** On-chain asset management platforms. Fund managers set allocations manually or via transparent on-chain logic. No privacy layer. Strategies are visible in real time. Good for social trading where transparency is the feature, not a bug — not viable for competitive quant strategies.

**TokenSets:** Automated portfolio rebalancing using public rule sets. Competitors can see the rule set, anticipate rebalancing, and front-run it. History: Set Protocol's original ETF sets were front-run systematically.

**Traditional Hedge Funds:** Private, effective at protecting alpha, but structurally inaccessible (accreditation, minimums, lock-ups, counterparty risk with fund manager who controls capital).

**Why all insufficient:** None of these can simultaneously deliver (a) permissionless investor access, (b) private strategy execution, and (c) verifiable, non-custodial performance. The technology to do all three at once — hardware TEEs running inside a decentralized oracle network — only became production-ready with Chainlink CRE.

---

### 8. How Alpha Street Solves It Better

Alpha Street is the first protocol that resolves the access-vs-privacy tension by running the trading algorithm exclusively inside Chainlink CRE's Trusted Execution Environments:

**Private Algorithm in TEE (Chainlink CRE Vault DON):** The trading algorithm — source code, AI model weights, and hyperparameters — is threshold-encrypted using Shamir's Secret Sharing and distributed across DON nodes. No single node holds the complete algorithm. At execution time, shares are recombined exclusively inside a TEE enclave on the executing node, the algorithm runs, produces a trade instruction, and is immediately discarded from enclave memory. Nobody — not Chainlink node operators, not the platform, not regulators — can see the strategy.

**Private Market Data (Confidential HTTP):** Data source URLs, API keys, and responses are completely invisible outside the TEE. A sophisticated observer cannot even deduce the strategy by watching what data it consumes — the Confidential HTTP requests are encrypted end-to-end within the enclave.

**Verifiable Performance (CRE Consensus + On-Chain NAV):** Multiple DON nodes independently calculate the fund's NAV every hour and reach consensus on the value. NAV is written on-chain to `FundVault.sol`. Every investor can verify performance history — cumulative returns, drawdown metrics, Sharpe ratio — from immutable on-chain data. No self-reported numbers.

**Non-Custodial (ERC-4626 Vault on Avalanche C-Chain):** Investors deposit AUSD or USDC into an ERC-4626 tokenized vault and receive shares proportional to NAV. The fund manager never has direct access to investor funds — all trades are executed via CRE workflows calling `TradeExecutor.sol`. Deposit and withdraw with no lock-up, no minimums, no accreditation.

**Agora AUSD as Base Asset:** Idle fund capital that is not deployed in positions earns Agora AUSD yield — Treasury-backed returns (~4-5% APY) on the portion of the portfolio sitting in cash. This means the fund has a positive carry floor even during low-conviction periods.

**Kite AI Agent Identity (PoAI):** The Alpha Street trading AI is registered as a Kite AI agent with a Proof of Attributed Intelligence identity. Investors can verify the specific model version running the fund, its training provenance, and its cryptographically attested track record — not self-reported performance, but an auditable agent identity.

**Tether WDK Investor Wallets:** Investors interact with the vault through self-custodial Tether WDK wallets, enabling multi-chain access and eliminating the need for a centralized custodian to hold investor assets.

**Automated 2-and-20 Fee Collection:** Management fees (2% annual, pro-rated daily) and performance fees (20% above high-water mark) are calculated and collected automatically by CRE cron workflows, with full on-chain transparency and enforced by `FeeCollector.sol`. Investors can verify every fee deduction.

---

### 9. Key Blockchain Interactions

**Avalanche C-Chain (primary deployment):**
- `FundVault.sol` (ERC-4626) — `deposit(assets, receiver)`: investor deposits AUSD/USDC and receives vault shares; `redeem(shares, receiver, owner)`: burns shares for proportional assets; `updateNAV(newNAV)`: called only by CRE DON address after hourly consensus; `authorizeTrade(token, amount)`: CRE approves TradeExecutor to spend fund assets
- `TradeExecutor.sol` — `executeTrade(action, token, amount, maxSlippageBps)`: called by CRE after consensus, swaps tokens via Trader Joe AMM router; only callable by CRE forwarder address
- `FeeCollector.sol` — `collectFees(managementFee, performanceFee)`: called by CRE daily cron, deducts fees from fund assets and transfers to manager address, updates high-water mark
- `RiskManager.sol` — `pauseTrading()`: called by CRE circuit breaker workflow if drawdown exceeds 15%; `resumeWithReducedSize(pct)`: resumes trading with position size limit after AI risk analysis in TEE

**Chainlink CRE (DON Network — core execution layer):**
- Cron Trigger (every 5-15 min) — fetches encrypted market data via Confidential HTTP, decrypts algorithm from Vault DON inside TEE, runs AI inference, reaches Consensus on trade decision (`byFields`: action, token, amount must match), writes to `TradeExecutor.executeTrade()`
- Cron Trigger (every hour) — fetches prices via HTTP Client, reads fund balances via EVM Read, calculates NAV, reaches Consensus (`byMedian`), writes to `FundVault.updateNAV()`
- Cron Trigger (daily) — calculates management and performance fees, reaches Consensus, writes to `FeeCollector.collectFees()`
- Cron Trigger (every 5 min) — reads drawdown from `RiskManager`, if >15% pauses trading via EVM Write, runs Confidential HTTP AI risk analysis in TEE to determine cause, conditionally resumes or halts
- Log Trigger on `Deposit` / `WithdrawRequested` events — reads current NAV and share count via EVM Read, calculates shares to mint or assets to return, reaches Consensus, completes transaction via EVM Write

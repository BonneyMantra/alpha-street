# Contracts Core

Deterministic Foundry mapping for AlphaVault contracts.

---

#### AS-CON-1: AlphaVault Foundry suite passes and maps to deterministic results artifact. `manual` `regression`

This test validates the AlphaVault contract through existing Foundry tests and maps the outcome to the spec system. It catches on-chain behavior regressions.

**Preconditions:**
- forge is installed
- contracts dependencies are available

**Steps:**
1. Run forge test --json in contracts package
2. Extract AlphaVault.t.sol suite status
3. Write deterministic mapping evidence

**Pass when:** AlphaVault.t.sol passes and mapping artifact is generated successfully.

#### AS-CON-2: Foundry contract suite remains stable across repeated deterministic executions. `manual` `deep`

This deep contract test verifies that repeated forge execution yields stable outcomes for mapped suites. It catches flakiness and hidden order dependencies.

**Preconditions:**
- AS-CON-1 passes

**Steps:**
1. Run forge test --json and capture suite status
2. Run forge test --json again with unchanged code
3. Verify consistent outcomes and no flaky behavior

**Pass when:** Repeated forge executions are consistent and deterministic for mapped suites.

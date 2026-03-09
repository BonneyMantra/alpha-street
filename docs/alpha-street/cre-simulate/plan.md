# CRE Simulation

Deterministic CRE simulation checks for trading workflow.

---

#### AS-CRE-1: trading workflow simulation succeeds with deterministic trading fixture. `manual` `regression`

This test validates workflow runtime behavior using deterministic fixture inputs. It catches CRE dependency and runtime regressions in the trading workflow.

**Preconditions:**
- CRE CLI is installed
- workflow dependencies are installed

**Steps:**
1. Run cre workflow simulate trading with docs/fixtures/workflows/trading.json payload
2. Capture simulation output
3. Verify successful exit

**Pass when:** Simulation exits successfully and output evidence is persisted.

#### AS-CRE-2: Trading workflow simulation remains deterministic across repeated runs with identical fixture input. `manual` `deep`

This deep simulation test verifies output stability by executing the workflow twice with the same payload. It catches hidden nondeterminism and unstable workflow behavior.

**Preconditions:**
- AS-CRE-1 passes

**Steps:**
1. Run cre workflow simulate trading with deterministic fixture
2. Run the same command again with identical fixture
3. Compare output markers and assert deterministic behavior

**Pass when:** Both simulations succeed and produce deterministic output structure for key markers.

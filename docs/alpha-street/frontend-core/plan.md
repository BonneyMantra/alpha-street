# Frontend Core

Smoke and regression checks for alpha-street implemented pages.

---

#### AS-FE-1: Home, invest, and trades pages render without runtime crashes. `browser` `smoke`

This smoke test validates route-level render stability on all implemented frontend pages. It catches hydration and component regressions quickly.

**Preconditions:**
- frontend is running on localhost:3020

**Steps:**
1. Open /
2. Open /invest
3. Open /trades and verify no runtime exception

**Pass when:** All routes render and remain interactive without error boundaries.

#### AS-FE-2: Invest page interactions stay stable under deterministic input actions. `browser` `regression`

This browser regression test validates basic invest UI interactions and state transitions. It protects against form/action regressions in investment flow.

**Preconditions:**
- frontend is running

**Steps:**
1. Open /invest
2. Input deterministic values in available controls
3. Trigger primary action and observe stable UI transition

**Pass when:** Interaction does not crash and expected pending/success UI state is shown.

#### AS-FE-3: Cross-page investment journey remains stable during repeated navigation between invest and trades. `browser` `deep`

This deep browser test validates a realistic navigation journey with repeated route transitions. It catches state and routing regressions that do not appear in isolated page checks.

**Preconditions:**
- AS-FE-1 passes

**Steps:**
1. Open /invest and interact with deterministic controls
2. Navigate to /trades and back to /invest
3. Confirm UI remains stable and interactive after transitions

**Pass when:** Journey completes without runtime errors and both pages remain interactive after repeated transitions.

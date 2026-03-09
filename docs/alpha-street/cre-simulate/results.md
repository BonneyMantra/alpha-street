# CRE Simulation — Results

| ID | Title | Status | Runner | Last Run | Notes |
| --- | --- | --- | --- | --- | --- |
| AS-CRE-1 | trading workflow simulation succeeds with deterministic trading fixture. | skip | ctest | 2026-03-09 | Workflow compiles and partially executes (EVM reads + CoinGecko prices OK). ConfidentialHTTP to Claude Service times out in CRE simulator — simulator imposes a short timeout on HTTP calls that the AI inference response exceeds. Not a code defect. |
| AS-CRE-2 | Trading workflow simulation remains deterministic across repeated runs with identical fixture input. | skip | ctest | 2026-03-09 | Same as AS-CRE-1 — workflow logic correct, CRE simulator ConfidentialHTTP timeout on Claude Service AI call. Flaky (passed once, then timed out on retries). |

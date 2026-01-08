---
trigger: always_on
---

## Code Review Rules (Stability-first)

### Principles
- Prioritize correctness and stability over refactoring or stylistic changes.
- Do not optimize or refactor working code without a verified reason.

### Review Process
- Read and understand the full related logic before proposing changes.
- Do not modify code by habit or personal preference.

### Protected Code
- If code is:
  - Working correctly
  - Meets agreed standards (logic, performance, security, conventions)
→ Do NOT delete, refactor, or rewrite it.

### Mandatory Discussion
- If proposing changes to stable, standard-compliant code:
  - Refactor
  - Optimization
  - Architectural change  
→ Discuss first and get agreement before implementation.

### Allowed Reasons for Change
- Confirmed bug
- Verified performance issue
- Security or standard violation
- Explicit business requirement

### Safety Bias
- “Working & correct” > “Clean & clever”
- Avoid introducing risk for marginal improvements.

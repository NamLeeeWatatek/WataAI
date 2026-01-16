---
description: Create actionable tasks from the implementation plan.
---

1.  **Identify Context**: Determine the current feature directory (usually `specs/<branch>/`).
2.  **Create Tasks File**:
    -   Command: `Copy-Item -Path .\.specify\templates\tasks-template.md -Destination <FEATURE_DIR>\tasks.md -Force`
    -   Ensure `<FEATURE_DIR>` is the correct absolute path.
3.  **Read Plan**: Read the `implementation_plan.md` in the feature directory.
4.  **Edit Tasks**:
    -   View the `tasks.md` file.
    -   Break down the plan into small, improved steps.
    -   Populate the task list.
5.  **Review**: Ask the user to confirm the task list.

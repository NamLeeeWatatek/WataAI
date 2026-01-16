---
description: Starts the specification phase for a new feature using Speckit.
---

1.  **Analyze Request**: Identify the feature description from the user's prompt.
2.  **Run Tool**: Execute the Speckit feature creation script.
    -   Command: `& .\.specify\scripts\powershell\create-new-feature.ps1 "<FEATURE_DESCRIPTION>"`
    -   Replace `<FEATURE_DESCRIPTION>` with the user's description.
3.  **Read Output**: Capture the `SPEC_FILE` path from the command output.
4.  **Edit Spec**:
    -   View the newly created spec file (e.g., `specs/<branch>/spec.md`).
    -   Update the "User Story" and "Overview" sections based on the user's request.
    -   Remove any template placeholders.
5.  **Review**: Ask the user to review the spec.

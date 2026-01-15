---
description: Starts the Implementation phase (Developer) for an approved spec.
---

# Workflow: Build Feature from Spec (Developer Phase)

1.  **Identify Spec**: Ask which spec file to build.
2.  **Verify Status**: Check if `status: approved` in the file. If not, Warn user and suggest `/spec-design`.
3.  **Read Tech Design**: Analyze the "Technical Design" section deeply.
4.  **Implementation Loop**:
    -   **Backend First**: Create/Update DTOs, Entities, Services, Controllers.
    -   **Frontend Second**: Update API clients, Types, Components, Pages.
5.  **Strict Adherence**: Do not invent new logic not in the spec. If blocked, ask to update spec.
6.  **Verify**: Run lint/build to ensure no breakages.
7.  **Mark Done**: Update spec to `status: implemented`.

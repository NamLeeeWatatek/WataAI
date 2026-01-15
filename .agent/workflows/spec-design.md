---
description: Starts the System Design phase (Architect) for an existing draft spec.
---

# Workflow: Design System Spec (Architect Phase)

1.  **Identify Spec**: Ask which spec file to design (if not clear).
2.  **Read Spec**: Read the content of the target `.specs/XXX.md` file.
3.  **Analyze & Design**:
    -   **Frontend**: Define Components, Route URLs, State.
    -   **Backend**: Define API endpoints (Method, URL, DTOs), DB Schema changes.
    -   **Integrations**: Identify 3rd party APIs or shared interactions.
4.  **Update Spec**: Write these details into the "Technical Design" section of the file.
5.  **Review Loop**: Ask the user to review the technical design.
6.  **Approval**: If user agrees, change `status: approved`.
7.  **Next Step**: Inform the user to run `/spec-build` to start coding.

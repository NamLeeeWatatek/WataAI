---
description: Starts the Requirement Gathering phase (BA) for a new feature.
---

# Workflow: Start New Feature Spec (BA Phase)

1.  **Ask for Feature Name**: If not provided, ask the user what feature they want to build.
2.  **Create Spec File**: Copy `.specs/000-template.md` to `.specs/XXX-feature-name.md` (increment index).
3.  **Interview User**:
    -   Ask about the **User Story**: Who is it for? Value?
    -   Ask about **Business Rules**.
    -   Ask about **Scope** (what is IN, what is OUT).
4.  **Update Spec**: Translate answers into the "Overview" and "User Story" sections of the markdown file.
5.  **Set Status**: Set `status: draft`.
6.  **Next Step**: Inform the user to run `/spec-design` when requirements are clear.

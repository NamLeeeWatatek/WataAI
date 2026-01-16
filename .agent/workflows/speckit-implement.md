---
description: Execute the implementation tasks for the current feature.
---

1.  **Read Tasks**: Read the `tasks.md` file in the current feature directory.
2.  **Iterate**: For each unchecked task:
    -   **Context**: Read the relevant files mentioned in the task.
    -   **Code**: Perform the necessary code changes (using `write_to_file`, `replace_file_content`, etc.).
    -   **Verify**: Run tests or checks if applicable.
    -   **Update Task**: specificy the task as completed in `tasks.md` (check the box).
3.  **Completion**: When all tasks are done, inform the user.

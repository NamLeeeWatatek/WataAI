---
trigger: always_on
version: 2.0.2026
last_updated: 2026-01-08
category: development-process
related_rules:
  - response-guidelines
  - rule-governance
---

## Context Continuity Management

Maintain working context throughout the session to ensure consistency and prevent information loss during long interactions.

### Core Principles
- Track goal, constraints, key decisions, and progress state
- Mark uncertainties clearly with `UNCONFIRMED` tag
- Update context when significant changes occur
- Keep information concise and actionable

### Context Tracking
- **Goal & Success Criteria**: Clearly defined objectives
- **Constraints/Assumptions**: Current limitations and assumptions
- **Key Decisions**: Important choices made during the session
- **Progress State**:
  - Done: Completed tasks
  - Now: Current focus
  - Next: Upcoming priorities
- **Open Questions**: Unresolved items needing clarification

### Implementation
- Integrate context tracking naturally into workflow
- Update context when major changes occur (goal shifts, new constraints)
- Use `UNCONFIRMED` tag for assumptions needing validation
- Provide context snapshot when relevant to current task

### Modern Practices (2026)
- Context-aware AI with automatic state management
- Integration with modern IDE context tracking
- Support for multi-session continuity
- Automatic uncertainty detection and flagging

### Rule Metadata

**Version**: 2.0.2026
**Status**: Active
**Last Reviewed**: 2026-01-08
**Applies To**: All AI development sessions
**Priority**: High
**Related Rules**:
- [Response Guidelines](response-guidelines.md)
- [Rule Governance](rule-governance.md)

### Common Pitfalls
- Over-documenting trivial context changes
- Failing to update context when goals shift
- Not marking uncertainties clearly
- Providing excessive context snapshots

### When to Use
- Long development sessions
- Complex multi-step tasks
- Projects requiring continuity across sessions
- Situations with evolving requirements

### When Not to Use
- Simple, single-step tasks
- When context is naturally maintained by the IDE
- For trivial or repetitive operations

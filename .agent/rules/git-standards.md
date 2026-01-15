
---
name: git-standards
description: Git version control standards, commit message conventions, and branching strategy.
tools: Bash, Git
model: sonnet
---

## Git Standards & Workflow

### 1. Branching Strategy (Trunk-Based / Simple Gitflow)
- **main**: Source of truth, production-ready code.
- **dev** (Optional): Integration branch dev.
- **feat/name**: New feature (e.g., `feat/auth-login`).
- **fix/name**: Bug fix (e.g., `fix/user-comp`).
- **chore/name**: Maintenance, config changes.

### 2. Commit Message Convention (Conventional Commits)
Format: `type(scope): subject`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Scopes:**
- `web`: Changes to the frontend app
- `backend`: Changes to the backend app
- `shared`: Changes to shared infra/libs
- `global`: Root level changes

**Examples:**
- `feat(backend): add user authentication endpoint`
- `fix(web): resolve layout issue on mobile`
- `chore(global): update husky configuration`

### 3. Pull Request (PR) Process
1. Ensure code builds and lints locally.
2. Update documentation if necessary.
3. Title PR clearly (same format as commit messages).
4. Request review.

### 4. MCP Integration
- When asking AI to write code, reference the specific scope (e.g., "Implement feature X for `backend`").
- The AI will check `backend-design.md` or `frontend-design.md` automatically if instructed.

---
status: draft
start_date: 2026-01-15
owner: User
context: [web, workflow-editor, ai-agents]
---

# Spec: AI Workflow Automation System

## 1. Overview
Build a "Workflow Automation" system similar to Odyssey/ComfyUI where users can visually chain together AI nodes to create complex pipelines.
This includes:
1.  **Workflow Gallery**: A marketplace-style view to discover and manage workflows.
2.  **Visual Editor**: A node-based editor (using `reactflow`) to build the pipelines.
3.  **Knowledge Integration**: A specific node type that allows querying the existing Knowledge Base system (`KbService`) to use RAG within visual workflows.

## 2. User Stories
### 2.1 Workflow Gallery
-   As a User, I want to see a grid of available workflows with rich previews (images, tags like "Inpainting", "Text-to-Emoji").
-   As a User, I want to filter workflows by category (Image, Text, Utility).
-   As a User, I want to duplicate a workflow to customize it.

### 2.2 Visual Editor
-   As a User, I want to drag and drop nodes (Input -> Processing -> Output).
-   As a User, I need specific nodes for:
    -   **LLM Node**: Call an AI model (OpenAI, Gemini).
    -   **KB Query Node**: Query a specific Knowledge Base ID and get text context back.
    -   **Image Gen Node**: Stable Diffusion / DALL-E integration.

### 2.3 Knowledge Base Integration
-   **Context**: The system already has a "Knowledge Base" feature (files, crawling).
-   **Requirement**: A workflow node must accept a `query` (string) and a `kbId` (selection), and output `retrieved_context` (string) to be passed to an LLM node.

## 3. UI/UX Reference
-   **Style**: Dark mode, professional "Canvas" look.
-   **Gallery**: Card-based layout with large aspect-ratio thumbnails (see reference image).
-   **Editor**: Infinite canvas with minimap and controls.

## 4. Technical Constraints
-   Frontend: Next.js + React Flow + Shadcn UI.
-   Backend: NestJS (New `WorkflowsModule`).
-   Data: Store workflow graph as JSON in Postgres.

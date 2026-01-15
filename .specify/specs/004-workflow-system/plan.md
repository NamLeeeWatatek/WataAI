# Implementation Plan: Workflow System

## 1. Architecture

### 1.1 Backend (NestJS)
-   **New Module**: `WorkflowsModule`
-   **Entity**: `Workflow` (id, name, description, thumbnail_url, graph_json, is_public, owner_id).
-   **Service**: `WorkflowExecutionService` - Responsbile for traversing the graph and executing nodes.
-   **Integration**: Inject `KbService` to handle `kb-query` nodes.

### 1.2 Frontend (Next.js + React Flow)
-   **Gallery Page**: `/workflows`
    -   Grid of `WorkflowCard` components.
    -   Search/Filter state.
-   **Editor Page**: `/workflows/[id]`
    -   `ReactFlow` canvas.
    -   Custom Node Types: `LLMNode`, `KBRetrievalNode`, `ImageGenNode`.
    -   Sidebar for drag-and-drop.

### 1.3 Knowledge Base Integration Logic
-   **Node UI**: `KBRetrievalNode`
    -   Inputs: `Query` (Connection from previous node or manual text).
    -   Settings: `Knowledge Base Select` (Dropdown fetching user's KBs).
    -   Outputs: `Context` (String passed to next node).
-   **Execution**:
    -   When the workflow runs, the backend receives the graph.
    -   It identifies `KBRetrievalNode`.
    -   It calls `ai-providers.service` (or `kb.service`) to perform a vector search.
    -   Resulting text chunks are concatenated and passed to the next node (usually an LLM Prompt).

## 2. Component Design (Frontend)

### 2.1 WorkflowCard (The "Gallery" Item)
Reflecting the user's image:
-   **Thumbnail**: Large, dominant aspect ratio.
-   **Meta**: "Workflow" badge, Title, Date.
-   **Actions**: "Run", "Edit", "Copy".

### 2.2 Custom React Flow Nodes
-   **KBNode.tsx**:
    -   Body: `<Select>` to choose KB.
    -   Handles: `Target` (Query), `Source` (Context).

## 3. Step-by-Step Implementation

1.  **Frontend - Gallery**: Create layout and `WorkflowCard` component matching the reference image.
2.  **Frontend - Editor Shell**: Setup `reactflow` with DND provider.
3.  **Frontend - Custom Nodes**: Implement the `KBRetrievalNode` UI.
4.  **Backend - Stub**: (Optional for this task) Setup basic API to save/load workflows.

## 4. Dependencies
-   `reactflow`: `^11.11.4` (Confirmed installed).
-   `lucide-react`: For icons.

## 5. Verification
-   Run dev server.
-   Visit `/workflows`.
-   Verify Gallery visually matches the "premium" aesthetic.
-   Open a workflow and check if KB Node can select a Knowledge Base.

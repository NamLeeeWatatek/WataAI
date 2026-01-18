---
name: pagination-standard
description: Unified standard for pagination and scrolling across the WataAI platform to ensure UX consistency and system performance.
tools: Read, Write
model: sonnet
---

# Pagination & Scrolling System Standard

This document defines the single, consistent standard for data navigation across the WataAI SaaS platform. All developers must adhere to these patterns based on the screen's intent.

## 1. Screen Classification & Pattern Mapping

| UX Purpose | Intent | Pattern | Technical Requirement |
| :--- | :--- | :--- | :--- |
| **Discovery** | Exploratory browsing, high visual content (e.g., Template Gallery, Tool Marketplace). | **Infinite Scroll** | Cursor-based pagination. |
| **Management** | Precise item location, CRUD operations (e.g., User Management, Bot Lists, KB Files). | **Classic Pagination** | Offset-based or Cursor-based with Page Jump support. |
| **Logs / History** | Chronological streams, append-only data (e.g., Activity Logs, Chat History). | **Infinite Scroll** | Cursor-based pagination (Mandatory). |
| **Creation Flow** | Intentional selection within a multistep process (e.g., Selecting a template for a new bot). | **"Load More" Button** | Cursor-based pagination. |
| **Marketing** | Non-critical informational content (e.g., Blog, Case Studies). | **"Load More" Button** | Cursor-based pagination. |

## 2. Pattern Definitions

### 2.1 Infinite Scroll (Exploration)
- **Constraint**: Only use when the goal is discovery or reading a chronological stream.
- **Implementation**: Trigger fetch when the viewport is within `200px` of the scroll container end.
- **UX Requirement**: No critical content (footer links, contact info) can be placed at the bottom of an infinite scroll page.

### 2.2 Classic Pagination (Operation)
- **Constraint**: Use for data tables and administrative lists where precision matters.
- **UI Elements**: [First] [Prev] [1] [2] [...] [10] [Next] [Last] + [Items per page].
- **UX Requirement**: Total record count must be displayed.

### 2.3 "Load More" (Intentional)
- **Constraint**: Use when user focus is high and we want to avoid accidental loading.
- **UI Elements**: A primary-ghost or outline button at the bottom: "Load More (X items remaining)".

## 3. Performance & Data Standards

1. **Cursor-Based Pagination**: Mandatory for Infinite Scroll and Load More to prevent data duplication/skipping during concurrent writes.
2. **Batch Size**: 
   - Desktop: 20-50 items per batch.
   - Mobile: 10-15 items per batch.
3. **No Over-fetching**: Do not fetch hidden fields or heavy relations unless required for the current view.

## 4. Loading States Standard

Follow the hierarchy defined in `loading-strategy.md`:

### I. Initial Page Load
- **Standard**: **Skeleton Screens**.
- **Rule**: Match the shape and number of items (e.g., if limit is 20, show 20 skeleton rows/cards).

### II. Pagination Feedback
- **Infinite Scroll**: **Inline Spinner** (`Loader2` from lucide-react, `animate-spin`) matched to the item width.
- **Load More**: **Button Loading State**. Replace button text with a spinner; keep button width stable.
- **Classic Pagination**: **Partial Overlay**. Fade the table body to 50% opacity and show a centered spinner. **Never block the whole screen.**

## 5. Prohibitions

- **NEVER** mix pagination styles on the same entity type in different views (e.g., don't use Infinite Scroll for Users in one place and Classic in another).
- **NEVER** use Global Loading Overlays for pagination.
- **NEVER** use "Offset + Limit" for Infinite Scrollers (highly prone to inconsistencies).

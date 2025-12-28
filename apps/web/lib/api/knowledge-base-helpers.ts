/**
 * Knowledge Base API Helpers
 * Higher-level functions that automatically handle workspace context
 */
import { getSession } from 'next-auth/react'
import { getKnowledgeBases, createKnowledgeBase } from './knowledge-base'
import type { CreateKnowledgeBaseDto } from '../types/knowledge-base'

/**
 * Get knowledge bases for current workspace from session
 * Automatically uses workspace from session if available
 */
export async function getWorkspaceKnowledgeBases() {
  const session = await getSession()
  const workspaceId = session?.workspace?.id
  
  if (!workspaceId) {
  }
  
  return getKnowledgeBases(workspaceId)
}

/**
 * Create knowledge base in current workspace
 * Automatically adds workspaceId from session
 */
export async function createWorkspaceKnowledgeBase(
  data: Omit<CreateKnowledgeBaseDto, 'workspaceId'>
) {
  const session = await getSession()
  const workspaceId = session?.workspace?.id
  
  if (!workspaceId) {
    throw new Error('No workspace found in session')
  }
  
  return createKnowledgeBase({
    ...data,
    workspaceId,
  })
}


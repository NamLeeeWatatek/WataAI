
export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  author?: string
  status: 'draft' | 'published' | 'archived'
  views?: number
}

export interface KnowledgeCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  documentCount?: number
}

export interface KnowledgeTag {
  id: string
  name: string
  color?: string
  count?: number
}


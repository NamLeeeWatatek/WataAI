
export interface Category {
  id: string | number
  name: string
  slug: string
  icon?: string
  color: string
  description?: string
  entity_type: string
  type: string
  order: number
}

export interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  entityType: string
  onSave: () => void
}

export interface CategorySelectorProps {
  entityType: string
  value?: string | number
  onChange: (categoryId: string | number | undefined) => void
  placeholder?: string
}

export interface Tag {
  id: string | number
  name: string
  color: string
  description?: string
}

export interface TagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag | null
  onSave: () => void
}

export interface TagSelectorProps {
  selectedTags: number[]
  onChange: (tags: number[]) => void
  maxTags?: number
}


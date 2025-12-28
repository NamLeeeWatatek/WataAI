import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FiFolder, FiTrash2, FiChevronRight, FiChevronDown } from 'react-icons/fi'
import type { KBFolder } from '@/lib/types/knowledge-base'

interface KBFolderTreeProps {
    folders: KBFolder[]
    onNavigate: (folderId: string, folderName: string) => void
    onDelete: (folderId: string) => void
    level?: number
}

export function KBFolderTree({ folders, onNavigate, onDelete, level = 0 }: KBFolderTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

    const toggleExpand = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(folderId)) {
                next.delete(folderId)
            } else {
                next.add(folderId)
            }
            return next
        })
    }

    return (
        <div className="space-y-2">
            {folders.map((folder) => {
                const hasSubfolders = folder.subFolders && folder.subFolders.length > 0
                const isExpanded = expandedFolders.has(folder.id)

                return (
                    <div key={folder.id}>
                        <Card
                            className="p-4 hover:bg-accent/50 cursor-pointer transition-colors group"
                            style={{ marginLeft: `${level * 24}px` }}
                            onClick={() => onNavigate(folder.id, folder.name)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    {hasSubfolders && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => toggleExpand(folder.id, e)}
                                            className="p-0 h-6 w-6 hover:bg-accent rounded-sm"
                                        >
                                            {isExpanded ? (
                                                <FiChevronDown className="w-4 h-4" />
                                            ) : (
                                                <FiChevronRight className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{folder.name}</h4>
                                        {folder.description && (
                                            <p className="text-sm text-muted-foreground truncate">
                                                {folder.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(folder.id)
                                        }}
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </Button>
                                    <FiChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </Card>

                        { }
                        {hasSubfolders && isExpanded && (
                            <div className="mt-2">
                                <KBFolderTree
                                    folders={folder.subFolders!}
                                    onNavigate={onNavigate}
                                    onDelete={onDelete}
                                    level={level + 1}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}


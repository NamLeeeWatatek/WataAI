import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FiFolder, FiTrash2, FiChevronRight } from 'react-icons/fi'
import type { KBFolder } from '@/lib/types/knowledge-base'

interface KBFolderItemProps {
    folder: KBFolder
    onNavigate: (folderId: string, folderName: string) => void
    onDelete: (folderId: string) => void
}

export function KBFolderItem({ folder, onNavigate, onDelete }: KBFolderItemProps) {
    return (
        <Card
            className="p-4 hover:bg-accent/50 cursor-pointer transition-colors group"
            onClick={() => onNavigate(folder.id, folder.name)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-medium">{folder.name}</h4>
                        {folder.description && (
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
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
    )
}

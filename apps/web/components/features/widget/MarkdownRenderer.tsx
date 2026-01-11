import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-left">
            <ReactMarkdown
                components={{
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 transition-opacity font-medium text-primary" />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul {...props} className="list-disc pl-4 my-2 space-y-1" />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol {...props} className="list-decimal pl-4 my-2 space-y-1" />
                    ),
                    li: ({ node, ...props }) => (
                        <li {...props} className="my-0.5" />
                    ),
                    p: ({ node, ...props }) => (
                        <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                    ),
                    code: ({ node, ...props }) => (
                        <code {...props} className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono" />
                    ),
                    pre: ({ node, ...props }) => (
                        <pre {...props} className="bg-black/10 dark:bg-white/10 rounded-lg p-2 my-2 overflow-x-auto text-xs" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

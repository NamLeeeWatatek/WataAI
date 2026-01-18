import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown'

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
    return (
        <div className="text-left font-normal text-sm leading-relaxed" style={{ color: 'inherit' }}>
            <ReactMarkdown
                components={{
                    a: ({ node, ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline', fontWeight: 500, color: 'inherit', opacity: 0.9 }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.9'}
                        />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul {...props} style={{ listStyleType: 'disc', paddingLeft: '1.5em', margin: '0.5em 0' }} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol {...props} style={{ listStyleType: 'decimal', paddingLeft: '1.5em', margin: '0.5em 0' }} />
                    ),
                    li: ({ node, ...props }) => (
                        <li {...props} style={{ margin: '0.25em 0' }} />
                    ),
                    p: ({ node, ...props }) => (
                        <p {...props} style={{ margin: '0 0 0.75em 0', lineHeight: '1.6' }} />
                    ),
                    code: ({ node, ...props }) => (
                        <code
                            {...props}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9em'
                            }}
                        />
                    ),
                    pre: ({ node, ...props }) => (
                        <pre
                            {...props}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                padding: '12px',
                                borderRadius: '8px',
                                overflowX: 'auto',
                                margin: '0.75em 0',
                                fontSize: '0.9em'
                            }}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

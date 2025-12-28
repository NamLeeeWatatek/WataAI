'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    LinkIcon,
    Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { LinkDialog } from '@/components/ui/LinkDialog';

interface TiptapEditorProps {
    onSend: (content: string) => Promise<void> | void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function TiptapEditor({
    onSend,
    placeholder = 'Type your message here...',
    disabled = false,
    className
}: TiptapEditorProps) {
    // Track content state for send button
    const [hasContent, setHasContent] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                horizontalRule: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg',
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto px-4 py-2',
            },
        },
        content: '',
        editable: !disabled,
        onUpdate: ({ editor }) => {
            // ✅ FIX: Update hasContent state when typing
            setHasContent(editor.getText().trim().length > 0);
        },
    });

    useEffect(() => {
        if (editor && disabled) {
            editor.setEditable(false);
        } else if (editor && !disabled) {
            editor.setEditable(true);
        }
    }, [disabled, editor]);

    const handleSend = async () => {
        if (!editor) return;

        const text = editor.getText();
        if (!text.trim()) return;

        // Send text content
        await onSend(text.trim());

        // Clear editor and state
        editor.commands.clearContent();
        setHasContent(false);
        editor.commands.focus();
    };

    // ✅ FIX: Handle Enter key
    useEffect(() => {
        if (!editor) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
            }
        };

        const editorElement = editor.view.dom;
        editorElement.addEventListener('keydown', handleKeyDown);

        return () => {
            editorElement.removeEventListener('keydown', handleKeyDown);
        };
    }, [editor, handleSend]);

    if (!editor) {
        return null;
    }

    return (
        <>
            <LinkDialog
                open={showLinkDialog}
                onOpenChange={setShowLinkDialog}
                onConfirm={(url) => {
                    if (editor) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
            />
            <div className={cn('border border-border rounded-lg bg-background', className)}>
                {/* Toolbar */}
                <div className="border-b border-border px-2 py-1 flex items-center gap-1 flex-wrap">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8',
                            editor.isActive('bold') && 'bg-muted'
                        )}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={disabled}
                    >
                        <Bold className="w-4 h-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8',
                            editor.isActive('italic') && 'bg-muted'
                        )}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={disabled}
                    >
                        <Italic className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8',
                            editor.isActive('bulletList') && 'bg-muted'
                        )}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        disabled={disabled}
                    >
                        <List className="w-4 h-4" />
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8',
                            editor.isActive('orderedList') && 'bg-muted'
                        )}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        disabled={disabled}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8',
                            editor.isActive('link') && 'bg-muted'
                        )}
                        onClick={() => setShowLinkDialog(true)}
                        disabled={disabled}
                    >
                        <LinkIcon className="w-4 h-4" />
                    </Button>

                    <div className="flex-1" />

                    <p className="text-xs text-muted-foreground mr-2">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send
                    </p>
                </div>

                {/* Editor Content */}
                <div className="relative">
                    <EditorContent editor={editor} />
                </div>

                {/* Send Button */}
                <div className="px-2 py-1.5 flex justify-end">
                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={disabled || !hasContent}
                        size="sm"
                        className="gap-1.5 h-8 text-xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Send
                    </Button>
                </div>
            </div>
        </>
    );
}


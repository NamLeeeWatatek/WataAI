'use client';

import { useForm } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useWidgetVersionActions } from '@/lib/hooks/use-widget-versions';
import { handleFormError } from '@/lib/utils/form-errors';

interface Props {
    botId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface FormData {
    version: string;
    changelog: string;
}

const DEFAULT_CONFIG = {
    theme: {
        primaryColor: '#667eea',
        position: 'bottom-right',
        buttonSize: 'medium',
        showAvatar: true,
        showTimestamp: true,
    },
    behavior: {
        autoOpen: false,
        autoOpenDelay: 0,
        greetingDelay: 2,
    },
    messages: {
        welcome: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        placeholder: 'Nhập tin nhắn...',
        offline: 'Chúng tôi hiện đang offline',
        errorMessage: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    },
    features: {
        fileUpload: false,
        voiceInput: false,
        markdown: true,
        quickReplies: true,
    },
    branding: {
        showPoweredBy: true,
    },
    security: {
        allowedOrigins: ['*'],
    },
};

export function CreateVersionDialog({ botId, open, onOpenChange, onSuccess }: Props) {
    const form = useForm<FormData>();
    const { register, handleSubmit, formState, reset } = form;
    const { errors } = formState;
    const { createVersion, isSubmitting } = useWidgetVersionActions(botId);

    const onSubmit = async (data: FormData) => {
        try {
            await createVersion({
                version: data.version,
                config: DEFAULT_CONFIG,
                changelog: data.changelog,
            });
            reset();
            onSuccess();
        } catch (error: any) {
            handleFormError(error, form)
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New Widget Version</DialogTitle>
                        <DialogDescription>
                            Create a new draft version. You can configure it later before publishing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {errors.root && (
                            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                                <span className="font-medium">Error:</span>
                                {errors.root.message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="version">
                                Version <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="version"
                                placeholder="1.0.1"
                                {...register('version', {
                                    required: 'Version is required',
                                    pattern: {
                                        value: /^\d+\.\d+\.\d+$/,
                                        message: 'Version must be in format X.Y.Z (e.g., 1.0.1)',
                                    },
                                })}
                            />
                            {errors.version && (
                                <p className="text-sm text-destructive">{errors.version.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Use semantic versioning (e.g., 1.0.0, 1.0.1, 1.1.0)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="changelog">Changelog</Label>
                            <Textarea
                                id="changelog"
                                placeholder="What's new in this version?"
                                rows={3}
                                {...register('changelog')}
                            />
                            <p className="text-xs text-muted-foreground">
                                Describe what changed in this version
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Version'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


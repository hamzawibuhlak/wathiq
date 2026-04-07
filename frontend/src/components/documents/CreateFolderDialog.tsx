import { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCreateFolder, useUpdateFolder } from '@/hooks/use-document-folders';
import type { DocumentFolder } from '@/api/documentFolders.api';

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string | null;
    editFolder?: DocumentFolder | null;
}

const FOLDER_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6b7280', // Gray
    '#78716c', // Stone
];

export function CreateFolderDialog({
    isOpen,
    onClose,
    parentId,
    editFolder,
}: CreateFolderDialogProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');

    const createMutation = useCreateFolder();
    const updateMutation = useUpdateFolder();

    const isEditing = !!editFolder;

    useEffect(() => {
        if (editFolder) {
            setName(editFolder.name);
            setColor(editFolder.color || '#6366f1');
        } else {
            setName('');
            setColor('#6366f1');
        }
    }, [editFolder, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        if (isEditing && editFolder) {
            await updateMutation.mutateAsync({
                id: editFolder.id,
                data: { name: name.trim(), color },
            });
        } else {
            await createMutation.mutateAsync({
                name: name.trim(),
                color,
                parentId: parentId || undefined,
            });
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Folder className="w-5 h-5" style={{ color }} />
                        {isEditing ? 'تعديل المجلد' : 'إنشاء مجلد جديد'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">اسم المجلد</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="أدخل اسم المجلد..."
                            className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-right"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium mb-2">لون المجلد</label>
                        <div className="flex flex-wrap gap-2">
                            {FOLDER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-all ${
                                        color === c
                                            ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                            : 'hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                        >
                            <Folder className="w-6 h-6" style={{ color }} />
                        </div>
                        <div>
                            <p className="font-medium">{name || 'اسم المجلد'}</p>
                            <p className="text-xs text-muted-foreground">معاينة</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? 'جارٍ الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إنشاء المجلد'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            إلغاء
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateFolderDialog;

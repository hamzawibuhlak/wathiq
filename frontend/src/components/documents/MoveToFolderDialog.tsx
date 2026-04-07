import { useState } from 'react';
import { X, Folder, ChevronLeft, FolderInput, Copy } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDocumentFolders, useLinkDocumentToFolder, useMoveDocumentToFolder } from '@/hooks/use-document-folders';
import type { DocumentFolder } from '@/api/documentFolders.api';

interface MoveToFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    documentTitle: string;
    mode: 'move' | 'copy'; // move = نقل (يختفي من الأصل), copy = نسخ (يبقى في الأصل)
}

export function MoveToFolderDialog({
    isOpen,
    onClose,
    documentId,
    documentTitle,
    mode,
}: MoveToFolderDialogProps) {
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([]);

    const { data: foldersData, isLoading } = useDocumentFolders(currentParentId);
    const linkMutation = useLinkDocumentToFolder();
    const moveMutation = useMoveDocumentToFolder();

    const folders = foldersData?.data || [];
    const isMove = mode === 'move';
    const activeMutation = isMove ? moveMutation : linkMutation;

    const handleOpenFolder = (folder: DocumentFolder) => {
        setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
        setCurrentParentId(folder.id);
    };

    const handleGoBack = () => {
        if (breadcrumb.length > 0) {
            const newBreadcrumb = [...breadcrumb];
            newBreadcrumb.pop();
            setBreadcrumb(newBreadcrumb);
            setCurrentParentId(newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : null);
        }
    };

    const handleGoToRoot = () => {
        setBreadcrumb([]);
        setCurrentParentId(null);
    };

    const handleGoToBreadcrumb = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);
        setCurrentParentId(newBreadcrumb[newBreadcrumb.length - 1].id);
    };

    const handleSelectFolder = async (folderId: string) => {
        await activeMutation.mutateAsync({ folderId, documentId });
        onClose();
    };

    const handleSelectCurrent = async () => {
        if (!currentParentId) return;
        await activeMutation.mutateAsync({ folderId: currentParentId, documentId });
        onClose();
    };

    if (!isOpen) return null;

    const title = isMove ? 'نقل مستند إلى مجلد' : 'نسخ مستند إلى مجلد';
    const actionLabel = isMove ? 'نقل هنا' : 'نسخ هنا';
    const pendingLabel = isMove ? 'جارٍ النقل...' : 'جارٍ النسخ...';
    const selectLabel = isMove ? 'نقل' : 'نسخ';
    const IconComponent = isMove ? FolderInput : Copy;
    const iconColor = isMove ? 'text-primary' : 'text-blue-600';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <IconComponent className={`w-5 h-5 ${iconColor}`} />
                            {title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 truncate max-w-[280px]">
                            {documentTitle}
                        </p>
                        {isMove && (
                            <p className="text-xs text-amber-600 mt-1">
                                ⚠ سيختفي المستند من الصفحة الرئيسية
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Breadcrumb */}
                <div className="px-6 py-3 border-b flex items-center gap-1 text-sm flex-shrink-0 overflow-x-auto">
                    <button
                        onClick={handleGoToRoot}
                        className="text-primary hover:underline whitespace-nowrap"
                    >
                        المجلدات
                    </button>
                    {breadcrumb.map((item, index) => (
                        <span key={item.id} className="flex items-center gap-1">
                            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                            <button
                                onClick={() => handleGoToBreadcrumb(index)}
                                className="text-primary hover:underline whitespace-nowrap"
                            >
                                {item.name}
                            </button>
                        </span>
                    ))}
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
                    {/* Back button */}
                    {breadcrumb.length > 0 && (
                        <button
                            onClick={handleGoBack}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">الرجوع</span>
                        </button>
                    )}

                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                    <div className="w-10 h-10 bg-muted rounded-lg" />
                                    <div className="w-24 h-4 bg-muted rounded" />
                                </div>
                            ))}
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Folder className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">لا توجد مجلدات هنا</p>
                        </div>
                    ) : (
                        folders.map((folder) => (
                            <div
                                key={folder.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                                <button
                                    onClick={() => handleOpenFolder(folder)}
                                    className="flex items-center gap-3 flex-1 min-w-0"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}
                                    >
                                        <Folder className="w-5 h-5" style={{ color: folder.color || '#6366f1' }} />
                                    </div>
                                    <div className="text-right min-w-0">
                                        <p className="font-medium text-sm truncate">{folder.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(folder._count?.children || 0) + (folder._count?.documentLinks || 0)} عنصر
                                        </p>
                                    </div>
                                </button>
                                <Button
                                    size="sm"
                                    variant={isMove ? "default" : "outline"}
                                    onClick={() => handleSelectFolder(folder.id)}
                                    disabled={activeMutation.isPending}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                                >
                                    {selectLabel}
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex items-center gap-3 flex-shrink-0">
                    {currentParentId && (
                        <Button
                            onClick={handleSelectCurrent}
                            disabled={activeMutation.isPending}
                            className="flex-1"
                            variant={isMove ? "default" : "outline"}
                        >
                            <IconComponent className="w-4 h-4 ml-2" />
                            {activeMutation.isPending ? pendingLabel : actionLabel}
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose} className={currentParentId ? '' : 'flex-1'}>
                        إلغاء
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default MoveToFolderDialog;

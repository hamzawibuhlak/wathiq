import { Folder, MoreVertical, Trash2, Edit3, FolderOpen, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentFolder } from '@/api/documentFolders.api';

interface FolderCardProps {
    folder: DocumentFolder;
    onOpen: (folder: DocumentFolder) => void;
    onEdit?: (folder: DocumentFolder) => void;
    onDelete?: (folder: DocumentFolder) => void;
    onDropDocument?: (folderId: string, documentId: string) => void;
    view?: 'grid' | 'list';
}

export function FolderCard({
    folder,
    onOpen,
    onEdit,
    onDelete,
    onDropDocument,
    view = 'grid',
}: FolderCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const itemCount = (folder._count?.children || 0) + (folder._count?.documentLinks || 0);
    const isClientFolder = !!folder.clientId;

    const handleClick = () => {
        onOpen(folder);
    };

    // Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/document-id')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Prevent flickering when hovering over children
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const documentId = e.dataTransfer.getData('application/document-id');
        if (documentId && onDropDocument) {
            onDropDocument(folder.id, documentId);
        }
    };

    if (view === 'list') {
        return (
            <div
                className={cn(
                    "flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer group",
                    isDragOver && "ring-2 ring-primary bg-primary/5 border-primary scale-[1.02]"
                )}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                            isDragOver && "animate-pulse"
                        )}
                        style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}
                    >
                        {isClientFolder ? (
                            <User className="w-5 h-5" style={{ color: folder.color || '#6366f1' }} />
                        ) : isDragOver ? (
                            <FolderOpen className="w-5 h-5" style={{ color: folder.color || '#6366f1' }} />
                        ) : (
                            <Folder className="w-5 h-5" style={{ color: folder.color || '#6366f1' }} />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{folder.name}</h3>
                        <span className="text-sm text-muted-foreground">
                            {isDragOver ? 'أفلت هنا للإضافة' : `${itemCount} عنصر`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {showMenu && (
                            <div className="absolute left-0 top-full mt-1 w-36 bg-card rounded-lg shadow-lg border py-1 z-10">
                                <button
                                    onClick={() => { onOpen(folder); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    فتح
                                </button>
                                {onEdit && (
                                    <button
                                        onClick={() => { onEdit(folder); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        تعديل
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => { onDelete(folder); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        حذف
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div
            className={cn(
                "bg-card rounded-xl border p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative group",
                isDragOver && "ring-2 ring-primary bg-primary/5 border-primary shadow-lg scale-105"
            )}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Menu */}
            <div
                className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-card rounded-lg shadow-lg border py-1 z-10">
                            <button
                                onClick={() => { onOpen(folder); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <FolderOpen className="w-4 h-4" />
                                فتح
                            </button>
                            {onEdit && (
                                <button
                                    onClick={() => { onEdit(folder); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    تعديل
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => { onDelete(folder); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Folder Icon */}
            <div className="flex flex-col items-center text-center gap-3 py-2">
                <div
                    className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                        isDragOver && "animate-bounce"
                    )}
                    style={{ backgroundColor: `${folder.color || '#6366f1'}15` }}
                >
                    {isClientFolder ? (
                        <User className="w-8 h-8" style={{ color: folder.color || '#6366f1' }} />
                    ) : isDragOver ? (
                        <FolderOpen className="w-8 h-8" style={{ color: folder.color || '#6366f1' }} />
                    ) : (
                        <Folder className="w-8 h-8" style={{ color: folder.color || '#6366f1' }} />
                    )}
                </div>

                <div className="min-w-0 w-full">
                    <h3 className="font-medium truncate text-sm" title={folder.name}>
                        {folder.name}
                    </h3>
                    <p className={cn(
                        "text-xs mt-0.5",
                        isDragOver ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                        {isDragOver ? '✦ أفلت هنا' : `${itemCount} عنصر`}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default FolderCard;

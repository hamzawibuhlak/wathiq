import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ChevronLeft, Trash2, Folder, FolderPlus, Scale, BookMarked, Hash, Plus } from 'lucide-react';
import { useBookmarks, useRemoveBookmark, useFolders, useCreateFolder } from '@/hooks/useLegalLibrary';

export function BookmarksPage() {
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const { data: bookmarks, isLoading } = useBookmarks(selectedFolder);
    const { data: folders } = useFolders();
    const removeBookmark = useRemoveBookmark();
    const createFolder = useCreateFolder();

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolder.mutate({ name: newFolderName });
        setNewFolderName('');
        setShowNewFolder(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'REGULATION': return <Scale className="w-4 h-4 text-indigo-500" />;
            case 'PRECEDENT': return <BookMarked className="w-4 h-4 text-purple-500" />;
            case 'TERM': return <Hash className="w-4 h-4 text-emerald-500" />;
            default: return <Bookmark className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'REGULATION': return 'نظام';
            case 'ARTICLE': return 'مادة';
            case 'PRECEDENT': return 'حكم';
            case 'TERM': return 'مصطلح';
            default: return type;
        }
    };

    const getTargetLink = (bm: any) => {
        if (bm.regulation) return `/legal-library/regulations/${bm.regulation.id}`;
        if (bm.precedent) return `/legal-library/precedents/${bm.precedent.id}`;
        return '/legal-library/glossary';
    };

    const getTargetTitle = (bm: any) => {
        if (bm.regulation) return bm.regulation.title;
        if (bm.article) return `مادة ${bm.article.number} — ${bm.article.regulation?.title || ''}`;
        if (bm.precedent) return `${bm.precedent.court} — ${bm.precedent.caseType}`;
        return 'مفضلة';
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">المفضلة</h1>
                    <p className="text-sm text-gray-500 mt-1">الأنظمة والأحكام المحفوظة</p>
                </div>
                <Link to="/legal-library" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    العودة للمكتبة <ChevronLeft className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Folders Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">المجلدات</h3>
                            <button onClick={() => setShowNewFolder(true)} className="text-indigo-600 hover:text-indigo-700">
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedFolder(undefined)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 ${!selectedFolder ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Bookmark className="w-4 h-4" />
                            <span>الكل</span>
                        </button>

                        {folders?.map((folder: any) => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm mb-1 ${selectedFolder === folder.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4" style={{ color: folder.color || '#6b7280' }} />
                                    <span>{folder.name}</span>
                                </div>
                                <span className="text-xs text-gray-400">{folder._count?.bookmarks || 0}</span>
                            </button>
                        ))}

                        {showNewFolder && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="اسم المجلد"
                                    className="flex-1 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-transparent text-gray-900 dark:text-white"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <button onClick={handleCreateFolder} className="text-xs bg-indigo-600 text-white px-2 rounded-lg">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bookmarks List */}
                <div className="lg:col-span-3 space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse">
                                    <div className="w-2/3 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                    <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {bookmarks?.map((bm: any) => (
                                <div key={bm.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-indigo-300 transition-all">
                                    <Link to={getTargetLink(bm)} className="flex items-center gap-3 flex-1 min-w-0">
                                        {getTypeIcon(bm.type)}
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{getTargetTitle(bm)}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{getTypeLabel(bm.type)}</span>
                                                {bm.folder && (
                                                    <span className="flex items-center gap-1">
                                                        <Folder className="w-3 h-3" style={{ color: bm.folder.color }} />
                                                        {bm.folder.name}
                                                    </span>
                                                )}
                                                <span>{new Date(bm.createdAt).toLocaleDateString('ar-SA')}</span>
                                            </div>
                                            {bm.notes && <p className="text-xs text-gray-500 mt-1 truncate">{bm.notes}</p>}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => removeBookmark.mutate(bm.id)}
                                        className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!bookmarks || bookmarks.length === 0) && (
                                <div className="text-center py-16">
                                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">لا توجد مفضلات محفوظة</p>
                                    <Link to="/legal-library" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
                                        تصفح المكتبة
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookmarksPage;

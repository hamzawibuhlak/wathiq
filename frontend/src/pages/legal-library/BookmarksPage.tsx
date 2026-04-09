import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    Bookmark, ChevronLeft, Trash2, Folder, FolderPlus, Scale, BookMarked, Hash, Plus,
    Copy, Check, Edit2, X, Globe, Lock, MessageSquare, Tag, Briefcase, ChevronDown, ChevronUp,
    FolderOpen, Send, FileText,
} from 'lucide-react';
import {
    useBookmarks, useRemoveBookmark, useFolders, useCreateFolder, useUpdateFolder,
    useDeleteFolder, useUpdateBookmark, useFolderComments, useAddFolderComment, useDeleteFolderComment,
} from '@/hooks/useLegalLibrary';

// ── Folder Comments Modal ──────────────────────────────────────────────────────
function FolderCommentsModal({ folder, onClose }: { folder: any; onClose: () => void }) {
    const [text, setText] = useState('');
    const { data: comments } = useFolderComments(folder.id);
    const addComment = useAddFolderComment();
    const deleteComment = useDeleteFolderComment();

    const submit = () => {
        if (!text.trim()) return;
        addComment.mutate({ folderId: folder.id, content: text.trim() });
        setText('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{folder.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">تعليقات المجلد العام</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 max-h-72 overflow-y-auto space-y-3">
                    {(!comments || comments.length === 0) && (
                        <p className="text-center text-sm text-gray-400 py-6">لا توجد تعليقات بعد</p>
                    )}
                    {comments?.map((c: any) => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                                {c.author?.name?.[0] || '?'}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.author?.name || 'مستخدم'}</span>
                                    <button onClick={() => deleteComment.mutate(c.id)} className="text-gray-300 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{c.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-4 pb-4 flex gap-2">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                        placeholder="أضف تعليقاً..."
                        className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <button onClick={submit} disabled={!text.trim() || addComment.isPending}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Folder Item ────────────────────────────────────────────────────────────────
function FolderItem({
    folder, isSelected, onSelect, canManage,
}: {
    folder: any; isSelected: boolean; onSelect: () => void; canManage: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);
    const [showComments, setShowComments] = useState(false);
    const updateFolder = useUpdateFolder();
    const deleteFolder = useDeleteFolder();

    const save = () => {
        if (!editName.trim() || editName === folder.name) { setEditing(false); return; }
        updateFolder.mutate({ id: folder.id, data: { name: editName } });
        setEditing(false);
    };

    const togglePublic = () => {
        updateFolder.mutate({ id: folder.id, data: { isPublic: !folder.isPublic } });
    };

    return (
        <>
            {showComments && <FolderCommentsModal folder={folder} onClose={() => setShowComments(false)} />}
            <div className={`group flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-sm mb-1 cursor-pointer ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {editing ? (
                    <div className="flex items-center gap-1 flex-1">
                        <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                            className="flex-1 text-sm px-2 py-0.5 border border-indigo-300 rounded outline-none bg-transparent text-gray-900 dark:text-white"
                            autoFocus
                        />
                        <button onClick={save} className="text-green-500 hover:text-green-600"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ) : (
                    <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-right">
                        <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folder.color || '#6b7280' }} />
                        <span className="truncate">{folder.name}</span>
                        {folder.isPublic && <Globe className="w-3 h-3 text-green-500 flex-shrink-0" />}
                    </button>
                )}

                <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400">{folder._count?.bookmarks || 0}</span>
                    {folder.isPublic && (
                        <button onClick={() => setShowComments(true)} title="التعليقات"
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-500 ml-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {canManage && (
                        <>
                            <button onClick={togglePublic} title={folder.isPublic ? 'جعله خاصاً' : 'جعله عاماً'}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-green-500">
                                {folder.isPublic ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            </button>
                            <button onClick={() => setEditing(true)} title="تعديل"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-500">
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteFolder.mutate(folder.id)} title="حذف"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Bookmark Card ──────────────────────────────────────────────────────────────
function BookmarkCard({ bm, folders, onDelete }: { bm: any; folders: any[]; onDelete: () => void }) {
    const [copied, setCopied] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const updateBookmark = useUpdateBookmark();

    const copyToClipboard = () => {
        const text = bm.highlightedText || getTargetTitle(bm);
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const moveToFolder = (folderId: string | null) => {
        updateBookmark.mutate({ id: bm.id, data: { folderId } });
        setShowMove(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'REGULATION': return <Scale className="w-4 h-4 text-indigo-500" />;
            case 'ARTICLE': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'PRECEDENT': return <BookMarked className="w-4 h-4 text-purple-500" />;
            case 'TERM': return <Hash className="w-4 h-4 text-emerald-500" />;
            case 'TEXT': return <Bookmark className="w-4 h-4 text-amber-500" />;
            default: return <Bookmark className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'REGULATION': return 'نظام';
            case 'ARTICLE': return 'مادة';
            case 'PRECEDENT': return 'حكم';
            case 'TERM': return 'مصطلح';
            case 'TEXT': return 'نص محفوظ';
            default: return type;
        }
    };

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'REGULATION': return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
            case 'ARTICLE': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            case 'PRECEDENT': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            case 'TERM': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
            case 'TEXT': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        }
    };

    const getTargetTitle = (bm: any) => {
        if (bm.regulation) return bm.regulation.title;
        if (bm.article) return `مادة ${bm.article.number} — ${bm.article.regulation?.title || ''}`;
        if (bm.precedent) return `${bm.precedent.court} — ${bm.precedent.caseType}`;
        if (bm.type === 'TEXT') return 'نص محفوظ';
        return 'مفضلة';
    };

    const getTargetLink = (bm: any) => {
        if (bm.regulation) return `/legal-library/regulations/${bm.regulation.id}`;
        if (bm.precedent) return `/legal-library/precedents/${bm.precedent.id}`;
        return '/legal-library';
    };

    const isTextOnly = bm.type === 'TEXT' && !bm.regulation && !bm.article && !bm.precedent;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">{getTypeIcon(bm.type)}</div>
                    <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBg(bm.type)}`}>{getTypeLabel(bm.type)}</span>
                            {!isTextOnly ? (
                                <Link to={getTargetLink(bm)} className="font-medium text-gray-900 dark:text-white text-sm hover:text-indigo-600 truncate">
                                    {getTargetTitle(bm)}
                                </Link>
                            ) : (
                                <span className="font-medium text-gray-900 dark:text-white text-sm">نص محفوظ من البحث الذكي</span>
                            )}
                        </div>

                        {/* Highlighted text snippet */}
                        {bm.highlightedText && (
                            <div
                                className={`mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer ${!expanded && bm.highlightedText.length > 200 ? 'relative' : ''}`}
                                onClick={() => bm.highlightedText.length > 200 && setExpanded(!expanded)}
                            >
                                <p className={`text-sm text-amber-900 dark:text-amber-200 leading-relaxed ${!expanded && bm.highlightedText.length > 200 ? 'line-clamp-3' : ''}`}>
                                    {bm.highlightedText}
                                </p>
                                {bm.highlightedText.length > 200 && (
                                    <button className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-1 hover:underline">
                                        {expanded ? <><ChevronUp className="w-3 h-3" />عرض أقل</> : <><ChevronDown className="w-3 h-3" />عرض المزيد</>}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        {bm.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{bm.notes}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {bm.folder && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Folder className="w-3 h-3" style={{ color: bm.folder.color || '#6b7280' }} />
                                    {bm.folder.name}
                                    {bm.folder.isPublic && <Globe className="w-3 h-3 text-green-500" />}
                                </span>
                            )}
                            {bm.case && (
                                <span className="flex items-center gap-1 text-xs text-blue-500">
                                    <Briefcase className="w-3 h-3" />
                                    {bm.case.caseNumber || bm.case.title || 'قضية'}
                                </span>
                            )}
                            {bm.tags?.length > 0 && (
                                <span className="flex items-center gap-1 flex-wrap">
                                    {bm.tags.map((tag: string) => (
                                        <span key={tag} className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                            <Tag className="w-2.5 h-2.5" />{tag}
                                        </span>
                                    ))}
                                </span>
                            )}
                            <span className="text-xs text-gray-400">{new Date(bm.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Copy */}
                    <button onClick={copyToClipboard} title="نسخ للحافظة (للصق في محرر الوثائق)"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {/* Move to folder */}
                    <div className="relative">
                        <button onClick={() => setShowMove(!showMove)} title="نقل إلى مجلد"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                            <FolderOpen className="w-4 h-4" />
                        </button>
                        {showMove && (
                            <div className="absolute left-0 top-8 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 min-w-40 text-sm">
                                <button onClick={() => moveToFolder(null)}
                                    className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <Bookmark className="w-3.5 h-3.5" />بدون مجلد
                                </button>
                                {folders?.map((f: any) => (
                                    <button key={f.id} onClick={() => moveToFolder(f.id)}
                                        className="w-full text-right px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                        <Folder className="w-3.5 h-3.5" style={{ color: f.color || '#6b7280' }} />
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Delete */}
                    <button onClick={onDelete} title="حذف"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function BookmarksPage() {
    const { p } = useSlugPath();
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [filterTag, setFilterTag] = useState<string | undefined>(undefined);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderPublic, setNewFolderPublic] = useState(false);
    const [activeSection, setActiveSection] = useState<'mine' | 'public'>('mine');

    const { data: bookmarks, isLoading } = useBookmarks({ folderId: selectedFolder, tag: filterTag });
    const { data: folders } = useFolders();
    const removeBookmark = useRemoveBookmark();
    const createFolder = useCreateFolder();

    const myFolders = folders?.filter((f: any) => !f.isPublic) || [];
    const publicFolders = folders?.filter((f: any) => f.isPublic) || [];

    // Collect all unique tags from bookmarks
    const allTags = Array.from(new Set((bookmarks || []).flatMap((bm: any) => bm.tags || [])));

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolder.mutate({ name: newFolderName, isPublic: newFolderPublic });
        setNewFolderName('');
        setNewFolderPublic(false);
        setShowNewFolder(false);
    };

    return (
        <div className="p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">المفضلة</h1>
                    <p className="text-sm text-gray-500 mt-1">النصوص والأنظمة والأحكام المحفوظة</p>
                </div>
                <Link to={p('/legal-library')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    العودة للمكتبة <ChevronLeft className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Section tabs */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setActiveSection('mine')}
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeSection === 'mine' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <Lock className="w-3.5 h-3.5 inline ml-1" />مجلداتي
                        </button>
                        <button onClick={() => setActiveSection('public')}
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeSection === 'public' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            <Globe className="w-3.5 h-3.5 inline ml-1" />عامة
                        </button>
                    </div>

                    {/* Folder list */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {activeSection === 'public' ? 'المجلدات العامة' : 'مجلداتي'}
                            </h3>
                            <button onClick={() => setShowNewFolder(!showNewFolder)} className="text-indigo-600 hover:text-indigo-700">
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* All bookmarks */}
                        <button
                            onClick={() => setSelectedFolder(undefined)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 ${!selectedFolder ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Bookmark className="w-4 h-4" />
                            <span>الكل</span>
                        </button>

                        {(activeSection === 'mine' ? myFolders : publicFolders).map((folder: any) => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                isSelected={selectedFolder === folder.id}
                                onSelect={() => setSelectedFolder(folder.id)}
                                canManage={activeSection === 'mine'}
                            />
                        ))}

                        {(activeSection === 'mine' ? myFolders : publicFolders).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">
                                {activeSection === 'public' ? 'لا توجد مجلدات عامة' : 'لا توجد مجلدات'}
                            </p>
                        )}

                        {/* New folder form */}
                        {showNewFolder && (
                            <div className="mt-2 space-y-2">
                                <input
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="اسم المجلد"
                                    className="w-full text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                                />
                                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                    <input type="checkbox" checked={newFolderPublic} onChange={e => setNewFolderPublic(e.target.checked)}
                                        className="rounded" />
                                    مجلد عام (يراه جميع المستخدمين)
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateFolder} className="flex-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
                                        إنشاء
                                    </button>
                                    <button onClick={() => setShowNewFolder(false)} className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags filter */}
                    {allTags.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> الوسوم
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {allTags.map((tag: any) => (
                                    <button key={tag} onClick={() => setFilterTag(filterTag === tag ? undefined : tag)}
                                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${filterTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hint */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            <Copy className="w-3 h-3 inline ml-1" />
                            انقر زر النسخ في أي مفضلة لنسخ النص ثم الصقه مباشرة في محرر الوثائق
                        </p>
                    </div>
                </div>

                {/* Bookmarks list */}
                <div className="lg:col-span-3">
                    {filterTag && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Tag className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">تصفية بالوسم: <strong>{filterTag}</strong></span>
                            <button onClick={() => setFilterTag(undefined)} className="mr-auto text-indigo-400 hover:text-indigo-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse">
                                    <div className="w-2/3 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                    <div className="w-full h-16 bg-gray-100 dark:bg-gray-700 rounded mb-2" />
                                    <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bookmarks?.map((bm: any) => (
                                <BookmarkCard
                                    key={bm.id}
                                    bm={bm}
                                    folders={folders || []}
                                    onDelete={() => removeBookmark.mutate(bm.id)}
                                />
                            ))}
                            {(!bookmarks || bookmarks.length === 0) && (
                                <div className="text-center py-16">
                                    <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">لا توجد مفضلات محفوظة</p>
                                    <p className="text-xs text-gray-400 mt-1">يمكنك حفظ النصوص من صفحة البحث الذكي</p>
                                    <Link to={p('/legal-library/ai-search')} className="text-sm text-indigo-600 hover:underline mt-3 inline-block">
                                        الذهاب للبحث الذكي
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BookmarksPage;

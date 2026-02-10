import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, ArrowRight, History,
    Bold, Italic, Underline as UnderlineIcon, AlignRight, AlignLeft, AlignCenter, AlignJustify,
    List, ListOrdered, Heading1, Heading2, Heading3,
    Undo, Redo, Printer,
    Type, Minus, Plus, Table as TableIcon, ChevronDown
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'مسودة', color: '#64748b', bg: '#f1f5f9' },
    REVIEW: { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fef3c7' },
    FINAL: { label: 'نهائي', color: '#10b981', bg: '#d1fae5' },
    SENT: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe' },
    ARCHIVED: { label: 'مؤرشف', color: '#94a3b8', bg: '#f1f5f9' },
};

export default function LegalDocumentEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [hasUnsaved, setHasUnsaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [fontSize, setFontSize] = useState(14);

    const editorRef = useRef<HTMLDivElement>(null);
    const autoSaveRef = useRef<ReturnType<typeof setInterval>>();

    // Load document
    const { data: document, isLoading } = useQuery({
        queryKey: ['legal-document', id],
        queryFn: () => legalDocumentsApi.getById(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (document) {
            setContent(document.content);
            setTitle(document.title);
            setStatus(document.status);
            const settings = document.settings as any;
            if (settings?.fontSize) setFontSize(settings.fontSize);
        }
    }, [document]);

    // Set editor content
    useEffect(() => {
        if (editorRef.current && content && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: any) => legalDocumentsApi.update(id!, data),
        onSuccess: () => {
            setHasUnsaved(false);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
        },
    });

    // Manual save
    const handleSave = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        try {
            const currentContent = editorRef.current.innerHTML;
            await saveMutation.mutateAsync({ content: currentContent, title });
            toast.success('تم الحفظ');
        } catch {
            toast.error('فشل الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save every 30 seconds
    useEffect(() => {
        autoSaveRef.current = setInterval(async () => {
            if (hasUnsaved && editorRef.current) {
                const currentContent = editorRef.current.innerHTML;
                try {
                    await saveMutation.mutateAsync({ content: currentContent, title });
                } catch { }
            }
        }, 30000);
        return () => clearInterval(autoSaveRef.current);
    }, [hasUnsaved, title]);

    // Keyboard shortcut: Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        document?.addEventListener?.('keydown', handler);
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [title]);

    // Handle content change
    const handleInput = useCallback(() => {
        setHasUnsaved(true);
    }, []);

    // Exec command helper
    const execCommand = (command: string, value?: string) => {
        window.document.execCommand(command, false, value);
        editorRef.current?.focus();
        setHasUnsaved(true);
    };

    // Status change
    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        setShowStatusMenu(false);
        try {
            await saveMutation.mutateAsync({ status: newStatus });
            toast.success(`تم تغيير الحالة إلى ${STATUS_MAP[newStatus]?.label}`);
        } catch { }
    };

    // Print
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !editorRef.current) return;
        printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Cairo', Arial, sans-serif; font-size: ${fontSize}px; line-height: 1.8; color: #1a1a1a; direction: rtl; padding: 25mm 30mm; margin: 0; }
          h1 { font-size: 20px; font-weight: 700; text-align: center; }
          h2 { font-size: 18px; font-weight: 700; }
          h3 { font-size: 16px; font-weight: 600; color: #1a3a5c; }
          p { margin: 8px 0; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          td, th { border: 1px solid #ccc; padding: 8px 12px; text-align: right; }
          th { background: #f5f5f5; font-weight: 700; }
          @page { size: A4; margin: 25mm; }
        </style>
      </head>
      <body>${editorRef.current.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    // Restore version
    const restoreVersion = async (versionId: string) => {
        try {
            await legalDocumentsApi.restoreVersion(id!, versionId);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
            setShowHistory(false);
            toast.success('تم استعادة الإصدار');
        } catch {
            toast.error('فشل استعادة الإصدار');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">جاري تحميل الوثيقة...</span>
                </div>
            </div>
        );
    }

    const statusInfo = STATUS_MAP[status] || STATUS_MAP.DRAFT;

    return (
        <div className="flex flex-col h-screen bg-gray-100" dir="rtl">
            {/* ═══ TOP BAR ═══ */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <button onClick={() => navigate('/legal-documents')} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </button>

                <input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setHasUnsaved(true); }}
                    className="flex-1 text-gray-900 font-semibold text-base bg-transparent border-none outline-none placeholder:text-gray-400"
                    placeholder="عنوان الوثيقة"
                />

                {hasUnsaved && <span className="text-xs text-amber-500 font-medium">● لم يُحفظ</span>}

                {/* Status dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                    >
                        {statusInfo.label}
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border shadow-lg py-1 z-50 min-w-[140px]">
                            {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStatusChange(key)}
                                    className="w-full px-4 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* History */}
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="سجل الإصدارات"
                >
                    <History className="w-4 h-4" />
                </button>

                {/* Print */}
                <button onClick={handlePrint} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="طباعة">
                    <Printer className="w-4 h-4" />
                </button>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsaved}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>

            {/* ═══ TOOLBAR ═══ */}
            <div className="bg-white border-b border-gray-100 px-4 py-1.5 flex items-center gap-1 flex-shrink-0 flex-wrap">
                {/* Undo / Redo */}
                <button onClick={() => execCommand('undo')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="تراجع"><Undo className="w-4 h-4" /></button>
                <button onClick={() => execCommand('redo')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="إعادة"><Redo className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Font size */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-1.5 py-0.5">
                    <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="p-1 rounded hover:bg-gray-200"><Minus className="w-3 h-3 text-gray-500" /></button>
                    <span className="text-xs text-gray-600 w-6 text-center">{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-1 rounded hover:bg-gray-200"><Plus className="w-3 h-3 text-gray-500" /></button>
                </div>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Headings */}
                <button onClick={() => execCommand('formatBlock', 'h1')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="عنوان 1"><Heading1 className="w-4 h-4" /></button>
                <button onClick={() => execCommand('formatBlock', 'h2')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="عنوان 2"><Heading2 className="w-4 h-4" /></button>
                <button onClick={() => execCommand('formatBlock', 'h3')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="عنوان 3"><Heading3 className="w-4 h-4" /></button>
                <button onClick={() => execCommand('formatBlock', 'p')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="فقرة"><Type className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Bold / Italic / Underline */}
                <button onClick={() => execCommand('bold')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="غامق"><Bold className="w-4 h-4" /></button>
                <button onClick={() => execCommand('italic')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="مائل"><Italic className="w-4 h-4" /></button>
                <button onClick={() => execCommand('underline')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="تسطير"><UnderlineIcon className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Alignment */}
                <button onClick={() => execCommand('justifyRight')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="محاذاة يمين"><AlignRight className="w-4 h-4" /></button>
                <button onClick={() => execCommand('justifyCenter')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="توسيط"><AlignCenter className="w-4 h-4" /></button>
                <button onClick={() => execCommand('justifyLeft')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="محاذاة يسار"><AlignLeft className="w-4 h-4" /></button>
                <button onClick={() => execCommand('justifyFull')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="ضبط"><AlignJustify className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Lists */}
                <button onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="قائمة نقطية"><List className="w-4 h-4" /></button>
                <button onClick={() => execCommand('insertOrderedList')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="قائمة مرقمة"><ListOrdered className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-gray-200 mx-1" />

                {/* Table */}
                <button
                    onClick={() => {
                        const table = '<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 1</th><th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 2</th><th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 3</th></tr><tr><td style="border:1px solid #ccc;padding:8px 12px;text-align:right">&nbsp;</td><td style="border:1px solid #ccc;padding:8px 12px;text-align:right">&nbsp;</td><td style="border:1px solid #ccc;padding:8px 12px;text-align:right">&nbsp;</td></tr></table>';
                        execCommand('insertHTML', table);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="إدراج جدول"
                >
                    <TableIcon className="w-4 h-4" />
                </button>

                {/* Horizontal rule */}
                <button onClick={() => execCommand('insertHorizontalRule')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="خط فاصل">
                    <Minus className="w-4 h-4" />
                </button>
            </div>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor */}
                <div className="flex-1 overflow-auto bg-gray-100 py-8 px-4">
                    <div
                        className="mx-auto bg-white shadow-lg rounded-sm"
                        style={{
                            width: '210mm',
                            maxWidth: '100%',
                            minHeight: '297mm',
                            padding: '25mm 30mm',
                        }}
                    >
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            dir="rtl"
                            lang="ar"
                            className="outline-none min-h-[200px]"
                            style={{
                                fontFamily: "'Cairo', 'Arial', sans-serif",
                                fontSize: `${fontSize}px`,
                                lineHeight: 1.8,
                                color: '#1a1a1a',
                                direction: 'rtl',
                                textAlign: 'right',
                            }}
                        />
                    </div>
                </div>

                {/* ═══ SIDEBAR: Version History ═══ */}
                {showHistory && document?.versions && (
                    <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-auto">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <History className="w-4 h-4 text-gray-500" />
                                سجل الإصدارات
                            </h3>
                        </div>
                        <div className="p-2">
                            {document.versions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm">لا توجد إصدارات سابقة</div>
                            ) : (
                                document.versions.map((v: any) => (
                                    <div key={v.id} className="p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-gray-800">v{v.version}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(v.createdAt).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            {v.user?.name}
                                            {v.changeNote && <span className="block text-gray-400 mt-0.5">{v.changeNote}</span>}
                                        </div>
                                        <button
                                            onClick={() => restoreVersion(v.id)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            استعادة هذا الإصدار
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

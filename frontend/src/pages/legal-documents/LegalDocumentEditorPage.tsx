import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, ArrowRight, History, Bold, Italic, Underline as UnderlineIcon,
    AlignRight, AlignLeft, AlignCenter, AlignJustify,
    List, ListOrdered, Heading1, Heading2, Heading3,
    Undo, Redo, Type, Minus, Plus, Table as TableIcon,
    ChevronDown, Columns2, FileText,
    FileDown, Stamp, X, Search, User, Briefcase, Building2,
    Strikethrough, Highlighter, Link as LinkIcon, Image as ImageIcon,
    Hash, ChevronRight,
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import { legalDocumentsApi as legalDocsListApi } from '@/api/legalDocuments';
import { clientsApi } from '@/api/clients.api';
import { casesApi } from '@/api/cases.api';
import { firmApi } from '@/api/settings.api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT:    { label: 'مسودة',         color: '#64748b', bg: '#f1f5f9' },
    REVIEW:   { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fef3c7' },
    FINAL:    { label: 'نهائي',         color: '#10b981', bg: '#d1fae5' },
    SENT:     { label: 'مُرسل',         color: '#3b82f6', bg: '#dbeafe' },
    ARCHIVED: { label: 'مؤرشف',        color: '#94a3b8', bg: '#f1f5f9' },
};

type SidePanelType = 'history' | 'docs' | 'client' | 'shortcuts' | null;

// ─── Smart Shortcut Field Groups ─────────────────────────────────────
interface FieldGroup { label: string; icon: React.ElementType; fields: { label: string; key: string }[] }

const FIRM_FIELDS: FieldGroup = {
    label: 'المكتب / الشركة', icon: Building2,
    fields: [
        { label: 'اسم المكتب',       key: 'firm.name'          },
        { label: 'العنوان',           key: 'firm.address'       },
        { label: 'المدينة',           key: 'firm.city'          },
        { label: 'الهاتف',            key: 'firm.phone'         },
        { label: 'البريد الإلكتروني', key: 'firm.email'         },
        { label: 'رقم الضريبة',       key: 'firm.taxNumber'     },
        { label: 'السجل التجاري',     key: 'firm.commercialReg' },
    ],
};
const CLIENT_FIELDS: FieldGroup = {
    label: 'العميل', icon: User,
    fields: [
        { label: 'اسم العميل',     key: 'client.name'         },
        { label: 'رقم الهوية',     key: 'client.nationalId'   },
        { label: 'رقم الجوال',     key: 'client.phone'        },
        { label: 'البريد',          key: 'client.email'        },
        { label: 'اسم الشركة',     key: 'client.companyName'  },
        { label: 'السجل التجاري',  key: 'client.commercialReg'},
        { label: 'الرقم الموحد',   key: 'client.unifiedNumber'},
        { label: 'اسم الممثل',     key: 'client.repName'      },
        { label: 'هوية الممثل',    key: 'client.repIdentity'  },
    ],
};
const CASE_FIELDS: FieldGroup = {
    label: 'القضية', icon: Briefcase,
    fields: [
        { label: 'رقم القضية',   key: 'case.caseNumber' },
        { label: 'عنوان القضية', key: 'case.title'      },
        { label: 'المحكمة',      key: 'case.court'      },
        { label: 'تاريخ الرفع',  key: 'case.filingDate' },
        { label: 'الحالة',       key: 'case.status'     },
    ],
};

export default function LegalDocumentEditorPage() {
    const { id } = useParams<{ id: string }>();
    const { nav } = useSlugPath();
    const queryClient = useQueryClient();

    // ── Core state ──
    const [content, setContent]           = useState('');
    const [title, setTitle]               = useState('');
    const [status, setStatus]             = useState('DRAFT');
    const [hasUnsaved, setHasUnsaved]     = useState(false);
    const [isSaving, setIsSaving]         = useState(false);
    const [fontSize, setFontSize]         = useState(14);

    // ── UI state ──
    const [showStatusMenu, setShowStatusMenu]   = useState(false);
    const [sidePanel, setSidePanel]             = useState<SidePanelType>(null);
    const [splitMode, setSplitMode]             = useState(false);
    const [useLetterhead, setUseLetterhead]     = useState(false);
    const [shortcutQuery, setShortcutQuery]     = useState('');
    const [shortcutPos, setShortcutPos]         = useState<{ top: number; left: number } | null>(null);
    const [shortcutGroup, setShortcutGroup]     = useState<string | null>(null);
    const [docsSearch, setDocsSearch]           = useState('');
    const [splitDoc, setSplitDoc]               = useState<any>(null);

    const editorRef   = useRef<HTMLDivElement>(null);
    const autoSaveRef = useRef<ReturnType<typeof setInterval>>();
    const printRef    = useRef<HTMLDivElement>(null);

    // ── Data queries ──
    const { data: doc, isLoading } = useQuery({
        queryKey: ['legal-document', id],
        queryFn: () => legalDocumentsApi.getById(id!),
        enabled: !!id,
    });

    const { data: firmData } = useQuery({
        queryKey: ['firm-settings'],
        queryFn: () => firmApi.get(),
    });
    const firm = firmData?.data;

    const { data: clientData } = useQuery({
        queryKey: ['client', doc?.clientId],
        queryFn: () => clientsApi.getById(doc!.clientId),
        enabled: !!doc?.clientId,
    });
    const client = clientData?.data;

    const { data: caseData } = useQuery({
        queryKey: ['case', doc?.caseId],
        queryFn: () => casesApi.getById(doc!.caseId),
        enabled: !!doc?.caseId,
    });
    const caseDoc = caseData?.data;

    const { data: docsData } = useQuery({
        queryKey: ['legal-docs-list'],
        queryFn: () => legalDocsListApi.getAll({ page: 1 }),
        enabled: splitMode || sidePanel === 'docs',
    });
    const docsList = (docsData as any)?.data || [];
    const filteredDocs = docsList.filter((d: any) =>
        d.title?.toLowerCase().includes(docsSearch.toLowerCase())
    );

    // ── Init ──
    useEffect(() => {
        if (doc) {
            setContent(doc.content || '');
            setTitle(doc.title || '');
            setStatus(doc.status || 'DRAFT');
            if (doc.settings?.fontSize) setFontSize(doc.settings.fontSize);
        }
    }, [doc]);

    useEffect(() => {
        if (editorRef.current && content && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = content;
        }
    }, [content]);

    // ── Save ──
    const saveMutation = useMutation({
        mutationFn: (data: any) => legalDocumentsApi.update(id!, data),
        onSuccess: () => {
            setHasUnsaved(false);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
        },
    });

    const handleSave = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        try {
            await saveMutation.mutateAsync({
                content: editorRef.current.innerHTML,
                title,
                settings: { fontSize },
            });
            toast.success('تم الحفظ ✓');
        } catch {
            toast.error('فشل الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save
    useEffect(() => {
        autoSaveRef.current = setInterval(async () => {
            if (hasUnsaved && editorRef.current) {
                try {
                    await saveMutation.mutateAsync({
                        content: editorRef.current.innerHTML,
                        title,
                    });
                } catch { }
            }
        }, 30000);
        return () => clearInterval(autoSaveRef.current);
    }, [hasUnsaved, title]);

    // Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [title]);

    const handleInput = useCallback(() => {
        setHasUnsaved(true);
        detectShortcut();
    }, []);

    const execCommand = (command: string, value?: string) => {
        window.document.execCommand(command, false, value);
        editorRef.current?.focus();
        setHasUnsaved(true);
    };

    // ── {{ Smart Shortcut Detection ──
    const detectShortcut = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const text = range.startContainer.textContent || '';
        const pos = range.startOffset;
        const before = text.substring(0, pos);
        const match = before.match(/\{\{([^}]*)$/);
        if (match) {
            setShortcutQuery(match[1]);
            const rect = range.getBoundingClientRect();
            setShortcutPos({ top: rect.bottom + 8, left: rect.left });
        } else {
            closeShortcut();
        }
    };

    const closeShortcut = () => {
        setShortcutPos(null);
        setShortcutQuery('');
        setShortcutGroup(null);
    };

    // ── Resolve field value ──
    const resolveField = (key: string): string => {
        const [group, field] = key.split('.');
        if (group === 'firm' && firm)   return (firm as any)[field] || `[${key}]`;
        if (group === 'client' && client) return (client as any)[field] || `[${key}]`;
        if (group === 'case' && caseDoc)  return (caseDoc as any)[field] || `[${key}]`;
        return `[${key}]`;
    };

    const insertField = (key: string) => {
        const value = resolveField(key);
        // Replace {{ … with the value
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        const text = node.textContent || '';
        const pos = range.startOffset;
        const before = text.substring(0, pos);
        const triggerIndex = before.lastIndexOf('{{');
        if (triggerIndex !== -1) {
            node.textContent =
                text.substring(0, triggerIndex) +
                value +
                text.substring(pos);
            // Move cursor after inserted value
            const newRange = document.createRange();
            newRange.setStart(node, triggerIndex + value.length);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
        }
        setHasUnsaved(true);
        closeShortcut();
        editorRef.current?.focus();
    };

    // (shortcut popup uses getShortcutGroups)

    // ── Status change ──
    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        setShowStatusMenu(false);
        try {
            await saveMutation.mutateAsync({ status: newStatus });
            toast.success(`تم تغيير الحالة إلى ${STATUS_MAP[newStatus]?.label}`);
        } catch { }
    };

    // ── Export PDF ──
    const handleExportPdf = () => {
        if (!editorRef.current) return;
        const win = window.open('', '_blank');
        if (!win) return;
        const logoUrl = firm?.logo;
        const letterheadHtml = useLetterhead ? `
            <div class="letterhead" style="border-bottom:2px solid #1a3a5c;padding-bottom:16px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                    ${logoUrl ? `<img src="${logoUrl}" style="height:60px;object-fit:contain;max-width:200px;" alt="logo"/>` : ''}
                    <div style="font-size:18px;font-weight:700;color:#1a3a5c;margin-top:4px;">${firm?.name || ''}</div>
                </div>
                <div style="text-align:left;font-size:12px;color:#555;line-height:1.8;">
                    ${firm?.phone ? `📞 ${firm.phone}<br/>` : ''}
                    ${firm?.email ? `✉️ ${firm.email}<br/>` : ''}
                    ${firm?.address ? `📍 ${firm.address}` : ''}
                </div>
            </div>
        ` : '';

        win.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head>
            <meta charset="UTF-8"><title>${title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; }
                body { font-family: 'Cairo', Arial, sans-serif; font-size: ${fontSize}px; line-height: 1.8; color: #1a1a1a; direction: rtl; padding: 20mm 25mm; margin: 0; }
                h1 { font-size: 20px; font-weight: 700; text-align: center; }
                h2 { font-size: 18px; font-weight: 700; }
                h3 { font-size: 16px; font-weight: 600; color: #1a3a5c; }
                p { margin: 8px 0; text-align: justify; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; }
                td, th { border: 1px solid #ccc; padding: 8px 12px; text-align: right; }
                th { background: #f5f5f5; font-weight: 700; }
                @page { size: A4; margin: 15mm; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head><body>${letterheadHtml}${editorRef.current.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 600);
    };

    // ── Restore version ──
    const restoreVersion = async (versionId: string) => {
        try {
            await legalDocumentsApi.restoreVersion(id!, versionId);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
            setSidePanel(null);
            toast.success('تم استعادة الإصدار');
        } catch {
            toast.error('فشل استعادة الإصدار');
        }
    };

    // ── Shortcut groups ──
    const getShortcutGroups = (): FieldGroup[] => [FIRM_FIELDS, CLIENT_FIELDS, CASE_FIELDS];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-slate-400 text-sm">جاري تحميل الوثيقة...</span>
                </div>
            </div>
        );
    }

    const statusInfo = STATUS_MAP[status] || STATUS_MAP.DRAFT;

    const toggleSidePanel = (panel: SidePanelType) => {
        setSidePanel(p => p === panel ? null : panel);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

            {/* ══════════ TOP BAR ══════════ */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 flex-shrink-0 shadow-sm">
                <button onClick={() => nav('/legal-documents')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </button>

                <input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setHasUnsaved(true); }}
                    className="flex-1 text-slate-900 font-semibold text-base bg-transparent border-none outline-none placeholder:text-slate-400"
                    placeholder="عنوان الوثيقة"
                />

                {hasUnsaved && <span className="text-xs text-amber-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />لم يُحفظ</span>}

                {/* Status */}
                <div className="relative">
                    <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '40' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
                        {statusInfo.label}
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border shadow-xl py-1 z-50 min-w-[160px]">
                            {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <button key={key} onClick={() => handleStatusChange(key)}
                                    className="w-full px-4 py-2 text-right text-sm hover:bg-slate-50 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Split screen toggle */}
                <button
                    onClick={() => setSplitMode(s => !s)}
                    title="تقسيم الشاشة"
                    className={cn("p-2 rounded-lg transition-colors", splitMode ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-100")}
                >
                    <Columns2 className="w-4 h-4" />
                </button>

                {/* Letterhead toggle */}
                <button
                    onClick={() => setUseLetterhead(l => !l)}
                    title={useLetterhead ? "إخفاء الهيدر ليتر" : "تفعيل الهيدر ليتر"}
                    className={cn("p-2 rounded-lg transition-colors", useLetterhead ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100")}
                >
                    <Stamp className="w-4 h-4" />
                </button>

                {/* History */}
                <button onClick={() => toggleSidePanel('history')} title="سجل الإصدارات"
                    className={cn("p-2 rounded-lg transition-colors", sidePanel === 'history' ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:bg-slate-100")}>
                    <History className="w-4 h-4" />
                </button>

                {/* Export PDF */}
                <button onClick={handleExportPdf} title="تصدير PDF"
                    className="flex items-center gap-1.5 bg-rose-500 text-white px-3 py-2 rounded-xl text-sm hover:bg-rose-600 transition-colors font-medium shadow-sm">
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                </button>

                {/* Save */}
                <button onClick={handleSave} disabled={isSaving || !hasUnsaved}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 font-medium shadow-sm">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>

            {/* ══════════ TOOLBAR ══════════ */}
            <div className="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center gap-0.5 flex-shrink-0 flex-wrap shadow-sm">

                {/* Undo / Redo */}
                <ToolBtn onClick={() => execCommand('undo')} title="تراجع"><Undo className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('redo')} title="إعادة"><Redo className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* Font size */}
                <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg px-1.5 py-0.5 border border-slate-200">
                    <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="p-1 rounded hover:bg-slate-200 text-slate-500"><Minus className="w-3 h-3" /></button>
                    <span className="text-xs text-slate-700 w-6 text-center font-mono">{fontSize}</span>
                    <button onClick={() => setFontSize(s => Math.min(32, s + 1))} className="p-1 rounded hover:bg-slate-200 text-slate-500"><Plus className="w-3 h-3" /></button>
                </div>
                <Divider />

                {/* Headings */}
                <ToolBtn onClick={() => execCommand('formatBlock', 'h1')} title="عنوان 1"><Heading1 className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('formatBlock', 'h2')} title="عنوان 2"><Heading2 className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('formatBlock', 'h3')} title="عنوان 3"><Heading3 className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('formatBlock', 'p')} title="فقرة"><Type className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* Text style */}
                <ToolBtn onClick={() => execCommand('bold')} title="غامق"><Bold className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('italic')} title="مائل"><Italic className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('underline')} title="تسطير"><UnderlineIcon className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('strikeThrough')} title="شطب"><Strikethrough className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => {
                    const color = window.prompt('أدخل لون التظليل (مثل: #ffff00):', '#ffff00');
                    if (color) execCommand('backColor', color);
                }} title="تظليل"><Highlighter className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* Alignment */}
                <ToolBtn onClick={() => execCommand('justifyRight')} title="يمين"><AlignRight className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('justifyCenter')} title="وسط"><AlignCenter className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('justifyLeft')} title="يسار"><AlignLeft className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('justifyFull')} title="ضبط"><AlignJustify className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* Lists */}
                <ToolBtn onClick={() => execCommand('insertUnorderedList')} title="قائمة نقطية"><List className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => execCommand('insertOrderedList')} title="قائمة مرقمة"><ListOrdered className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* Insert */}
                <ToolBtn onClick={() => execCommand('insertHorizontalRule')} title="خط فاصل"><Minus className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => {
                    const table = `<table style="width:100%;border-collapse:collapse;margin:12px 0">
                        <tr><th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 1</th>
                        <th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 2</th>
                        <th style="border:1px solid #ccc;padding:8px 12px;background:#f5f5f5;text-align:right">العمود 3</th></tr>
                        <tr><td style="border:1px solid #ccc;padding:8px 12px">&nbsp;</td>
                        <td style="border:1px solid #ccc;padding:8px 12px">&nbsp;</td>
                        <td style="border:1px solid #ccc;padding:8px 12px">&nbsp;</td></tr></table>`;
                    execCommand('insertHTML', table);
                }} title="إدراج جدول"><TableIcon className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => {
                    const url = window.prompt('رابط الصورة:');
                    if (url) execCommand('insertImage', url);
                }} title="إدراج صورة"><ImageIcon className="w-4 h-4" /></ToolBtn>
                <ToolBtn onClick={() => {
                    const url = window.prompt('أدخل الرابط:');
                    if (url) execCommand('createLink', url);
                }} title="إدراج رابط"><LinkIcon className="w-4 h-4" /></ToolBtn>
                <Divider />

                {/* {{ Shortcuts helper */}
                <button
                    onClick={() => toggleSidePanel('shortcuts')}
                    title="إدراج بيانات ({{)"
                    className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border",
                        sidePanel === 'shortcuts'
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                >
                    <Hash className="w-3.5 h-3.5" />
                    {'{{ }}'}
                </button>
            </div>

            {/* ══════════ MAIN AREA ══════════ */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Editor Column ── */}
                <div className={cn("flex flex-col overflow-hidden transition-all", splitMode ? "w-1/2" : "flex-1")}>
                    <div className="flex-1 overflow-auto bg-slate-100 py-8 px-4">
                        <div ref={printRef} className="mx-auto bg-white shadow-lg rounded-sm relative"
                            style={{ width: '210mm', maxWidth: '100%', minHeight: '297mm', padding: '20mm 25mm' }}>

                            {/* Letterhead header */}
                            {useLetterhead && firm && (
                                <div className="border-b-2 border-blue-800 pb-4 mb-6 flex items-start justify-between">
                                    <div>
                                        {firm.logo && (
                                            <img src={firm.logo} alt="شعار" className="h-16 object-contain max-w-[180px] mb-1" />
                                        )}
                                        <div className="text-blue-900 font-bold text-lg mt-1">{firm.name}</div>
                                        {firm.commercialReg && <div className="text-xs text-slate-500">السجل التجاري: {firm.commercialReg}</div>}
                                        {firm.taxNumber && <div className="text-xs text-slate-500">الرقم الضريبي: {firm.taxNumber}</div>}
                                    </div>
                                    <div className="text-left text-xs text-slate-500 leading-relaxed">
                                        {firm.phone  && <div>📞 {firm.phone}</div>}
                                        {firm.email  && <div>✉️ {firm.email}</div>}
                                        {firm.address && <div>📍 {firm.address}{firm.city ? `، ${firm.city}` : ''}</div>}
                                        {firm.website && <div>🌐 {firm.website}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Content area */}
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleInput}
                                dir="rtl"
                                lang="ar"
                                className="outline-none min-h-[200px] focus:ring-0"
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
                </div>

                {/* ── Split divider ── */}
                {splitMode && <div className="w-1 bg-slate-300 cursor-col-resize hover:bg-blue-400 transition-colors" />}

                {/* ── Right panel (split mode = second doc browser) ── */}
                {splitMode && (
                    <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-semibold text-slate-700">استعراض وثيقة أخرى</span>
                            <button onClick={() => setSplitMode(false)} className="ml-auto p-1 rounded hover:bg-slate-200 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {!splitDoc ? (
                            <div className="flex flex-col h-full">
                                <div className="p-3 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={docsSearch}
                                            onChange={e => setDocsSearch(e.target.value)}
                                            placeholder="ابحث عن وثيقة..."
                                            className="w-full pr-9 pl-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-2 space-y-1">
                                    {filteredDocs.map((d: any) => (
                                        <button key={d.id} onClick={() => setSplitDoc(d)}
                                            className="w-full text-right p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                                            <div className="text-sm font-medium text-slate-800 truncate">{d.title}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{d.type} · {new Date(d.updatedAt).toLocaleDateString('ar-SA')}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                                    <button onClick={() => setSplitDoc(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-semibold text-slate-700 truncate flex-1">{splitDoc.title}</span>
                                </div>
                                <div className="flex-1 overflow-auto p-6">
                                    <div
                                        className="prose max-w-none text-slate-800 leading-relaxed"
                                        style={{ fontFamily: "'Cairo', sans-serif", direction: 'rtl', textAlign: 'right', fontSize: `${fontSize}px` }}
                                        dangerouslySetInnerHTML={{ __html: splitDoc.content || '<p class="text-slate-400 text-center">لا يوجد محتوى</p>' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Side Panel ── */}
                {sidePanel && !splitMode && (
                    <div className="w-80 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-semibold text-slate-800 text-sm">
                                {sidePanel === 'history'   && 'سجل الإصدارات'}
                                {sidePanel === 'shortcuts' && 'إدراج بيانات'}
                                {sidePanel === 'client'    && 'بيانات العميل'}
                            </h3>
                            <button onClick={() => setSidePanel(null)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* History panel */}
                        {sidePanel === 'history' && (
                            <div className="flex-1 overflow-auto p-2 space-y-2">
                                {!doc?.versions || doc.versions.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-sm">لا توجد إصدارات سابقة</div>
                                ) : doc.versions.map((v: any) => (
                                    <div key={v.id} className="p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-slate-800">v{v.version}</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(v.createdAt).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {v.user?.name && <div className="text-xs text-slate-500">{v.user.name}</div>}
                                        <button onClick={() => restoreVersion(v.id)}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                            استعادة هذا الإصدار
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Shortcuts panel */}
                        {sidePanel === 'shortcuts' && (
                            <div className="flex-1 overflow-auto">
                                <div className="p-3 border-b border-slate-100 bg-blue-50">
                                    <p className="text-xs text-blue-700">اكتب <code className="bg-blue-100 px-1 rounded font-mono font-bold">{'{{' }</code> في المحرر لاستدعاء هذه البيانات تلقائياً، أو انقر على أي حقل أدناه للإدراج المباشر</p>
                                </div>
                                {[FIRM_FIELDS, CLIENT_FIELDS, CASE_FIELDS].map(group => {
                                    const Icon = group.icon;
                                    return (
                                        <div key={group.label} className="border-b border-slate-100 last:border-0">
                                            <div className="px-4 py-2 bg-slate-50 flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs font-semibold text-slate-600">{group.label}</span>
                                            </div>
                                            {group.fields.map(field => (
                                                <button key={field.key}
                                                    onClick={() => {
                                                        const val = resolveField(field.key);
                                                        execCommand('insertText', val);
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                                    <span className="text-sm text-slate-700">{field.label}</span>
                                                    <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                                                        {resolveField(field.key).startsWith('[') ? '—' : resolveField(field.key)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════ {{ SHORTCUT POPUP ══════════ */}
            {shortcutPos && (
                <div
                    className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                    style={{ top: shortcutPos.top, left: shortcutPos.left, width: 280 }}
                >
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500 font-mono">{`{{${shortcutQuery}`}</span>
                            <button onClick={closeShortcut} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    {!shortcutGroup ? (
                        <div className="py-1">
                            {getShortcutGroups().map(group => {
                                const Icon = group.icon;
                                return (
                                    <button key={group.label} onClick={() => setShortcutGroup(group.label)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-right">
                                        <Icon className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-700">{group.label}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 mr-auto" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-1 max-h-52 overflow-auto">
                            <button onClick={() => setShortcutGroup(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-b border-slate-100">
                                <ArrowRight className="w-3.5 h-3.5" /> رجوع
                            </button>
                            {getShortcutGroups().find(g => g.label === shortcutGroup)?.fields
                                .filter(f => !shortcutQuery || f.label.includes(shortcutQuery))
                                .map(field => (
                                    <button key={field.key}
                                        onMouseDown={e => { e.preventDefault(); insertField(field.key); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-right">
                                        <span className="text-sm text-slate-700">{field.label}</span>
                                        <span className="text-xs text-slate-400 font-mono max-w-[100px] truncate">
                                            {resolveField(field.key).startsWith('[') ? '—' : resolveField(field.key)}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Helper components ──────────────────────────────────────────
function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button onClick={onClick} title={title}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />;
}

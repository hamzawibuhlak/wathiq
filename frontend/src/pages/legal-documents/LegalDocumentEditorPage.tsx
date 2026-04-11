import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save, ArrowRight, History, Bold, Italic, Underline as UnderlineIcon,
    AlignRight, AlignLeft, AlignCenter, AlignJustify,
    List, ListOrdered, Heading1, Heading2, Heading3,
    Undo, Redo, FileDown, Printer, Type, Minus, Plus,
    Table as TableIcon, ChevronDown, Braces, PanelRight,
    FileText, Users, Briefcase, X, Copy, Search,
    LayoutTemplate, Strikethrough, Highlighter,
    Trash2, RotateCw, Palette, PanelTop, PanelBottom,
    Maximize2, ImagePlus, Download, RotateCcw,
    ClipboardList,
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import { firmApi } from '@/api/settings.api';
import { clientsApi } from '@/api/clients.api';
import { casesApi } from '@/api/cases.api';
import { useEditorAnswers } from '@/hooks/useForms';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ─── Status map ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT:    { label: 'مسودة',        color: '#64748b', bg: '#f1f5f9' },
    REVIEW:   { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fef3c7' },
    FINAL:    { label: 'نهائي',        color: '#10b981', bg: '#d1fae5' },
    SENT:     { label: 'مُرسل',        color: '#3b82f6', bg: '#dbeafe' },
    ARCHIVED: { label: 'مؤرشف',        color: '#94a3b8', bg: '#f1f5f9' },
};

// ─── Variable system ───────────────────────────────────────────────────────
const VARIABLE_CATEGORIES = [
    {
        id: 'client', label: 'العميل', icon: '👤',
        vars: [
            { label: 'اسم العميل',     key: 'client.name' },
            { label: 'رقم الهوية',     key: 'client.nationalId' },
            { label: 'الجوال',         key: 'client.phone' },
            { label: 'البريد',         key: 'client.email' },
            { label: 'السجل التجاري',  key: 'client.commercialReg' },
            { label: 'العنوان',        key: 'client.address' },
            { label: 'المدينة',        key: 'client.city' },
        ],
    },
    {
        id: 'case', label: 'القضية', icon: '⚖️',
        vars: [
            { label: 'رقم القضية',     key: 'case.caseNumber' },
            { label: 'عنوان القضية',   key: 'case.title' },
            { label: 'المحكمة',        key: 'case.court' },
            { label: 'القاضي',         key: 'case.judge' },
            { label: 'رقم الجلسة',    key: 'case.sessionNumber' },
            { label: 'نوع القضية',     key: 'case.type' },
        ],
    },
    {
        id: 'firm', label: 'المكتب', icon: '🏢',
        vars: [
            { label: 'اسم المكتب',     key: 'firm.name' },
            { label: 'الرقم الضريبي',  key: 'firm.taxNumber' },
            { label: 'السجل التجاري',  key: 'firm.commercialReg' },
            { label: 'الهاتف',         key: 'firm.phone' },
            { label: 'البريد',         key: 'firm.email' },
            { label: 'العنوان',        key: 'firm.address' },
            { label: 'المدينة',        key: 'firm.city' },
        ],
    },
    {
        id: 'doc', label: 'الوثيقة', icon: '📋',
        vars: [
            { label: 'عنوان الوثيقة',  key: 'doc.title' },
            { label: 'تاريخ اليوم',    key: 'doc.today' },
            { label: 'تاريخ الإنشاء',  key: 'doc.createdAt' },
            { label: 'السنة',          key: 'doc.year' },
        ],
    },
];

// ─── Page sizes ────────────────────────────────────────────────────────────
const PAGE_SIZES: Record<string, { label: string; w: number; h: number }> = {
    'A1':     { label: 'A1',     w: 594, h: 841 },
    'A2':     { label: 'A2',     w: 420, h: 594 },
    'A3':     { label: 'A3',     w: 297, h: 420 },
    'A4':     { label: 'A4',     w: 210, h: 297 },
    'A5':     { label: 'A5',     w: 148, h: 210 },
    'A6':     { label: 'A6',     w: 105, h: 148 },
    'Letter': { label: 'Letter', w: 216, h: 279 },
    'Legal':  { label: 'Legal',  w: 216, h: 356 },
};
// 1mm ≈ 3.7795px at 96dpi
const MM_TO_PX = 3.7795;

// ─── Side panel tabs ───────────────────────────────────────────────────────
const PANEL_TABS = [
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'clients',   label: 'العملاء',   icon: Users },
    { id: 'cases',     label: 'القضايا',   icon: Briefcase },
];

// ─── Resolve a variable ────────────────────────────────────────────────────
function resolveVar(key: string, ctx: {client?: any; case?: any; firm?: any; doc?: any}): string {
    const [cat, field] = key.split('.');
    const obj = (ctx as any)[cat];
    if (!obj) return `{{${key}}}`;
    if (key === 'doc.today')     return format(new Date(), 'dd MMMM yyyy', { locale: ar });
    if (key === 'doc.year')      return new Date().getFullYear().toString();
    if (key === 'doc.createdAt') return obj.createdAt ? format(new Date(obj.createdAt), 'dd MMMM yyyy', { locale: ar }) : '';
    return obj[field] ?? `{{${key}}}`;
}

// ─── Toolbar Button ────────────────────────────────────────────────────────
function ToolBtn({ onClick, title, active, children }: {
    onClick: () => void; title: string; active?: boolean; children: React.ReactNode;
}) {
    return (
        <button
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            title={title}
            className={cn(
                'p-1.5 rounded-md text-sm transition-all',
                active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            )}
        >
            {children}
        </button>
    );
}

// ─── Divider ───────────────────────────────────────────────────────────────
const Divider = () => <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;

// ─── Color palette ─────────────────────────────────────────────────────────
const COLOR_ROWS = [
    ['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff'],
    ['#ff0000','#ff4500','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff','#ff00ff'],
    ['#f4cccc','#fce5cd','#fff2cc','#d9ead3','#d0e4f1','#cfe2f3','#d9d2e9','#ead1dc','#e6b8a2','#d5a6bd'],
    ['#ea9999','#f9cb9c','#ffe599','#b6d7a8','#9fc5e8','#9fc5e8','#b4a7d6','#ea9999','#e6b8a2','#d5a6bd'],
    ['#e06666','#f6b26b','#ffd966','#93c47d','#76a5af','#6fa8dc','#8e7cc3','#c27ba0','#a64d79','#85200c'],
    ['#cc0000','#e69138','#f1c232','#6aa84f','#45818e','#3d85c8','#674ea7','#a61c00','#85200c','#7f6000'],
    ['#990000','#b45f06','#bf9000','#38761d','#134f5c','#1155cc','#351c75','#741b47','#4c1130','#660000'],
    ['#660000','#783f04','#7f6000','#274e13','#0c343d','#1c4587','#20124d','#4c1130','#2d0922','#000000'],
];

function ColorGrid({ onSelect, onReset, currentColor }: {
    onSelect: (c: string) => void;
    onReset: () => void;
    currentColor: string;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-3 w-[220px]" dir="rtl">
            <button
                onMouseDown={e => { e.preventDefault(); onReset(); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-2 w-full hover:bg-slate-50 rounded-md px-1 py-1"
            >
                <RotateCcw className="w-3 h-3" />
                إعادة ضبط
            </button>
            <div className="space-y-0.5">
                {COLOR_ROWS.map((row, ri) => (
                    <div key={ri} className="flex gap-0.5">
                        {row.map(c => (
                            <button
                                key={c}
                                onMouseDown={e => { e.preventDefault(); onSelect(c); }}
                                className="w-5 h-5 rounded-sm border border-black/10 hover:scale-110 transition-transform flex-shrink-0 relative"
                                style={{ backgroundColor: c }}
                                title={c}
                            >
                                {c === currentColor && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[8px]" style={{ color: c === '#ffffff' || c === '#f3f3f3' || c === '#efefef' || c === '#d9d9d9' ? '#333' : '#fff' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">مخصص</p>
                <input
                    type="color"
                    value={currentColor}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => onSelect(e.target.value)}
                    className="w-full h-6 rounded cursor-pointer border border-slate-200"
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function LegalDocumentEditorPage() {
    const { id } = useParams<{ id: string }>();
    const { nav, p } = useSlugPath();
    const queryClient = useQueryClient();

    // ── State ──────────────────────────────────────────────────────────────
    const [title, setTitle]                 = useState('');
    const [status, setStatus]               = useState('DRAFT');
    const [hasUnsaved, setHasUnsaved]       = useState(false);
    const [isSaving, setIsSaving]           = useState(false);
    const [fontSize, setFontSize]           = useState(14);  // toolbar display
    const [editorFontSize, setEditorFontSize] = useState(14); // container default
    const [showHistory, setShowHistory]     = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showSplit, setShowSplit]         = useState(false);
    const [showLetterhead, setShowLetterhead] = useState(false);
    const [panelTab, setPanelTab]           = useState<'documents' | 'clients' | 'cases'>('documents');
    const [panelSearch, setPanelSearch]     = useState('');
    const [panelSelected, setPanelSelected] = useState<any>(null);

    // Variable menu
    const [showVarMenu, setShowVarMenu]     = useState(false);
    const [varQuery, setVarQuery]           = useState('');
    const [varMenuPos, setVarMenuPos]       = useState({ x: 0, y: 0 });
    const [varBraceStart, setVarBraceStart] = useState(-1);
    const [varActiveNode, setVarActiveNode] = useState<Node | null>(null);
    const [varActiveCat, setVarActiveCat]   = useState<string | null>(null);

    // Form answers menu
    const [showAnswersMenu, setShowAnswersMenu] = useState(false);
    const [answersMenuPos, setAnswersMenuPos]   = useState({ x: 0, y: 0 });
    const [answersQuery, setAnswersQuery]       = useState('');

    const editorRef          = useRef<HTMLDivElement>(null);
    const autoSaveRef        = useRef<ReturnType<typeof setInterval>>();
    const varMenuRef         = useRef<HTMLDivElement>(null);
    const imageInputRef      = useRef<HTMLInputElement>(null);
    const savedTableCtxRef   = useRef<{ cell: HTMLTableCellElement; row: HTMLTableRowElement; table: HTMLTableElement; ci: number; ri: number } | null>(null);
    // Saves the last non-collapsed selection inside the editor so toolbar actions work even after focus loss
    const savedSelectionRef  = useRef<Range | null>(null);
    // Header/footer contentEditable refs (3 columns each)
    const headerRef0 = useRef<HTMLDivElement>(null);
    const headerRef1 = useRef<HTMLDivElement>(null);
    const headerRef2 = useRef<HTMLDivElement>(null);
    const footerRef0 = useRef<HTMLDivElement>(null);
    const footerRef1 = useRef<HTMLDivElement>(null);
    const footerRef2 = useRef<HTMLDivElement>(null);
    const headerPartRefs = [headerRef0, headerRef1, headerRef2];
    const footerPartRefs = [footerRef0, footerRef1, footerRef2];
    const headerFooterInitedDoc = useRef<string | null>(null);

    // ── Extra toolbar state ────────────────────────────────────────────────
    const [fontFamily, setFontFamily]   = useState("Arial");
    const [fontColor,  setFontColor]    = useState('#1a1a1a');
    const [hlColor,    setHlColor]      = useState('#fef08a');
    const [inTable,    setInTable]      = useState(false);

    // ── Page layout state ──────────────────────────────────────────────────
    const [pageSize,        setPageSize]        = useState('A4');
    const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [showHeader,      setShowHeader]      = useState(false);
    const [headerContent,   setHeaderContent]   = useState('');
    const [showFooter,      setShowFooter]      = useState(false);
    const [footerContent,   setFooterContent]   = useState('');

    // ── Table extra state ──────────────────────────────────────────────────
    const [tableCellBgColor, setTableCellBgColor] = useState('#f8fafc');
    const [tableColWidth,    setTableColWidth]    = useState('');
    const [tableRowHeight,   setTableRowHeight]   = useState('');

    // ── Color picker popup ─────────────────────────────────────────────────
    const [colorPickerTarget, setColorPickerTarget] = useState<'font'|'highlight'|'cellBg'|null>(null);

    // ── Header/Footer columns ──────────────────────────────────────────────
    const [headerCols, setHeaderCols] = useState(1);
    const [headerParts, setHeaderParts] = useState(['','','']);
    const [footerCols, setFooterCols] = useState(1);
    const [footerParts, setFooterParts] = useState(['','','']);

    // ── Data fetching ──────────────────────────────────────────────────────
    const { data: docData, isLoading } = useQuery({
        queryKey: ['legal-document', id],
        queryFn: () => legalDocumentsApi.getById(id!),
        enabled: !!id,
    });
    const docRecord = docData?.data ?? docData;

    const { data: firmData } = useQuery({
        queryKey: ['firm'],
        queryFn: () => firmApi.get(),
    });
    const firm = (firmData as any)?.data ?? firmData;

    const { data: clientsData } = useQuery({
        queryKey: ['clients-editor', panelSearch],
        queryFn: () => clientsApi.getAll({ search: panelSearch, limit: 30 }),
        enabled: panelTab === 'clients',
    });
    const clients = (clientsData as any)?.data ?? [];

    const { data: casesData } = useQuery({
        queryKey: ['cases-editor', panelSearch],
        queryFn: () => casesApi.getAll({ search: panelSearch, limit: 30 }),
        enabled: panelTab === 'cases',
    });
    const cases = (casesData as any)?.data ?? [];

    const { data: docsData } = useQuery({
        queryKey: ['legal-docs-panel', panelSearch],
        queryFn: () => legalDocumentsApi.getAll({ search: panelSearch }),
        enabled: panelTab === 'documents',
    });
    const docs = (docsData as any)?.data ?? [];

    // ── Linked client/case for variable resolution ─────────────────────────
    const linkedClientId = docRecord?.clientId;
    const linkedCaseId   = docRecord?.caseId;
    const { data: linkedClientData } = useQuery({
        queryKey: ['client', linkedClientId],
        queryFn: () => clientsApi.getById(linkedClientId!),
        enabled: !!linkedClientId,
    });
    const { data: linkedCaseData } = useQuery({
        queryKey: ['case', linkedCaseId],
        queryFn: () => casesApi.getById(linkedCaseId!),
        enabled: !!linkedCaseId,
    });

    const varContext = {
        client: (linkedClientData as any)?.data ?? linkedClientData,
        case:   (linkedCaseData as any)?.data ?? linkedCaseData,
        firm,
        doc:    docRecord,
    };

    // ── Form answers for current case/client (permission-filtered server-side) ─
    const { data: editorAnswersData } = useEditorAnswers({
        caseId: linkedCaseId,
        clientId: linkedClientId,
    });
    const editorAnswers: any[] = Array.isArray(editorAnswersData)
        ? editorAnswersData
        : ((editorAnswersData as any)?.data ?? []);

    // ── Initialize content ─────────────────────────────────────────────────
    useEffect(() => {
        if (docRecord) {
            setTitle(docRecord.title ?? '');
            setStatus(docRecord.status ?? 'DRAFT');
            const settings = docRecord.settings as any;
            if (settings?.fontSize) { setFontSize(settings.fontSize); setEditorFontSize(settings.editorFontSize ?? settings.fontSize); }
            if (settings?.showLetterhead) setShowLetterhead(true);
            if (settings?.pageSize) setPageSize(settings.pageSize);
            if (settings?.pageOrientation) setPageOrientation(settings.pageOrientation);
            if (settings?.showHeader) setShowHeader(true);
            if (settings?.headerContent) setHeaderContent(settings.headerContent);
            if (settings?.headerCols) setHeaderCols(settings.headerCols);
            if (settings?.headerParts) setHeaderParts(settings.headerParts);
            if (settings?.showFooter) setShowFooter(true);
            if (settings?.footerContent) setFooterContent(settings.footerContent);
            if (settings?.footerCols) setFooterCols(settings.footerCols);
            if (settings?.footerParts) setFooterParts(settings.footerParts);
        }
    }, [docRecord]);

    useEffect(() => {
        if (editorRef.current && docRecord?.content && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = docRecord.content;
        }
    }, [docRecord?.content]);

    // ── Set default paragraph separator to <p> for professional structure ──
    useEffect(() => {
        try { window.document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /**/ }
    }, []);

    // ── Initialize header/footer contentEditable divs when doc loads ──────
    useEffect(() => {
        if (!docRecord?.id) return;
        if (headerFooterInitedDoc.current === docRecord.id) return;
        headerFooterInitedDoc.current = docRecord.id;
        // Set innerHTML after React renders the divs (they may not be visible yet)
        const initHF = () => {
            headerPartRefs.forEach((ref, i) => {
                if (ref.current && !ref.current.innerHTML) {
                    ref.current.innerHTML = (i === 0 && headerCols === 1) ? headerContent : (headerParts[i] || '');
                }
            });
            footerPartRefs.forEach((ref, i) => {
                if (ref.current && !ref.current.innerHTML) {
                    ref.current.innerHTML = (i === 0 && footerCols === 1) ? footerContent : (footerParts[i] || '');
                }
            });
        };
        initHF();
        // Also run after a tick in case the divs aren't mounted yet
        setTimeout(initHF, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docRecord?.id, showHeader, showFooter]);

    // ── Save mutation ──────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: (data: any) => legalDocumentsApi.update(id!, data),
        onSuccess: () => {
            setHasUnsaved(false);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
        },
    });

    // Read header/footer HTML from refs (includes rich formatting from toolbar)
    const getHFPartsHtml = (refs: typeof headerPartRefs, stateParts: string[]) =>
        refs.map((r, i) => r.current?.innerHTML ?? stateParts[i] ?? '');

    const handleSave = async () => {
        if (!editorRef.current) return;
        setIsSaving(true);
        const liveHeaderParts = getHFPartsHtml(headerPartRefs, headerParts);
        const liveFooterParts = getHFPartsHtml(footerPartRefs, footerParts);
        const liveHeaderContent = headerRef0.current?.innerHTML ?? headerContent;
        const liveFooterContent = footerRef0.current?.innerHTML ?? footerContent;
        try {
            await saveMutation.mutateAsync({
                content: editorRef.current.innerHTML,
                title,
                status,
                settings: { fontSize, editorFontSize, showLetterhead, pageSize, pageOrientation, showHeader, headerContent: liveHeaderContent, headerCols, headerParts: liveHeaderParts, showFooter, footerContent: liveFooterContent, footerCols, footerParts: liveFooterParts },
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
                        settings: {
                            fontSize, editorFontSize, showLetterhead, pageSize, pageOrientation,
                            showHeader, headerContent: headerRef0.current?.innerHTML ?? headerContent, headerCols, headerParts: getHFPartsHtml(headerPartRefs, headerParts),
                            showFooter, footerContent: footerRef0.current?.innerHTML ?? footerContent, footerCols, footerParts: getHFPartsHtml(footerPartRefs, footerParts),
                        },
                    });
                } catch { /* silent */ }
            }
        }, 5000);
        return () => clearInterval(autoSaveRef.current);
    }, [hasUnsaved, title, fontSize, showLetterhead, pageSize, pageOrientation, showHeader, headerContent, headerCols, headerParts, showFooter, footerContent, footerCols, footerParts]);

    // Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [title, hasUnsaved]);

    // ── Helper: is a node inside the editor? ─────────────────────────────────
    const inEditor = (n: Node | null) => !!(n && editorRef.current?.contains(n));

    // ── Get the best available range (current selection or saved) ────────────
    // Does NOT focus or alter the DOM — pure read.
    const getBestRange = (): Range | null => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && inEditor(sel.anchorNode)) {
            return sel.getRangeAt(0);
        }
        if (savedSelectionRef.current && inEditor(savedSelectionRef.current.commonAncestorContainer)) {
            return savedSelectionRef.current.cloneRange();
        }
        return null;
    };

    // ── Editor commands (bold, italic, heading, align, lists…) ────────────────
    const exec = (cmd: string, val?: string) => {
        const sel = window.getSelection();
        // Restore saved selection if focus was taken by the toolbar button
        if ((!sel || !sel.rangeCount || !inEditor(sel.anchorNode)) && savedSelectionRef.current) {
            try { sel?.removeAllRanges(); sel?.addRange(savedSelectionRef.current.cloneRange()); } catch { /**/ }
        }
        // Focus *after* restoring range so execCommand has a target
        editorRef.current?.focus();
        window.document.execCommand(cmd, false, val);
        setHasUnsaved(true);
    };

    // ── Apply font size using Range API + font-7 trick ─────────────────────────
    // Rule: NEVER call setEditorFontSize from here — that changes ALL text.
    // With a selection → wrap it.  Collapsed cursor → execCommand sets typing size.
    const applyFontSize = (size: number) => {
        setFontSize(size); // update toolbar display only

        const range = getBestRange();

        if (range && !range.collapsed) {
            // ── Non-collapsed: apply ONLY to selected text ──
            // Restore the range first (without calling focus which can reset selection)
            const sel = window.getSelection();
            try { sel?.removeAllRanges(); sel?.addRange(range); } catch { /**/ }
            // execCommand font-7 trick: marks everything in selection with <font size=7>
            window.document.execCommand('fontSize', false, '7');
            // Replace every <font size=7> with a proper <span style="font-size:Xpx">
            editorRef.current?.querySelectorAll('font[size="7"]').forEach((el: Element) => {
                const span = window.document.createElement('span');
                span.style.fontSize = `${size}px`;
                while (el.firstChild) span.appendChild(el.firstChild);
                el.parentNode?.replaceChild(span, el);
            });
        } else if (range && range.collapsed) {
            // ── Collapsed cursor: set typing size at cursor ──
            // Restore collapsed position, then execCommand marks the insertion point
            const sel = window.getSelection();
            try { sel?.removeAllRanges(); sel?.addRange(range); } catch { /**/ }
            window.document.execCommand('fontSize', false, '7');
            editorRef.current?.querySelectorAll('font[size="7"]').forEach((el: Element) => {
                (el as HTMLElement).removeAttribute('size');
                (el as HTMLElement).style.fontSize = `${size}px`;
            });
        }
        // If NO range at all (nothing was ever clicked in editor): silently update container default
        if (!range) setEditorFontSize(size);

        setHasUnsaved(true);
    };

    // ── Export as Word (.doc) ─────────────────────────────────────────────
    const handleExportWord = () => {
        if (!editorRef.current) return;
        const pSize = PAGE_SIZES[pageSize] ?? PAGE_SIZES['A4'];
        const isLandscape = pageOrientation === 'landscape';
        const pageW = isLandscape ? pSize.h : pSize.w;
        const pageH = isLandscape ? pSize.w : pSize.h;
        const headerHtml = showHeader && (headerParts.some(p => p) || headerContent)
            ? `<div style="border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:12px;font-size:${Math.max(10, fontSize - 2)}px;color:#555;">${headerContent || headerParts.filter(Boolean).join(' &nbsp;|&nbsp; ')}</div>`
            : '';
        const footerHtml = showFooter && (footerParts.some(p => p) || footerContent)
            ? `<div style="border-top:1px solid #ccc;padding-top:8px;margin-top:12px;font-size:${Math.max(10, fontSize - 2)}px;color:#555;">${footerContent || footerParts.filter(Boolean).join(' &nbsp;|&nbsp; ')}</div>`
            : '';
        const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <xml><w:WordDocument><w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
    <w:PageSize w:w="${Math.round(pageW * 56.7)}" w:h="${Math.round(pageH * 56.7)}" ${isLandscape ? 'w:orient="landscape"' : ''}/>
    <w:PageMargins w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
  </w:WordDocument></xml>
  <style>
    body { font-family: Arial, sans-serif; font-size: ${fontSize}pt; direction: rtl; margin: 0; }
    h1 { font-size: 20pt; font-weight: bold; margin: 12pt 0; }
    h2 { font-size: 16pt; font-weight: bold; margin: 10pt 0; }
    h3 { font-size: 13pt; font-weight: bold; margin: 8pt 0; }
    p { margin: 6pt 0; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    td, th { border: 1pt solid #ccc; padding: 6pt 8pt; text-align: right; }
    th { background: #f0f4f8; font-weight: bold; }
    ul { list-style: disc; padding-right: 18pt; }
    ol { list-style: decimal; padding-right: 18pt; }
    .var-token { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body dir="rtl">
  ${headerHtml}
  ${editorRef.current.innerHTML}
  ${footerHtml}
</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${title || 'document'}.doc`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Insert image from local file ──────────────────────────────────────
    const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const src = ev.target?.result as string;
            editorRef.current?.focus();
            window.document.execCommand('insertHTML', false,
                `<img src="${src}" style="max-width:100%;height:auto;display:block;margin:8px 0;" />`
            );
            setHasUnsaved(true);
        };
        reader.readAsDataURL(file);
        // reset so same file can be re-selected
        e.target.value = '';
    };

    // ── Track table context & save selection on every selection change ────────
    useEffect(() => {
        const onSel = () => {
            const sel = window.getSelection();
            if (!sel?.rangeCount) { setInTable(false); return; }
            const range = sel.getRangeAt(0);

            // Save non-collapsed selection that lives inside the editor
            if (!sel.isCollapsed && editorRef.current?.contains(range.commonAncestorContainer)) {
                savedSelectionRef.current = range.cloneRange();
            }

            let node: Node | null = range.commonAncestorContainer;
            if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
            let el = node as Element | null;
            let found = false;
            while (el && editorRef.current?.contains(el)) {
                if (el.tagName === 'TD' || el.tagName === 'TH') { found = true; break; }
                el = el.parentElement;
            }
            if (found && el) {
                const cell = el as HTMLTableCellElement;
                const row = cell.parentElement as HTMLTableRowElement;
                const table = row.closest('table') as HTMLTableElement;
                savedTableCtxRef.current = { cell, row, table, ci: cell.cellIndex, ri: row.rowIndex };
            }
            setInTable(found);
        };
        window.document.addEventListener('selectionchange', onSel);
        return () => window.document.removeEventListener('selectionchange', onSel);
    }, []);

    // ── Table context — tries current selection, falls back to last cached cell ─
    const getTableCtx = () => {
        const sel = window.getSelection();
        if (sel?.rangeCount) {
            let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
            if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
            let cell = node as Element | null;
            while (cell && cell !== editorRef.current) {
                if (cell.tagName === 'TD' || cell.tagName === 'TH') break;
                cell = cell.parentElement;
            }
            if (cell && (cell.tagName === 'TD' || cell.tagName === 'TH')) {
                const row   = cell.parentElement as HTMLTableRowElement;
                const table = row.closest('table') as HTMLTableElement;
                const ctx = { cell: cell as HTMLTableCellElement, row, table, ci: (cell as HTMLTableCellElement).cellIndex, ri: row.rowIndex };
                savedTableCtxRef.current = ctx; // cache it
                return ctx;
            }
        }
        // Fallback: use last known table context (e.g. when input is focused)
        return savedTableCtxRef.current;
    };

    const tableAddRowBelow = () => {
        const c = getTableCtx(); if (!c) return;
        const newRow = c.table.insertRow(c.ri + 1);
        for (let i = 0; i < c.table.rows[0].cells.length; i++) {
            const td = newRow.insertCell(i);
            td.style.cssText = 'border:1px solid #cbd5e1;padding:8px 12px;';
            td.innerHTML = '&nbsp;';
        }
        setHasUnsaved(true);
    };
    const tableAddRowAbove = () => {
        const c = getTableCtx(); if (!c) return;
        const newRow = c.table.insertRow(c.ri);
        for (let i = 0; i < c.table.rows[0].cells.length; i++) {
            const td = newRow.insertCell(i);
            td.style.cssText = 'border:1px solid #cbd5e1;padding:8px 12px;';
            td.innerHTML = '&nbsp;';
        }
        setHasUnsaved(true);
    };
    const tableDeleteRow = () => {
        const c = getTableCtx(); if (!c) return;
        if (c.table.rows.length <= 1) return;
        c.table.deleteRow(c.ri);
        setHasUnsaved(true);
    };
    const tableAddColRight = () => {
        const c = getTableCtx(); if (!c) return;
        for (let i = 0; i < c.table.rows.length; i++) {
            const td = c.table.rows[i].insertCell(c.ci + 1);
            td.style.cssText = i === 0
                ? 'border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;font-weight:700;'
                : 'border:1px solid #cbd5e1;padding:8px 12px;';
            td.innerHTML = '&nbsp;';
        }
        setHasUnsaved(true);
    };
    const tableAddColLeft = () => {
        const c = getTableCtx(); if (!c) return;
        for (let i = 0; i < c.table.rows.length; i++) {
            const td = c.table.rows[i].insertCell(c.ci);
            td.style.cssText = i === 0
                ? 'border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;font-weight:700;'
                : 'border:1px solid #cbd5e1;padding:8px 12px;';
            td.innerHTML = '&nbsp;';
        }
        setHasUnsaved(true);
    };
    const tableDeleteCol = () => {
        const c = getTableCtx(); if (!c) return;
        if (c.table.rows[0].cells.length <= 1) return;
        for (let i = 0; i < c.table.rows.length; i++) c.table.rows[i].deleteCell(c.ci);
        setHasUnsaved(true);
    };
    const tableSetCellBgColor = (color: string) => {
        const c = getTableCtx(); if (!c) return;
        (c.cell as HTMLElement).style.backgroundColor = color;
        setHasUnsaved(true);
    };
    const tableEqualizeColumns = () => {
        const c = getTableCtx(); if (!c) return;
        const numCols = c.table.rows[0]?.cells.length ?? 1;
        const w = `${(100 / numCols).toFixed(1)}%`;
        for (let r = 0; r < c.table.rows.length; r++) {
            for (let col = 0; col < c.table.rows[r].cells.length; col++) {
                (c.table.rows[r].cells[col] as HTMLElement).style.width = w;
            }
        }
        setHasUnsaved(true);
    };
    const tableApplyColWidth = (width: string) => {
        if (!width.trim()) return;
        const c = getTableCtx(); if (!c) return;
        // Normalize: if it's a pure number, treat as px
        const normalized = /^\d+$/.test(width.trim()) ? `${width.trim()}px` : width.trim();
        for (let r = 0; r < c.table.rows.length; r++) {
            const cell = c.table.rows[r].cells[c.ci] as HTMLElement | undefined;
            if (cell) cell.style.width = normalized;
        }
        setHasUnsaved(true);
    };
    const tableApplyRowHeight = (height: string) => {
        if (!height.trim()) return;
        const c = getTableCtx(); if (!c) return;
        const normalized = /^\d+$/.test(height.trim()) ? `${height.trim()}px` : height.trim();
        (c.row as HTMLElement).style.height = normalized;
        setHasUnsaved(true);
    };
    const tableDeleteCell = () => {
        const c = getTableCtx(); if (!c) return;
        c.row.deleteCell(c.ci);
        savedTableCtxRef.current = null;
        setHasUnsaved(true);
    };

    // ── {{ variable detection ────────────────────────────────────────────
    const handleInput = useCallback(() => {
        setHasUnsaved(true);
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) { setShowVarMenu(false); return; }

        const range = sel.getRangeAt(0);
        const node  = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) { setShowVarMenu(false); return; }

        const text  = node.textContent ?? '';
        const offset = range.startOffset;
        const textBefore = text.substring(0, offset);
        const braceIdx   = textBefore.lastIndexOf('{{');

        if (braceIdx !== -1) {
            const afterBrace = textBefore.substring(braceIdx + 2);
            if (!afterBrace.includes('}')) {
                setVarQuery(afterBrace);
                setVarBraceStart(braceIdx);
                setVarActiveNode(node);

                const rect = range.getBoundingClientRect();
                setVarMenuPos({ x: rect.left, y: rect.bottom + 6 });
                setShowVarMenu(true);
                return;
            }
        }
        setShowVarMenu(false);
    }, []);

    const insertVariable = (key: string) => {
        if (!varActiveNode || varBraceStart === -1 || !editorRef.current) {
            setShowVarMenu(false);
            return;
        }
        const resolved = resolveVar(key, varContext);
        // Replace {{query with resolved value
        const sel = window.getSelection();
        const range = window.document.createRange();
        range.setStart(varActiveNode, varBraceStart);
        range.setEnd(varActiveNode, varBraceStart + 2 + varQuery.length);
        range.deleteContents();

        const span = window.document.createElement('span');
        span.className = 'var-token';
        span.style.cssText = 'color:#1d4ed8;font-weight:600;background:#dbeafe;padding:0 2px;border-radius:3px;';
        span.contentEditable = 'false';
        span.dataset.varKey = key;
        span.textContent = resolved;
        range.insertNode(span);

        // Move cursor after span
        const newRange = window.document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(newRange);

        editorRef.current.focus();
        setHasUnsaved(true);
        setShowVarMenu(false);
        setVarQuery('');
    };

    // Close var menu on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (varMenuRef.current && !varMenuRef.current.contains(e.target as Node)) {
                setShowVarMenu(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // ── Status change ──────────────────────────────────────────────────────
    const handleStatusChange = async (s: string) => {
        setStatus(s);
        setShowStatusMenu(false);
        try {
            await saveMutation.mutateAsync({ status: s });
            toast.success(`تم تغيير الحالة إلى ${STATUS_MAP[s]?.label}`);
        } catch { /**/ }
    };

    // ── PDF Export (print to PDF) ──────────────────────────────────────────
    const handleExportPDF = () => {
        if (!editorRef.current) return;
        const pSize = PAGE_SIZES[pageSize] ?? PAGE_SIZES['A4'];
        const isLandscape = pageOrientation === 'landscape';
        const pageCssSize = isLandscape
            ? `${pSize.h}mm ${pSize.w}mm`
            : `${pSize.w}mm ${pSize.h}mm`;
        const letterheadHtml = (showLetterhead && firm?.letterheadUrl)
            ? `<div style="width:100%;margin-bottom:20px;page-break-inside:avoid;">
                <img src="${firm.letterheadUrl}" style="width:100%;max-height:120px;object-fit:contain;" />
               </div>`
            : '';
        const hfFontSize = `${Math.max(10, fontSize - 2)}px`;
        const headerText = headerCols === 1 ? headerContent : headerParts.filter(Boolean).join(' | ');
        const footerText = footerCols === 1 ? footerContent : footerParts.filter(Boolean).join(' | ');
        const headerColsHtml = headerCols > 1
            ? `<div style="display:flex;gap:12px;">${Array.from({length:headerCols}).map((_,i) => `<div style="flex:1;text-align:${['right','center','left'][i]}">${(headerParts[i]||'')}</div>`).join('')}</div>`
            : headerText;
        const footerColsHtml = footerCols > 1
            ? `<div style="display:flex;gap:12px;">${Array.from({length:footerCols}).map((_,i) => `<div style="flex:1;text-align:${['right','center','left'][i]}">${(footerParts[i]||'')}</div>`).join('')}</div>`
            : footerText;
        const headerHtml = showHeader && (headerText || headerCols > 1)
            ? `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:16px;font-size:${hfFontSize};color:#64748b;">${headerColsHtml}</div>`
            : '';
        const footerHtml = showFooter && (footerText || footerCols > 1)
            ? `<div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:16px;font-size:${hfFontSize};color:#64748b;">${footerColsHtml}</div>`
            : '';
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', 'Cairo', sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.9;
      color: #1a1a1a;
      direction: rtl;
      background: white;
    }
    @page { size: ${pageCssSize}; margin: 15mm 20mm; }
    @media print { body { padding: 0; } }
    .page { padding: 15mm 20mm; }
    h1 { font-size: ${fontSize * 1.8}px; font-weight: 700; margin: 16px 0; }
    h2 { font-size: ${fontSize * 1.4}px; font-weight: 700; margin: 14px 0; }
    h3 { font-size: ${fontSize * 1.2}px; font-weight: 600; margin: 12px 0; }
    p  { margin: 8px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    td, th { border: 1px solid #ccc; padding: 8px 12px; text-align: right; }
    th { background: #f0f4f8; font-weight: 700; }
    .var-token { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body>
  <div class="page">
    ${letterheadHtml}
    ${headerHtml}
    ${editorRef.current.innerHTML}
    ${footerHtml}
  </div>
</body>
</html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 600);
    };

    // ── Print ──────────────────────────────────────────────────────────────
    const handlePrint = () => handleExportPDF();

    // ── Restore version ────────────────────────────────────────────────────
    const restoreVersion = async (versionId: string) => {
        try {
            await legalDocumentsApi.restoreVersion(id!, versionId);
            queryClient.invalidateQueries({ queryKey: ['legal-document', id] });
            setShowHistory(false);
            toast.success('تم استعادة الإصدار');
        } catch { toast.error('فشل استعادة الإصدار'); }
    };

    // ── Copy field from panel ──────────────────────────────────────────────
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success('تم النسخ'));
    };

    const insertToEditor = (text: string) => {
        editorRef.current?.focus();
        exec('insertText', text);
        toast.success('تم الإدراج');
    };

    // ── Filtered variables ─────────────────────────────────────────────────
    const filteredVars = VARIABLE_CATEGORIES
        .filter(c => !varActiveCat || c.id === varActiveCat)
        .map(c => ({
            ...c,
            vars: c.vars.filter(v =>
                varQuery === '' ||
                v.label.includes(varQuery) ||
                v.key.includes(varQuery)
            ),
        }))
        .filter(c => c.vars.length > 0);

    // ── Page dimensions for visual display ────────────────────────────────
    const pageDims = (() => {
        const s = PAGE_SIZES[pageSize] ?? PAGE_SIZES['A4'];
        const isLand = pageOrientation === 'landscape';
        return {
            width:  Math.round((isLand ? s.h : s.w) * MM_TO_PX),
            height: Math.round((isLand ? s.w : s.h) * MM_TO_PX),
        };
    })();

    // ── Loading ────────────────────────────────────────────────────────────
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

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden" dir="rtl">
        <style>{`
          /* ── Headings ── */
          .wq-editor h1 { font-size: 2em !important; font-weight: 700 !important; line-height: 1.3 !important; margin: 0.67em 0 !important; display: block !important; }
          .wq-editor h2 { font-size: 1.5em !important; font-weight: 700 !important; line-height: 1.3 !important; margin: 0.75em 0 !important; display: block !important; }
          .wq-editor h3 { font-size: 1.25em !important; font-weight: 600 !important; line-height: 1.4 !important; margin: 0.83em 0 !important; display: block !important; }
          .wq-editor p  { margin: 0.5em 0 !important; }
          /* ── Lists ── */
          .wq-editor ul { list-style-type: disc !important; padding-right: 1.5em !important; margin: 0.5em 0 !important; }
          .wq-editor ol { list-style-type: decimal !important; padding-right: 1.5em !important; margin: 0.5em 0 !important; }
          .wq-editor li { display: list-item !important; }
          /* ── Tables ── */
          .wq-editor td, .wq-editor th { outline: none !important; box-shadow: none !important; }
          .wq-editor table { border-collapse: collapse !important; }
          /* ── Focus / selection ── */
          .wq-editor *:focus { outline: none !important; }
          .wq-editor::selection, .wq-editor *::selection { background: rgba(59,130,246,0.25) !important; }
          /* ── Images ── */
          .wq-editor img { max-width: 100%; height: auto; cursor: default; }
          .wq-editor img:hover { outline: 2px solid #3b82f6; outline-offset: 2px; }
          /* ── Header/footer placeholder ── */
          .hf-editable:empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
          .hf-editable { min-height: 1.4em; }
          .hf-editable:focus { background: rgba(139,92,246,0.04); border-radius: 3px; }
          /* ── Var tokens ── */
          .var-token { color: #1d4ed8; font-weight: 600; background: #dbeafe; padding: 0 2px; border-radius: 3px; white-space: nowrap; }
        `}</style>

            {/* ══════════════ TOP BAR ══════════════ */}
            <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 flex-shrink-0 shadow-sm z-20">
                <button
                    onClick={() => nav('/legal-documents')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>

                {/* Title */}
                <input
                    value={title}
                    onChange={e => { setTitle(e.target.value); setHasUnsaved(true); }}
                    className="flex-1 text-slate-800 font-semibold bg-transparent border-none outline-none placeholder:text-slate-400 text-sm"
                    placeholder="عنوان الوثيقة..."
                />

                {hasUnsaved && (
                    <span className="text-xs text-amber-500 font-medium whitespace-nowrap">● لم يُحفظ</span>
                )}

                {/* Status dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                    >
                        {statusInfo.label}
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border shadow-xl py-1 z-50 min-w-[140px]">
                            {Object.entries(STATUS_MAP).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStatusChange(key)}
                                    className="w-full px-3 py-2 text-right text-xs hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: val.color }} />
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button onClick={() => { setShowHeader(v => !v); setHasUnsaved(true); }} title="رأس الصفحة (هيدر)" className={cn('p-1.5 rounded-lg transition-colors', showHeader ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:bg-slate-100')}><PanelTop className="w-4 h-4" /></button>
                    <button onClick={() => { setShowFooter(v => !v); setHasUnsaved(true); }} title="تذييل الصفحة (فوتر)" className={cn('p-1.5 rounded-lg transition-colors', showFooter ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:bg-slate-100')}><PanelBottom className="w-4 h-4" /></button>
                    <button onClick={() => { setShowLetterhead(v => !v); setHasUnsaved(true); }} title="الهيد ليتر" className={cn('p-1.5 rounded-lg transition-colors', showLetterhead ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-100')}><LayoutTemplate className="w-4 h-4" /></button>
                    <button onClick={() => { setShowSplit(v => !v); setPanelSelected(null); }} title="تقسيم الشاشة" className={cn('p-1.5 rounded-lg transition-colors', showSplit ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100')}><PanelRight className="w-4 h-4" /></button>
                    <button onClick={() => setShowHistory(h => !h)} title="سجل الإصدارات" className={cn('p-1.5 rounded-lg transition-colors', showHistory ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100')}><History className="w-4 h-4" /></button>
                    <button onClick={handlePrint} title="طباعة" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><Printer className="w-4 h-4" /></button>
                    <button onClick={handleExportPDF} title="تصدير PDF" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><FileDown className="w-4 h-4" /></button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold shadow-sm whitespace-nowrap">
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'جاري...' : 'حفظ'}
                    </button>
                </div>
            </div>
            {/* The onMouseDown here fires BEFORE any child control takes focus,
                giving us the last chance to snapshot the editor selection. */}
            <div
                className="bg-white border-b border-slate-100 px-3 py-1 flex items-center gap-0.5 flex-shrink-0 flex-wrap z-10"
                onMouseDown={() => {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && inEditor(sel.anchorNode)) {
                        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
                    }
                }}
            >
                <ToolBtn onClick={() => exec('undo')} title="تراجع"><Undo className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('redo')} title="إعادة"><Redo className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Font family */}
                <select
                    value={fontFamily}
                    onChange={e => {
                        const r = getBestRange();
                        setFontFamily(e.target.value);
                        if (r) { const s = window.getSelection(); try { s?.removeAllRanges(); s?.addRange(r); } catch { /**/ } }
                        window.document.execCommand('fontName', false, e.target.value);
                        setHasUnsaved(true);
                    }}
                    className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-none h-7"
                    title="نوع الخط"
                >
                    {['Arial','Cairo','Tajawal','Amiri','Times New Roman','Courier New','Georgia','Verdana','Tahoma'].map(f =>
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    )}
                </select>
                <Divider />

                {/* Font size */}
                <div className="flex items-center gap-0.5 bg-slate-50 rounded-md px-1 py-0.5 border border-slate-200">
                    <button onMouseDown={e => { e.preventDefault(); applyFontSize(Math.max(10, fontSize - 1)); }} className="p-0.5 rounded hover:bg-slate-200">
                        <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <select
                        value={fontSize}
                        onMouseDown={e => e.stopPropagation()}
                        onChange={e => applyFontSize(Number(e.target.value))}
                        className="text-xs text-slate-600 bg-transparent border-none outline-none w-10 text-center"
                    >
                        {[8,9,10,11,12,13,14,15,16,18,20,22,24,26,28,32,36,40,48,60,72].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button onMouseDown={e => { e.preventDefault(); applyFontSize(Math.min(72, fontSize + 1)); }} className="p-0.5 rounded hover:bg-slate-200">
                        <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                </div>
                <Divider />

                {/* Font color */}
                <div className="relative">
                    <button
                        onMouseDown={e => { e.preventDefault(); setColorPickerTarget(t => t === 'font' ? null : 'font'); }}
                        title="لون الخط"
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex flex-col items-center gap-0.5"
                    >
                        <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                        <span className="w-4 h-1 rounded-full block" style={{ backgroundColor: fontColor }} />
                    </button>
                    {colorPickerTarget === 'font' && (
                        <div className="absolute top-full mt-1 z-50" style={{ right: 0 }}>
                            <ColorGrid
                                currentColor={fontColor}
                                onSelect={c => { const r = getBestRange(); setFontColor(c); if (r) { const s = window.getSelection(); try { s?.removeAllRanges(); s?.addRange(r); } catch { /**/ } } window.document.execCommand('foreColor', false, c); setHasUnsaved(true); setColorPickerTarget(null); }}
                                onReset={() => { const r = getBestRange(); setFontColor('#1a1a1a'); if (r) { const s = window.getSelection(); try { s?.removeAllRanges(); s?.addRange(r); } catch { /**/ } } window.document.execCommand('foreColor', false, '#1a1a1a'); setHasUnsaved(true); setColorPickerTarget(null); }}
                            />
                        </div>
                    )}
                </div>

                {/* Highlight color */}
                <div className="relative">
                    <button
                        onMouseDown={e => { e.preventDefault(); setColorPickerTarget(t => t === 'highlight' ? null : 'highlight'); }}
                        title="تظليل النص"
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <div className="relative">
                            <Highlighter className="w-3.5 h-3.5 text-slate-600" />
                            <span className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full" style={{ backgroundColor: hlColor }} />
                        </div>
                    </button>
                    {colorPickerTarget === 'highlight' && (
                        <div className="absolute top-full mt-1 z-50" style={{ right: 0 }}>
                            <ColorGrid
                                currentColor={hlColor}
                                onSelect={c => { const r = getBestRange(); setHlColor(c); if (r) { const s = window.getSelection(); try { s?.removeAllRanges(); s?.addRange(r); } catch { /**/ } } window.document.execCommand('hiliteColor', false, c); setHasUnsaved(true); setColorPickerTarget(null); }}
                                onReset={() => { const r = getBestRange(); setHlColor('transparent'); if (r) { const s = window.getSelection(); try { s?.removeAllRanges(); s?.addRange(r); } catch { /**/ } } window.document.execCommand('hiliteColor', false, 'transparent'); setHasUnsaved(true); setColorPickerTarget(null); }}
                            />
                        </div>
                    )}
                </div>
                <Divider />

                {/* Headings */}
                <ToolBtn onClick={() => exec('formatBlock', '<h1>')} title="عنوان 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<h2>')} title="عنوان 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<h3>')} title="عنوان 3"><Heading3 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', '<p>')}  title="فقرة"><Type className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Format */}
                <ToolBtn onClick={() => exec('bold')}          title="غامق"><Bold className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('italic')}        title="مائل"><Italic className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('underline')}     title="تسطير"><UnderlineIcon className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('strikeThrough')} title="شطب"><Strikethrough className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Alignment */}
                <ToolBtn onClick={() => exec('justifyRight')}  title="يمين"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyCenter')} title="وسط"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyLeft')}   title="يسار"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('justifyFull')}   title="ضبط"><AlignJustify className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Lists */}
                <ToolBtn onClick={() => exec('insertUnorderedList')} title="قائمة نقطية"><List className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('insertOrderedList')}   title="قائمة مرقمة"><ListOrdered className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Table insert */}
                <ToolBtn
                    onClick={() => {
                        exec('insertHTML', '<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;text-align:right;font-weight:700">العمود 1</th><th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;text-align:right;font-weight:700">العمود 2</th><th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f8fafc;text-align:right;font-weight:700">العمود 3</th></tr><tr><td style="border:1px solid #cbd5e1;padding:8px 12px">&nbsp;</td><td style="border:1px solid #cbd5e1;padding:8px 12px">&nbsp;</td><td style="border:1px solid #cbd5e1;padding:8px 12px">&nbsp;</td></tr></table>');
                    }}
                    title="إدراج جدول"
                >
                    <TableIcon className="w-3.5 h-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => exec('insertHorizontalRule')} title="خط فاصل">
                    <Minus className="w-3.5 h-3.5" />
                </ToolBtn>

                {/* Table row/col controls — show only when cursor is inside a table */}
                {inTable && (
                    <>
                        <Divider />
                        <span className="text-xs text-slate-400 px-1 whitespace-nowrap">الجدول:</span>
                        <ToolBtn onClick={tableAddRowAbove} title="صف أعلى"><span className="text-xs font-bold">↑ صف</span></ToolBtn>
                        <ToolBtn onClick={tableAddRowBelow} title="صف أسفل"><span className="text-xs font-bold">↓ صف</span></ToolBtn>
                        <ToolBtn onClick={tableDeleteRow}   title="حذف الصف">
                            <span className="flex items-center gap-0.5 text-red-500"><Trash2 className="w-3 h-3" /><span className="text-xs">صف</span></span>
                        </ToolBtn>
                        <Divider />
                        <ToolBtn onClick={tableAddColLeft}  title="عمود يمين"><span className="text-xs font-bold">→ عمود</span></ToolBtn>
                        <ToolBtn onClick={tableAddColRight} title="عمود يسار"><span className="text-xs font-bold">← عمود</span></ToolBtn>
                        <ToolBtn onClick={tableDeleteCol}   title="حذف العمود">
                            <span className="flex items-center gap-0.5 text-red-500"><Trash2 className="w-3 h-3" /><span className="text-xs">عمود</span></span>
                        </ToolBtn>
                        <ToolBtn onClick={tableDeleteCell} title="حذف الخلية الحالية">
                            <span className="flex items-center gap-0.5 text-red-500"><Trash2 className="w-3 h-3" /><span className="text-xs">خلية</span></span>
                        </ToolBtn>
                        <Divider />
                        {/* Cell background color */}
                        <div className="relative">
                            <button
                                onMouseDown={e => { e.preventDefault(); setColorPickerTarget(t => t === 'cellBg' ? null : 'cellBg'); }}
                                title="لون خلفية الخلية"
                                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex flex-col items-center gap-0.5"
                            >
                                <Palette className="w-3.5 h-3.5 text-slate-600" />
                                <span className="w-4 h-1 rounded-full block" style={{ backgroundColor: tableCellBgColor }} />
                            </button>
                            {colorPickerTarget === 'cellBg' && (
                                <div className="absolute top-full mt-1 z-50" style={{ right: 0 }}>
                                    <ColorGrid
                                        currentColor={tableCellBgColor}
                                        onSelect={c => { setTableCellBgColor(c); tableSetCellBgColor(c); setColorPickerTarget(null); }}
                                        onReset={() => { setTableCellBgColor(''); tableSetCellBgColor(''); setColorPickerTarget(null); }}
                                    />
                                </div>
                            )}
                        </div>
                        <Divider />
                        {/* Column width */}
                        <div className="flex items-center gap-0.5" title="عرض العمود الحالي">
                            <input
                                type="text"
                                value={tableColWidth}
                                onChange={e => setTableColWidth(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); tableApplyColWidth(tableColWidth); } }}
                                placeholder="عرض"
                                className="w-14 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-none h-7 text-center"
                            />
                            <button
                                onMouseDown={e => { e.preventDefault(); tableApplyColWidth(tableColWidth); }}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 h-7 whitespace-nowrap"
                                title="تطبيق عرض العمود"
                            >✓ عمود</button>
                        </div>
                        {/* Row height */}
                        <div className="flex items-center gap-0.5" title="ارتفاع الصف الحالي">
                            <input
                                type="text"
                                value={tableRowHeight}
                                onChange={e => setTableRowHeight(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); tableApplyRowHeight(tableRowHeight); } }}
                                placeholder="ارتفاع"
                                className="w-14 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-none h-7 text-center"
                            />
                            <button
                                onMouseDown={e => { e.preventDefault(); tableApplyRowHeight(tableRowHeight); }}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 h-7 whitespace-nowrap"
                                title="تطبيق ارتفاع الصف"
                            >✓ صف</button>
                        </div>
                        {/* Equalize columns */}
                        <ToolBtn onClick={tableEqualizeColumns} title="توحيد عرض الأعمدة">
                            <Maximize2 className="w-3.5 h-3.5" />
                        </ToolBtn>
                    </>
                )}
                {/* Page size + orientation */}
                <Divider />
                <select
                    value={pageSize}
                    onChange={e => { setPageSize(e.target.value); setHasUnsaved(true); }}
                    className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-none h-7"
                    title="حجم الصفحة"
                >
                    {Object.keys(PAGE_SIZES).map(s => (
                        <option key={s} value={s}>{PAGE_SIZES[s].label}</option>
                    ))}
                </select>
                <ToolBtn
                    onClick={() => { setPageOrientation(o => o === 'portrait' ? 'landscape' : 'portrait'); setHasUnsaved(true); }}
                    title={pageOrientation === 'portrait' ? 'عامودي — اضغط للأفقي' : 'أفقي — اضغط للعامودي'}
                    active={pageOrientation === 'landscape'}
                >
                    <RotateCw className={cn('w-3.5 h-3.5 transition-transform', pageOrientation === 'landscape' && 'rotate-90')} />
                </ToolBtn>
                <Divider />

                {/* Variable button */}
                <button
                    onMouseDown={e => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setVarMenuPos({ x: rect.left, y: rect.bottom + 6 });
                        setVarQuery('');
                        setVarBraceStart(-1);
                        setVarActiveNode(null);
                        setShowVarMenu(v => !v);
                    }}
                    title="إدراج متغير ({{"
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                    <Braces className="w-3.5 h-3.5" />
                    متغير
                </button>

                {/* Form answers button — only when a case/client is linked */}
                {(linkedCaseId || linkedClientId) && (
                    <button
                        onMouseDown={e => {
                            e.preventDefault();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAnswersMenuPos({ x: rect.left, y: rect.bottom + 6 });
                            setAnswersQuery('');
                            setShowAnswersMenu(v => !v);
                        }}
                        title="إدراج إجابة من نموذج"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                        <ClipboardList className="w-3.5 h-3.5" />
                        إجابة نموذج
                    </button>
                )}
                <Divider />

                {/* Image upload */}
                <label title="إدراج صورة" className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5" />
                    صورة
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImage} />
                </label>

                {/* Word export */}
                <button
                    onMouseDown={e => { e.preventDefault(); handleExportWord(); }}
                    title="تنزيل كملف Word"
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                    <Download className="w-3.5 h-3.5" />
                    Word
                </button>
            </div>

            {/* Close color pickers on outside click */}
            {colorPickerTarget && (
                <div className="fixed inset-0 z-40" onMouseDown={() => setColorPickerTarget(null)} />
            )}


            {/* ══════════════ CONTENT AREA ══════════════ */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* ── Editor ── */}
                <div className="flex-1 overflow-auto bg-slate-100 py-8">
                    {/* Page container — visually simulates selected paper size */}
                    <div
                        className="mx-auto bg-white shadow-xl ring-1 ring-slate-200"
                        style={{ width: `${pageDims.width}px`, minHeight: `${pageDims.height}px` }}
                    >
                        {/* Letterhead */}
                        {showLetterhead && firm?.letterheadUrl && (
                            <div className="w-full border-b border-slate-100 p-0">
                                <img
                                    src={firm.letterheadUrl}
                                    alt="هيد ليتر المكتب"
                                    className="w-full object-contain"
                                    style={{ maxHeight: '130px' }}
                                />
                            </div>
                        )}
                        {showLetterhead && !firm?.letterheadUrl && (
                            <div className="border-b border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                                لم يتم رفع ورقة الهيد ليتر بعد —
                                <Link to={p('/settings')} className="text-blue-500 mr-1 hover:underline">
                                    ارفعها من الإعدادات
                                </Link>
                            </div>
                        )}

                        {/* Header */}
                        {showHeader && (
                            <div className="border-b-2 border-dashed border-violet-300 bg-violet-50/60 px-8 py-3 print:border-b print:border-slate-300">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <PanelTop className="w-3 h-3 text-violet-400" />
                                        <span className="text-[10px] text-violet-400 font-medium">رأس الصفحة</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-400">أعمدة:</span>
                                        {[1,2,3].map(n => (
                                            <button key={n} onMouseDown={e => { e.preventDefault(); setHeaderCols(n); }}
                                                className={cn('w-5 h-5 text-[10px] rounded border transition-colors', headerCols === n ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-300 text-slate-500 hover:bg-slate-100')}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className={cn('gap-3', headerCols > 1 ? 'grid' : 'block')} style={{ gridTemplateColumns: headerCols > 1 ? `repeat(${headerCols}, 1fr)` : undefined }}>
                                    {Array.from({ length: headerCols }).map((_, i) => (
                                        <div
                                            key={i}
                                            ref={headerPartRefs[i]}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={e => {
                                                const html = (e.target as HTMLDivElement).innerHTML;
                                                if (headerCols === 1) { setHeaderContent(html); }
                                                else { const p = [...headerParts]; p[i] = html; setHeaderParts(p); }
                                                setHasUnsaved(true);
                                            }}
                                            data-placeholder={headerCols === 1 ? 'رأس الصفحة...' : ['يمين','وسط','يسار'][i] + '...'}
                                            className="hf-editable w-full bg-transparent outline-none text-sm text-slate-600 text-right border-b border-violet-100 pb-1"
                                            style={{ fontFamily: `'${fontFamily}', Arial, sans-serif`, fontSize: `${Math.max(10, fontSize - 2)}px` }}
                                            dir="rtl"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Editor content */}
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            dir="rtl"
                            lang="ar"
                            className="wq-editor outline-none w-full"
                            style={{
                                fontFamily: `'${fontFamily}', Arial, sans-serif`,
                                fontSize: `${editorFontSize}px`,
                                lineHeight: 1.9,
                                color: '#1a1a1a',
                                direction: 'rtl',
                                textAlign: 'right',
                                padding: '32px 40px',
                                minHeight: `${Math.max(300, pageDims.height - 180)}px`,
                            }}
                        />

                        {/* Footer */}
                        {showFooter && (
                            <div className="border-t-2 border-dashed border-violet-300 bg-violet-50/60 px-8 py-3 print:border-t print:border-slate-300">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <PanelBottom className="w-3 h-3 text-violet-400" />
                                        <span className="text-[10px] text-violet-400 font-medium">تذييل الصفحة</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-400">أعمدة:</span>
                                        {[1,2,3].map(n => (
                                            <button key={n} onMouseDown={e => { e.preventDefault(); setFooterCols(n); }}
                                                className={cn('w-5 h-5 text-[10px] rounded border transition-colors', footerCols === n ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-300 text-slate-500 hover:bg-slate-100')}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className={cn('gap-3', footerCols > 1 ? 'grid' : 'block')} style={{ gridTemplateColumns: footerCols > 1 ? `repeat(${footerCols}, 1fr)` : undefined }}>
                                    {Array.from({ length: footerCols }).map((_, i) => (
                                        <div
                                            key={i}
                                            ref={footerPartRefs[i]}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={e => {
                                                const html = (e.target as HTMLDivElement).innerHTML;
                                                if (footerCols === 1) { setFooterContent(html); }
                                                else { const p = [...footerParts]; p[i] = html; setFooterParts(p); }
                                                setHasUnsaved(true);
                                            }}
                                            data-placeholder={footerCols === 1 ? 'تذييل الصفحة...' : ['يمين','وسط','يسار'][i] + '...'}
                                            className="hf-editable w-full bg-transparent outline-none text-sm text-slate-600 text-right border-b border-violet-100 pb-1"
                                            style={{ fontFamily: `'${fontFamily}', Arial, sans-serif`, fontSize: `${Math.max(10, fontSize - 2)}px` }}
                                            dir="rtl"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Size label below page */}
                    <div className="text-center mt-3 text-[10px] text-slate-400">
                        {PAGE_SIZES[pageSize]?.label} — {pageOrientation === 'portrait' ? 'عامودي' : 'أفقي'}
                    </div>
                </div>

                {/* ── Split Panel ── */}
                {showSplit && (
                    <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50">
                            {PANEL_TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setPanelTab(tab.id as any); setPanelSearch(''); setPanelSelected(null); }}
                                        className={cn(
                                            'flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 transition-colors',
                                            panelTab === tab.id
                                                ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                                                : 'text-slate-500 hover:text-slate-700'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    value={panelSearch}
                                    onChange={e => { setPanelSearch(e.target.value); setPanelSelected(null); }}
                                    placeholder="بحث..."
                                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 text-right"
                                />
                            </div>
                        </div>

                        {/* Panel selected detail */}
                        {panelSelected ? (
                            <div className="flex-1 overflow-auto">
                                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700 truncate flex-1">{panelSelected.title || panelSelected.name}</span>
                                    <button onClick={() => setPanelSelected(null)} className="p-1 rounded hover:bg-slate-100">
                                        <X className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-3 space-y-2">
                                    {Object.entries(panelSelected)
                                        .filter(([k]) => !['id','tenantId','createdAt','updatedAt','deletedAt','isActive','__type'].includes(k))
                                        .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
                                        .map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50">
                                                <span className="text-[10px] text-slate-400 flex-shrink-0">{k}</span>
                                                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                                                    <span className="text-xs text-slate-700 truncate">{String(v)}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(String(v))}
                                                        className="p-0.5 rounded hover:bg-slate-100 flex-shrink-0"
                                                        title="نسخ"
                                                    >
                                                        <Copy className="w-3 h-3 text-slate-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => insertToEditor(String(v))}
                                                        title="إدراج في المحرر"
                                                        className="p-0.5 rounded hover:bg-blue-100 flex-shrink-0"
                                                    >
                                                        <Plus className="w-3 h-3 text-blue-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ) : (
                            /* List */
                            <div className="flex-1 overflow-auto">
                                {panelTab === 'documents' && docs.map((d: any) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setPanelSelected({ ...d, __type: 'doc' })}
                                        className="w-full text-right px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                                    >
                                        <p className="text-xs font-medium text-slate-700 truncate">{d.title}</p>
                                        <p className="text-[10px] text-slate-400">{STATUS_MAP[d.status]?.label}</p>
                                    </button>
                                ))}
                                {panelTab === 'clients' && clients.map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setPanelSelected({ ...c, __type: 'client' })}
                                        className="w-full text-right px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                                    >
                                        <p className="text-xs font-medium text-slate-700 truncate">{c.name}</p>
                                        <p className="text-[10px] text-slate-400">{c.phone || c.email}</p>
                                    </button>
                                ))}
                                {panelTab === 'cases' && cases.map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setPanelSelected({ ...c, __type: 'case' })}
                                        className="w-full text-right px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                                    >
                                        <p className="text-xs font-medium text-slate-700 truncate">{c.title}</p>
                                        <p className="text-[10px] text-slate-400">{c.caseNumber}</p>
                                    </button>
                                ))}
                                {((panelTab === 'documents' && !docs.length) ||
                                  (panelTab === 'clients' && !clients.length) ||
                                  (panelTab === 'cases' && !cases.length)) && (
                                    <div className="text-center py-10 text-slate-400 text-xs">لا توجد نتائج</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── History Sidebar ── */}
                {showHistory && (
                    <div className="w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-400" />
                                سجل الإصدارات
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 rounded hover:bg-slate-100">
                                <X className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-2">
                            {!docRecord?.versions?.length ? (
                                <div className="text-center py-10 text-slate-400 text-xs">لا توجد إصدارات سابقة</div>
                            ) : (
                                docRecord.versions.map((v: any) => (
                                    <div key={v.id} className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all mb-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-slate-800">v{v.version}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(v.createdAt).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">{v.user?.name}</p>
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

            {/* ══════════════ VARIABLE MENU (floating) ══════════════ */}
            {showVarMenu && (
                <div
                    ref={varMenuRef}
                    className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                    style={{ top: varMenuPos.y, left: varMenuPos.x, width: '280px', maxHeight: '360px' }}
                >
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                            type="text"
                            value={varQuery}
                            onChange={e => setVarQuery(e.target.value)}
                            placeholder="بحث في المتغيرات..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 text-right"
                            autoFocus
                        />
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-0.5 px-2 py-1.5 border-b border-slate-100 overflow-x-auto">
                        {[{ id: null, label: 'الكل' }, ...VARIABLE_CATEGORIES.map(c => ({ id: c.id, label: c.label }))].map(t => (
                            <button
                                key={String(t.id)}
                                onMouseDown={e => { e.preventDefault(); setVarActiveCat(t.id); }}
                                className={cn(
                                    'px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap transition-colors flex-shrink-0',
                                    varActiveCat === t.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:bg-slate-100'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Variables */}
                    <div className="overflow-y-auto max-h-60">
                        {filteredVars.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs">لا توجد نتائج</div>
                        ) : (
                            filteredVars.map(cat => (
                                <div key={cat.id}>
                                    <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 bg-slate-50 sticky top-0">
                                        {cat.icon} {cat.label}
                                    </div>
                                    {cat.vars.map(v => (
                                        <button
                                            key={v.key}
                                            onMouseDown={e => { e.preventDefault(); insertVariable(v.key); }}
                                            className="w-full text-right px-4 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between"
                                        >
                                            <span className="text-slate-700">{v.label}</span>
                                            <code className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{`{{${v.key}}}`}</code>
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════ FORM ANSWERS MENU (floating) ══════════════ */}
            {showAnswersMenu && (
                <>
                    <div className="fixed inset-0 z-40" onMouseDown={() => setShowAnswersMenu(false)} />
                    <div
                        className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
                        style={{ top: answersMenuPos.y, left: answersMenuPos.x, width: '340px', maxHeight: '440px' }}
                    >
                        <div className="p-2 border-b border-slate-100 bg-purple-50 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-800 flex-1">إجابات النماذج المرتبطة</span>
                            <button
                                onMouseDown={e => { e.preventDefault(); setShowAnswersMenu(false); }}
                                className="p-0.5 rounded hover:bg-purple-100 text-purple-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <input
                                type="text"
                                value={answersQuery}
                                onChange={e => setAnswersQuery(e.target.value)}
                                placeholder="بحث في الإجابات..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 text-right"
                                autoFocus
                            />
                        </div>

                        {/* Answers list grouped by submission */}
                        <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                            {(() => {
                                const q = answersQuery.trim();
                                const groups = editorAnswers
                                    .map((sub: any) => ({
                                        ...sub,
                                        answers: (sub.answers || []).filter((a: any) => {
                                            if (!q) return true;
                                            const val = a.value == null ? '' : String(a.value);
                                            return (a.label || '').includes(q) || val.includes(q);
                                        }),
                                    }))
                                    .filter((sub: any) => sub.answers.length > 0);

                                if (groups.length === 0) {
                                    return (
                                        <div className="text-center py-8 px-4 text-slate-400 text-xs">
                                            {editorAnswers.length === 0
                                                ? 'لا توجد إجابات نماذج مرتبطة بهذا المستند'
                                                : 'لا توجد نتائج مطابقة'}
                                        </div>
                                    );
                                }

                                return groups.map((sub: any) => (
                                    <div key={sub.id}>
                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50 sticky top-0 border-y border-slate-100 flex items-center justify-between">
                                            <span className="truncate">{sub.form?.title || 'نموذج'}</span>
                                            <span className="text-slate-400 font-mono ml-2 flex-shrink-0">{sub.code}</span>
                                        </div>
                                        {sub.answers.map((a: any) => {
                                            let display: string;
                                            if (a.value == null) display = '—';
                                            else if (typeof a.value === 'boolean') display = a.value ? 'نعم' : 'لا';
                                            else if (a.value instanceof Date) display = new Date(a.value).toLocaleDateString('ar-SA');
                                            else if (typeof a.value === 'object') display = JSON.stringify(a.value);
                                            else display = String(a.value);

                                            return (
                                                <button
                                                    key={a.id}
                                                    onMouseDown={e => {
                                                        e.preventDefault();
                                                        insertToEditor(display === '—' ? '' : display);
                                                        setShowAnswersMenu(false);
                                                    }}
                                                    className="w-full text-right px-4 py-2 text-xs hover:bg-purple-50 hover:text-purple-700 transition-colors border-b border-slate-50"
                                                    title="اضغط لإدراج القيمة"
                                                >
                                                    <div className="text-slate-500 text-[10px] mb-0.5">{a.label}</div>
                                                    <div className="text-slate-800 font-medium truncate">{display}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

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
    Maximize2,
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import { firmApi } from '@/api/settings.api';
import { clientsApi } from '@/api/clients.api';
import { casesApi } from '@/api/cases.api';
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
    const [fontSize, setFontSize]           = useState(14);
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

    const editorRef          = useRef<HTMLDivElement>(null);
    const autoSaveRef        = useRef<ReturnType<typeof setInterval>>();
    const varMenuRef         = useRef<HTMLDivElement>(null);
    const fontColorRef       = useRef<HTMLInputElement>(null);
    const highlightColorRef  = useRef<HTMLInputElement>(null);
    const tableCellBgRef     = useRef<HTMLInputElement>(null);

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

    // ── Initialize content ─────────────────────────────────────────────────
    useEffect(() => {
        if (docRecord) {
            setTitle(docRecord.title ?? '');
            setStatus(docRecord.status ?? 'DRAFT');
            const settings = docRecord.settings as any;
            if (settings?.fontSize) setFontSize(settings.fontSize);
            if (settings?.showLetterhead) setShowLetterhead(true);
            if (settings?.pageSize) setPageSize(settings.pageSize);
            if (settings?.pageOrientation) setPageOrientation(settings.pageOrientation);
            if (settings?.showHeader) setShowHeader(true);
            if (settings?.headerContent) setHeaderContent(settings.headerContent);
            if (settings?.showFooter) setShowFooter(true);
            if (settings?.footerContent) setFooterContent(settings.footerContent);
        }
    }, [docRecord]);

    useEffect(() => {
        if (editorRef.current && docRecord?.content && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = docRecord.content;
        }
    }, [docRecord?.content]);

    // ── Save mutation ──────────────────────────────────────────────────────
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
                status,
                settings: { fontSize, showLetterhead, pageSize, pageOrientation, showHeader, headerContent, showFooter, footerContent },
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
                        settings: { fontSize, showLetterhead, pageSize, pageOrientation, showHeader, headerContent, showFooter, footerContent },
                    });
                } catch { /* silent */ }
            }
        }, 30000);
        return () => clearInterval(autoSaveRef.current);
    }, [hasUnsaved, title, fontSize, showLetterhead, pageSize, pageOrientation, showHeader, headerContent, showFooter, footerContent]);

    // Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [title, hasUnsaved]);

    // ── Editor commands ────────────────────────────────────────────────────
    const exec = (cmd: string, val?: string) => {
        window.document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        setHasUnsaved(true);
    };

    // ── Track table context on selection change ────────────────────────────
    useEffect(() => {
        const onSel = () => {
            const sel = window.getSelection();
            if (!sel?.rangeCount) { setInTable(false); return; }
            let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
            if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
            let el = node as Element | null;
            let found = false;
            while (el && editorRef.current?.contains(el)) {
                if (el.tagName === 'TD' || el.tagName === 'TH') { found = true; break; }
                el = el.parentElement;
            }
            setInTable(found);
        };
        window.document.addEventListener('selectionchange', onSel);
        return () => window.document.removeEventListener('selectionchange', onSel);
    }, []);

    // ── Table context ──────────────────────────────────────────────────────
    const getTableCtx = () => {
        const sel = window.getSelection();
        if (!sel?.rangeCount) return null;
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
        let cell = node as Element | null;
        while (cell && cell !== editorRef.current) {
            if (cell.tagName === 'TD' || cell.tagName === 'TH') break;
            cell = cell.parentElement;
        }
        if (!cell || (cell.tagName !== 'TD' && cell.tagName !== 'TH')) return null;
        const row   = cell.parentElement as HTMLTableRowElement;
        const table = row.closest('table') as HTMLTableElement;
        return { cell: cell as HTMLTableCellElement, row, table, ci: (cell as HTMLTableCellElement).cellIndex, ri: row.rowIndex };
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
        const headerHtml = showHeader && headerContent
            ? `<div style="border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:16px;font-size:${Math.max(10, fontSize - 2)}px;color:#64748b;">${headerContent}</div>`
            : '';
        const footerHtml = showFooter && footerContent
            ? `<div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:16px;font-size:${Math.max(10, fontSize - 2)}px;color:#64748b;">${footerContent}</div>`
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
    h1 { font-size: 20px; font-weight: 700; text-align: center; margin: 16px 0; }
    h2 { font-size: 17px; font-weight: 700; margin: 14px 0; }
    h3 { font-size: 15px; font-weight: 600; color: #1a3a5c; margin: 12px 0; }
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
            <div className="bg-white border-b border-slate-100 px-3 py-1 flex items-center gap-0.5 flex-shrink-0 flex-wrap z-10">
                <ToolBtn onClick={() => exec('undo')} title="تراجع"><Undo className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('redo')} title="إعادة"><Redo className="w-3.5 h-3.5" /></ToolBtn>
                <Divider />

                {/* Font family */}
                <select
                    value={fontFamily}
                    onChange={e => {
                        setFontFamily(e.target.value);
                        editorRef.current?.focus();
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
                    <button onMouseDown={e => { e.preventDefault(); setFontSize(s => Math.max(10, s - 1)); }} className="p-0.5 rounded hover:bg-slate-200">
                        <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <select
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="text-xs text-slate-600 bg-transparent border-none outline-none w-10 text-center"
                    >
                        {[10,11,12,13,14,15,16,18,20,22,24,28,32,36].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <button onMouseDown={e => { e.preventDefault(); setFontSize(s => Math.min(48, s + 1)); }} className="p-0.5 rounded hover:bg-slate-200">
                        <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                </div>
                <Divider />

                {/* Font color */}
                <div className="relative" title="لون الخط">
                    <button
                        onMouseDown={e => { e.preventDefault(); fontColorRef.current?.click(); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex flex-col items-center gap-0.5"
                    >
                        <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                        <span className="w-4 h-1 rounded-full block" style={{ backgroundColor: fontColor }} />
                    </button>
                    <input
                        ref={fontColorRef}
                        type="color"
                        value={fontColor}
                        onChange={e => {
                            setFontColor(e.target.value);
                            editorRef.current?.focus();
                            window.document.execCommand('foreColor', false, e.target.value);
                            setHasUnsaved(true);
                        }}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                    />
                </div>

                {/* Highlight color */}
                <div className="relative" title="تظليل">
                    <button
                        onMouseDown={e => { e.preventDefault(); highlightColorRef.current?.click(); }}
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <div className="relative">
                            <Highlighter className="w-3.5 h-3.5 text-slate-600" />
                            <span className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full" style={{ backgroundColor: hlColor }} />
                        </div>
                    </button>
                    <input
                        ref={highlightColorRef}
                        type="color"
                        value={hlColor}
                        onChange={e => {
                            setHlColor(e.target.value);
                            editorRef.current?.focus();
                            window.document.execCommand('hiliteColor', false, e.target.value);
                            setHasUnsaved(true);
                        }}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                    />
                </div>
                <Divider />

                {/* Headings */}
                <ToolBtn onClick={() => exec('formatBlock', 'h1')} title="عنوان 1"><Heading1 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', 'h2')} title="عنوان 2"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', 'h3')} title="عنوان 3"><Heading3 className="w-3.5 h-3.5" /></ToolBtn>
                <ToolBtn onClick={() => exec('formatBlock', 'p')}  title="فقرة"><Type className="w-3.5 h-3.5" /></ToolBtn>
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
                        <Divider />
                        {/* Cell background color */}
                        <div className="relative" title="لون خلفية الخلية">
                            <button
                                onMouseDown={e => { e.preventDefault(); tableCellBgRef.current?.click(); }}
                                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors flex flex-col items-center gap-0.5"
                            >
                                <Palette className="w-3.5 h-3.5 text-slate-600" />
                                <span className="w-4 h-1 rounded-full block" style={{ backgroundColor: tableCellBgColor }} />
                            </button>
                            <input
                                ref={tableCellBgRef}
                                type="color"
                                value={tableCellBgColor}
                                onChange={e => {
                                    setTableCellBgColor(e.target.value);
                                    tableSetCellBgColor(e.target.value);
                                }}
                                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            />
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
                <Divider />

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
            </div>


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
                            <div className="border-b border-dashed border-violet-200 bg-violet-50/40 px-10 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <PanelTop className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                    <span className="text-[10px] text-violet-400 font-medium">رأس الصفحة</span>
                                </div>
                                <input
                                    type="text"
                                    value={headerContent}
                                    onChange={e => { setHeaderContent(e.target.value); setHasUnsaved(true); }}
                                    placeholder="اكتب نص رأس الصفحة هنا..."
                                    className="w-full bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-300 text-right"
                                    style={{ fontFamily: `'${fontFamily}', Arial, sans-serif`, fontSize: `${Math.max(10, fontSize - 2)}px` }}
                                    dir="rtl"
                                />
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
                            className="outline-none w-full"
                            style={{
                                fontFamily: `'${fontFamily}', Arial, sans-serif`,
                                fontSize: `${fontSize}px`,
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
                            <div className="border-t border-dashed border-violet-200 bg-violet-50/40 px-10 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <PanelBottom className="w-3 h-3 text-violet-400 flex-shrink-0" />
                                    <span className="text-[10px] text-violet-400 font-medium">تذييل الصفحة</span>
                                </div>
                                <input
                                    type="text"
                                    value={footerContent}
                                    onChange={e => { setFooterContent(e.target.value); setHasUnsaved(true); }}
                                    placeholder="اكتب نص تذييل الصفحة هنا..."
                                    className="w-full bg-transparent outline-none text-sm text-slate-600 placeholder:text-slate-300 text-right"
                                    style={{ fontFamily: `'${fontFamily}', Arial, sans-serif`, fontSize: `${Math.max(10, fontSize - 2)}px` }}
                                    dir="rtl"
                                />
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
        </div>
    );
}

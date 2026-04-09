import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { legalLibraryApi } from '@/api/legalLibrary';
import { useAddBookmark, useFolders } from '@/hooks/useLegalLibrary';
import {
    Search, Sparkles, BookOpen, Scale, FileText,
    ArrowLeft, Clock, Zap, Brain, ChevronDown,
    ExternalLink, Copy, CheckCircle, AlertCircle,
    MessageSquare, Loader2, Send, BarChart3, Bookmark,
    Calendar, Hash, FolderOpen,
    Tag, X, ChevronRight, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import toast from 'react-hot-toast';

type SearchMode = 'keyword' | 'ai';

interface Citation {
    type: string;
    articleId: string;
    articleNumber: string;
    articleTitle?: string;
    regulationTitle?: string;
    regulationId?: string;
}

interface TextSelectionPopup {
    text: string;
    x: number;
    y: number;
    sourceRef?: { type: string; id?: string; title?: string };
}

// ── TEXT SELECTION → SAVE BOOKMARK POPUP ──────────
function SaveTextPopup({
    popup,
    onSave,
    onClose,
    folders,
}: {
    popup: TextSelectionPopup;
    onSave: (text: string, folderId?: string, note?: string) => void;
    onClose: () => void;
    folders: any[];
}) {
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [note, setNote] = useState('');
    const [showFolders, setShowFolders] = useState(false);

    return (
        <div style={{
            position: 'fixed', top: popup.y, left: popup.x,
            zIndex: 9999, minWidth: '260px',
            background: '#1e1e3f', border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '12px', padding: '1rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: '#c7d2fe', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bookmark size={14} /> حفظ كمفضلة
                </span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                    <X size={14} />
                </button>
            </div>

            {/* Text preview */}
            <div style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '8px', padding: '0.5rem 0.75rem',
                color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: '1.5',
                marginBottom: '0.75rem', maxHeight: '80px', overflow: 'hidden',
                direction: 'rtl',
            }}>
                "{popup.text.substring(0, 150)}{popup.text.length > 150 ? '...' : ''}"
            </div>

            {/* Folder picker */}
            <div style={{ marginBottom: '0.5rem' }}>
                <button
                    onClick={() => setShowFolders(!showFolders)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px', padding: '6px 10px', color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer', fontSize: '0.8rem', direction: 'rtl',
                    }}
                >
                    <FolderOpen size={13} />
                    {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'اختر مجلداً (اختياري)'}
                    <ChevronDown size={12} style={{ marginRight: 'auto', transform: showFolders ? 'rotate(180deg)' : '' }} />
                </button>
                {showFolders && (
                    <div style={{ background: '#1e1e3f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '120px', overflow: 'auto' }}>
                        <button
                            onClick={() => { setSelectedFolder(''); setShowFolders(false); }}
                            style={{ width: '100%', padding: '6px 10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'right' }}
                        >
                            بدون مجلد
                        </button>
                        {folders.map(f => (
                            <button
                                key={f.id}
                                onClick={() => { setSelectedFolder(f.id); setShowFolders(false); }}
                                style={{
                                    width: '100%', padding: '6px 10px', background: selectedFolder === f.id ? 'rgba(99,102,241,0.15)' : 'none',
                                    border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '0.8rem',
                                    textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px', direction: 'rtl',
                                }}
                            >
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: f.color || '#6b7280', flexShrink: 0 }} />
                                {f.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Note */}
            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="ملاحظة (اختياري)..."
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                    padding: '6px 10px', color: 'white', fontSize: '0.8rem',
                    outline: 'none', marginBottom: '0.75rem', direction: 'rtl', boxSizing: 'border-box',
                }}
            />

            <button
                onClick={() => { onSave(popup.text, selectedFolder || undefined, note || undefined); onClose(); }}
                style={{
                    width: '100%', padding: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: '8px', color: 'white',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                }}
            >
                حفظ في المفضلة
            </button>
        </div>
    );
}

export default function LegalAISearchPage() {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<SearchMode>('ai');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [textPopup, setTextPopup] = useState<TextSelectionPopup | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const { p } = useSlugPath();

    const addBookmark = useAddBookmark();
    const { data: folders = [] } = useFolders();

    // AI Search mutation
    const aiMutation = useMutation({
        mutationFn: (q: string) => legalLibraryApi.aiSearch(q),
        onSuccess: () => {
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
    });

    // Keyword search mutation
    const searchMutation = useMutation({
        mutationFn: (q: string) => legalLibraryApi.globalSearch(q),
    });

    // AI usage
    const { data: usageData } = useQuery({
        queryKey: ['ai-usage'],
        queryFn: () => legalLibraryApi.getAIUsage(),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (mode === 'ai') {
            aiMutation.mutate(query.trim());
        } else {
            searchMutation.mutate(query.trim());
        }
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        setMode('ai');
        aiMutation.mutate(example);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Text selection handler — shows save popup
    const handleTextSelection = useCallback((_e: MouseEvent) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim() || sel.toString().trim().length < 10) {
            setTextPopup(null);
            return;
        }
        const text = sel.toString().trim();
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Position popup above selection, centered
        const x = Math.min(rect.left + rect.width / 2 - 130, window.innerWidth - 280);
        const y = rect.top + window.scrollY - 10;
        setTextPopup({ text, x: Math.max(10, x), y: Math.max(10, y) });
    }, []);

    useEffect(() => {
        searchInputRef.current?.focus();
        document.addEventListener('mouseup', handleTextSelection);
        return () => document.removeEventListener('mouseup', handleTextSelection);
    }, [handleTextSelection]);

    const handleSaveTextBookmark = (text: string, folderId?: string, note?: string) => {
        addBookmark.mutate({
            type: 'TEXT',
            highlightedText: text,
            notes: note,
            folderId,
        }, {
            onSuccess: () => toast.success('تم حفظ النص في المفضلة'),
            onError: () => toast.error('حدث خطأ أثناء الحفظ'),
        });
        window.getSelection()?.removeAllRanges();
        setTextPopup(null);
    };

    const isLoading = aiMutation.isPending || searchMutation.isPending;

    const exampleQueries = [
        'ما هي حقوق العامل في حالة الفصل التعسفي؟',
        'شروط رفع دعوى تجارية',
        'حق الحضانة في النظام السعودي',
        'إجراءات تسجيل العلامة التجارية',
        'مدة الاستئناف في القضايا الجزائية',
        'حقوق المستأجر في عقد الإيجار',
    ];

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1b2a 100%)' }}>
            {/* Text Selection Popup */}
            {textPopup && (
                <SaveTextPopup
                    popup={textPopup}
                    onSave={handleSaveTextBookmark}
                    onClose={() => { setTextPopup(null); window.getSelection()?.removeAllRanges(); }}
                    folders={folders}
                />
            )}

            {/* ── HERO Section ─────────────────────────── */}
            <div style={{ padding: '2rem 1.5rem 0' }}>
                {/* Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto 2rem' }}>
                    <Link to={p('/legal-library')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} />
                        المكتبة القانونية
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Link to={p('/legal-library/bookmarks')} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '20px', padding: '5px 12px', color: '#c7d2fe',
                            textDecoration: 'none', fontSize: '0.8rem',
                        }}>
                            <Bookmark size={13} /> المفضلة
                        </Link>
                        {usageData?.quota && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '6px 14px',
                                fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <BarChart3 size={14} />
                                {usageData.quota.remaining}/{usageData.quota.monthly} سؤال متبقي
                            </div>
                        )}
                    </div>
                </div>

                {/* Hero Content */}
                <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 40px rgba(99,102,241,0.3)',
                    }}>
                        <Brain size={32} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: '800', color: 'white',
                        marginBottom: '0.75rem', letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        البحث القانوني الذكي
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: '1.6' }}>
                        اسأل أي سؤال قانوني واحصل على إجابة مع تفاصيل كل مصدر — حدد أي نص لحفظه كمفضلة
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{ maxWidth: '700px', margin: '0 auto 1.5rem' }}>
                    <div style={{
                        position: 'relative', background: 'rgba(255,255,255,0.07)',
                        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
                            <div style={{ padding: '0 12px', color: 'rgba(255,255,255,0.35)' }}>
                                {mode === 'ai' ? <Sparkles size={20} /> : <Search size={20} />}
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={mode === 'ai' ? 'اسأل سؤالك القانوني...' : 'ابحث بالكلمات المفتاحية...'}
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    background: 'transparent', color: 'white',
                                    fontSize: '1rem', padding: '14px 0', direction: 'rtl',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '10px 20px', borderRadius: '12px', border: 'none',
                                    background: isLoading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem', fontWeight: '600',
                                }}
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {isLoading ? 'جاري البحث...' : 'ابحث'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Mode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                    {(['ai', 'keyword'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '8px 18px', borderRadius: '10px', border: '1px solid',
                                background: mode === m
                                    ? (m === 'ai' ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.25)')
                                    : 'rgba(255,255,255,0.05)',
                                color: mode === m
                                    ? (m === 'ai' ? '#a78bfa' : '#6ee7b7')
                                    : 'rgba(255,255,255,0.45)',
                                borderColor: mode === m
                                    ? (m === 'ai' ? 'rgba(99,102,241,0.4)' : 'rgba(16,185,129,0.4)')
                                    : 'transparent',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                            }}
                        >
                            {m === 'ai' ? <><Sparkles size={16} /> سؤال ذكي (AI)</> : <><Search size={16} /> بحث بالكلمات</>}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── RESULTS Section ─────────────────────── */}
            <div ref={resultRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>

                {/* Hint: select text */}
                {(aiMutation.data || searchMutation.data) && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '10px', padding: '8px 14px', marginBottom: '1rem',
                        color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
                    }}>
                        <Tag size={13} style={{ color: '#8b5cf6' }} />
                        تلميح: حدد أي نص من النتائج بالماوس لحفظه كمفضلة
                    </div>
                )}

                {/* AI Answer */}
                {aiMutation.data && mode === 'ai' && (
                    <AIAnswerCard
                        data={aiMutation.data}
                        onCopy={handleCopy}
                        copiedId={copiedId}
                        pathBuilder={p}
                    />
                )}

                {/* AI Error */}
                {aiMutation.error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px', padding: '1.25rem', color: '#fca5a5', marginBottom: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                        <AlertCircle size={20} />
                        {(aiMutation.error as any)?.response?.data?.message || 'حدث خطأ أثناء البحث'}
                    </div>
                )}

                {/* Keyword Results */}
                {searchMutation.data && mode === 'keyword' && (
                    <KeywordResults data={searchMutation.data} pathBuilder={p} />
                )}

                {/* Example Queries */}
                {!aiMutation.data && !searchMutation.data && !isLoading && (
                    <div>
                        <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '1rem', textAlign: 'center' }}>
                            أمثلة للأسئلة
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                            {exampleQueries.map((example, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleExampleClick(example)}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', padding: '1rem', color: 'rgba(255,255,255,0.65)',
                                        cursor: 'pointer', textAlign: 'right', fontSize: '0.9rem', lineHeight: '1.5',
                                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    }}
                                    onMouseOver={e => { (e.currentTarget).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget).style.borderColor = 'rgba(99,102,241,0.3)'; }}
                                    onMouseOut={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                >
                                    <MessageSquare size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#8b5cf6' }} />
                                    {example}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2.5rem' }}>
                            {[
                                { icon: Zap, title: 'بحث ذكي', desc: 'إجابات فورية بالذكاء الاصطناعي', color: '#f59e0b' },
                                { icon: BookOpen, title: 'مراجع مفصّلة', desc: 'مواد قانونية مع تفاصيل كل مصدر', color: '#6366f1' },
                                { icon: Bookmark, title: 'حفظ النصوص', desc: 'حدد أي نص واحفظه في مفضلاتك', color: '#10b981' },
                            ].map((feat, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                    padding: '1.25rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <feat.icon size={24} style={{ color: feat.color, margin: '0 auto 0.75rem' }} />
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem' }}>{feat.title}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{feat.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// AI ANSWER CARD
// ══════════════════════════════════════════════════
function AIAnswerCard({ data, onCopy, copiedId, pathBuilder }: {
    data: any; onCopy: (text: string, id: string) => void;
    copiedId: string | null; pathBuilder: (path: string) => string;
}) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
                borderBottom: '1px solid rgba(99,102,241,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Brain size={16} color="white" />
                    </div>
                    <span style={{ color: '#c7d2fe', fontWeight: '600', fontSize: '0.9rem' }}>إجابة وثيق AI</span>
                    {!data.aiEnabled && (
                        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                            بحث بدون AI
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {data.responseTime && (
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />{(data.responseTime / 1000).toFixed(1)}s
                        </span>
                    )}
                    {data.cached && (
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                            ⚡ مخزن مؤقتاً
                        </span>
                    )}
                    <button
                        onClick={() => onCopy(data.answer, 'answer')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: copiedId === 'answer' ? '#6ee7b7' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                        {copiedId === 'answer' ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copiedId === 'answer' ? 'تم النسخ' : 'نسخ'}
                    </button>
                </div>
            </div>

            {/* Answer Body */}
            <div style={{ padding: '1.5rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', direction: 'rtl' }}>
                    {data.answer}
                </div>

                {/* Confidence Bar */}
                {data.confidence > 0 && (
                    <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>مستوى الثقة</span>
                            <span style={{ color: data.confidence >= 0.7 ? '#6ee7b7' : data.confidence >= 0.4 ? '#fbbf24' : '#fca5a5', fontSize: '0.8rem', fontWeight: '600' }}>
                                {Math.round(data.confidence * 100)}%
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${data.confidence * 100}%`, height: '100%', borderRadius: '4px',
                                background: data.confidence >= 0.7 ? 'linear-gradient(90deg, #10b981, #6ee7b7)' : data.confidence >= 0.4 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #fca5a5)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── DETAILED SOURCES (per regulation / article / precedent) */}
            {data.sources && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.5rem' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> المصادر المفصّلة
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Regulation Articles */}
                        {data.sources.articles?.map((art: any, i: number) => (
                            <SourceCard
                                key={`art-${i}`}
                                type="article"
                                title={`مادة ${art.number}${art.title ? ` — ${art.title}` : ''}`}
                                sourceTitle={art.regulation?.title || art.regulationTitle}
                                meta={[
                                    art.regulation?.issuedBy ? { icon: <Building2 size={11} />, label: art.regulation.issuedBy } : null,
                                    art.chapter ? { icon: <Hash size={11} />, label: `الباب: ${art.chapter}` } : null,
                                    art.section ? { icon: <ChevronRight size={11} />, label: `الفصل: ${art.section}` } : null,
                                ].filter(Boolean) as any[]}
                                content={art.content}
                                link={art.regulation?.id ? pathBuilder(`/legal-library/regulations/${art.regulation.id}`) : undefined}
                                color="#6366f1"
                            />
                        ))}
                        {/* Regulations */}
                        {data.sources.regulations?.map((reg: any, i: number) => (
                            <SourceCard
                                key={`reg-${i}`}
                                type="regulation"
                                title={reg.title}
                                meta={[
                                    reg.number ? { icon: <Hash size={11} />, label: `رقم ${reg.number}` } : null,
                                    reg.issuedBy ? { icon: <Building2 size={11} />, label: reg.issuedBy } : null,
                                    reg.issuedDate ? { icon: <Calendar size={11} />, label: new Date(reg.issuedDate).toLocaleDateString('ar-SA') } : null,
                                ].filter(Boolean) as any[]}
                                content={reg.description}
                                link={pathBuilder(`/legal-library/regulations/${reg.id}`)}
                                color="#8b5cf6"
                            />
                        ))}
                        {/* Precedents */}
                        {data.sources.precedents?.map((prec: any, i: number) => (
                            <SourceCard
                                key={`prec-${i}`}
                                type="precedent"
                                title={`${prec.court} — ${prec.caseType || ''}`}
                                meta={[
                                    prec.circuit ? { icon: <Building2 size={11} />, label: prec.circuit } : null,
                                    prec.judgmentDate ? { icon: <Calendar size={11} />, label: new Date(prec.judgmentDate).toLocaleDateString('ar-SA') } : null,
                                    prec.outcome ? { icon: <Scale size={11} />, label: prec.outcome } : null,
                                ].filter(Boolean) as any[]}
                                content={prec.legalPrinciple || prec.summary}
                                link={pathBuilder(`/legal-library/precedents/${prec.id}`)}
                                color="#10b981"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Citations chips */}
            {data.citations?.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.5rem' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem' }}>📎 المراجع</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {data.citations.map((cit: Citation, i: number) => (
                            <Link key={i} to={pathBuilder(`/legal-library/regulations/${cit.regulationId}`)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '8px', padding: '5px 10px', color: '#c7d2fe', fontSize: '0.78rem',
                                textDecoration: 'none',
                            }}>
                                <FileText size={12} />
                                المادة {cit.articleNumber} — {cit.regulationTitle}
                                <ExternalLink size={11} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── SOURCE CARD (per result item) ─────────────────
function SourceCard({ type, title, sourceTitle, meta, content, link, color }: {
    type: 'article' | 'regulation' | 'precedent';
    title: string;
    sourceTitle?: string;
    meta: { icon: React.ReactNode; label: string }[];
    content?: string;
    link?: string;
    color: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const typeLabels = { article: 'مادة', regulation: 'نظام', precedent: 'حكم' };
    const typeIcons = { article: <FileText size={13} />, regulation: <BookOpen size={13} />, precedent: <Scale size={13} /> };

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`,
            borderRadius: '10px', overflow: 'hidden',
        }}>
            <div style={{ padding: '0.75rem 1rem' }}>
                {/* Type badge + title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '0.4rem' }}>
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: `${color}20`, color, borderRadius: '6px',
                        padding: '2px 8px', fontSize: '0.72rem', fontWeight: '600', flexShrink: 0,
                    }}>
                        {typeIcons[type]} {typeLabels[type]}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', fontWeight: '600', direction: 'rtl', lineHeight: '1.4' }}>
                        {title}
                    </span>
                </div>

                {/* Source name */}
                {sourceTitle && (
                    <div style={{ color: color, fontSize: '0.78rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px', direction: 'rtl' }}>
                        <BookOpen size={11} /> {sourceTitle}
                    </div>
                )}

                {/* Meta */}
                {meta.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: content ? '0.5rem' : 0 }}>
                        {meta.map((m, i) => (
                            <span key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '3px',
                                color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem',
                            }}>
                                {m.icon}{m.label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content preview + expand */}
                {content && (
                    <>
                        <div style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: '1.6',
                            direction: 'rtl', maxHeight: expanded ? 'none' : '3.5em',
                            overflow: 'hidden', whiteSpace: 'pre-wrap',
                        }}>
                            {content}
                        </div>
                        {content.length > 120 && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                style={{ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.75rem', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                                <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : '' }} />
                                {expanded ? 'عرض أقل' : 'عرض المزيد'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Footer: link */}
            {link && (
                <div style={{ borderTop: `1px solid ${color}20`, padding: '0.4rem 1rem' }}>
                    <Link to={link} style={{ color, fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={11} /> عرض التفاصيل الكاملة
                    </Link>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// KEYWORD RESULTS
// ══════════════════════════════════════════════════
function KeywordResults({ data, pathBuilder }: { data: any; pathBuilder: (path: string) => string }) {
    const hasResults = data.regulations?.length || data.precedents?.length || data.terms?.length;
    if (!hasResults) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>لم يتم العثور على نتائج</p>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.regulations?.length > 0 && (
                <ResultSection
                    title="الأنظمة واللوائح" icon={<BookOpen size={18} />} color="#6366f1"
                    items={data.regulations.map((r: any) => ({
                        id: r.id, title: r.title,
                        subtitle: [r.issuedBy, r.number ? `رقم ${r.number}` : null, r.category].filter(Boolean).join(' · '),
                        badge: r.status, link: pathBuilder(`/legal-library/regulations/${r.id}`),
                        date: r.issuedDate,
                    }))}
                />
            )}
            {data.precedents?.length > 0 && (
                <ResultSection
                    title="السوابق القضائية" icon={<Scale size={18} />} color="#10b981"
                    items={data.precedents.map((prec: any) => ({
                        id: prec.id, title: `${prec.court}${prec.caseType ? ` — ${prec.caseType}` : ''}`,
                        subtitle: prec.legalPrinciple || prec.summary?.substring(0, 120),
                        date: prec.judgmentDate, link: pathBuilder(`/legal-library/precedents/${prec.id}`),
                    }))}
                />
            )}
            {data.terms?.length > 0 && (
                <ResultSection
                    title="المصطلحات القانونية" icon={<FileText size={18} />} color="#f59e0b"
                    items={data.terms.map((t: any) => ({
                        id: t.id, title: t.termAr,
                        subtitle: t.definition?.substring(0, 120),
                    }))}
                />
            )}
        </div>
    );
}

function ResultSection({ title, icon, color, items }: {
    title: string; icon: React.ReactNode; color: string;
    items: { id: string; title: string; subtitle?: string; badge?: string; date?: string; link?: string }[];
}) {
    const [expanded, setExpanded] = useState(true);
    const colorRgb = color === '#6366f1' ? '99,102,241' : color === '#10b981' ? '16,185,129' : '245,158,11';

    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.75rem 1rem',
                    background: `rgba(${colorRgb},0.08)`, border: 'none', cursor: 'pointer', color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color }}>{icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{title}</span>
                    <span style={{ background: `rgba(${colorRgb},0.2)`, color, padding: '1px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                        {items.length}
                    </span>
                </div>
                <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.5)', transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
            </button>

            {expanded && (
                <div style={{ padding: '0.5rem' }}>
                    {items.map((item) => (
                        <div key={item.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', transition: 'background 0.15s' }}
                            onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                            {item.link ? (
                                <Link to={item.link} style={{ textDecoration: 'none', display: 'block' }}>
                                    <ResultItemContent item={item} color={color} />
                                </Link>
                            ) : <ResultItemContent item={item} color={color} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ResultItemContent({ item, color }: { item: any; color: string }) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '500', flex: 1, direction: 'rtl' }}>{item.title}</span>
                {item.badge && (
                    <span style={{ background: `${color}20`, color, padding: '1px 7px', borderRadius: '6px', fontSize: '0.7rem', flexShrink: 0 }}>{item.badge}</span>
                )}
                {item.date && (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <Calendar size={10} />{new Date(item.date).toLocaleDateString('ar-SA')}
                    </span>
                )}
            </div>
            {item.subtitle && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: '1.5', direction: 'rtl' }}>{item.subtitle}</div>
            )}
        </>
    );
}

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { legalLibraryApi } from '@/api/legalLibrary';
import {
    Search, Sparkles, BookOpen, Scale, FileText,
    ArrowLeft, Clock, Zap, Brain, ChevronDown,
    ExternalLink, Copy, CheckCircle, AlertCircle,
    MessageSquare, Loader2, Send, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';

type SearchMode = 'keyword' | 'ai';

interface Citation {
    type: string;
    articleId: string;
    articleNumber: string;
    articleTitle?: string;
    regulationTitle?: string;
    regulationId?: string;
}

export default function LegalAISearchPage() {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<SearchMode>('ai');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);
    const { p } = useSlugPath();

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

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

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
            {/* ── HERO Section ─────────────────────────── */}
            <div style={{ padding: '2rem 1.5rem 0' }}>
                {/* Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto 2rem' }}>
                    <Link to={p('/legal-library')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} />
                        المكتبة القانونية
                    </Link>

                    {/* Usage Stats Badge */}
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

                {/* Hero Content */}
                <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                    {/* Logo */}
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
                        اسأل أي سؤال قانوني واحصل على إجابة دقيقة مع المراجع والمواد القانونية
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{ maxWidth: '700px', margin: '0 auto 1.5rem' }}>
                    <div style={{
                        position: 'relative',
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        transition: 'all 0.3s',
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
                                    fontSize: '1rem', padding: '14px 0',
                                    direction: 'rtl',
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
                                    transition: 'all 0.2s',
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
                    <button
                        onClick={() => setMode('ai')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '8px 18px', borderRadius: '10px', border: 'none',
                            background: mode === 'ai' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                            color: mode === 'ai' ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                            transition: 'all 0.2s',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: mode === 'ai' ? 'rgba(99,102,241,0.4)' : 'transparent',
                        }}
                    >
                        <Sparkles size={16} />
                        سؤال ذكي (AI)
                    </button>
                    <button
                        onClick={() => setMode('keyword')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '8px 18px', borderRadius: '10px', border: 'none',
                            background: mode === 'keyword' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)',
                            color: mode === 'keyword' ? '#6ee7b7' : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                            transition: 'all 0.2s',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: mode === 'keyword' ? 'rgba(16,185,129,0.4)' : 'transparent',
                        }}
                    >
                        <Search size={16} />
                        بحث بالكلمات
                    </button>
                </div>
            </div>

            {/* ── RESULTS Section ─────────────────────── */}
            <div ref={resultRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
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
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px', padding: '1.25rem',
                        color: '#fca5a5', marginBottom: '1.5rem',
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

                {/* Example Queries (shown when no results) */}
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
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', padding: '1rem',
                                        color: 'rgba(255,255,255,0.65)',
                                        cursor: 'pointer', textAlign: 'right',
                                        fontSize: '0.9rem', lineHeight: '1.5',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    }}
                                    onMouseOver={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                    }}
                                >
                                    <MessageSquare size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#8b5cf6' }} />
                                    {example}
                                </button>
                            ))}
                        </div>

                        {/* Feature Cards */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                            marginTop: '2.5rem',
                        }}>
                            {[
                                { icon: Zap, title: 'بحث ذكي', desc: 'إجابات فورية بالذكاء الاصطناعي', color: '#f59e0b' },
                                { icon: BookOpen, title: 'مراجع دقيقة', desc: 'مواد قانونية مع أرقام المواد', color: '#6366f1' },
                                { icon: Scale, title: 'سوابق قضائية', desc: 'أحكام ومبادئ قانونية', color: '#10b981' },
                            ].map((feat, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px', padding: '1.25rem',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <feat.icon size={24} style={{ color: feat.color, margin: '0 auto 0.75rem' }} />
                                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                        {feat.title}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                        {feat.desc}
                                    </div>
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

function AIAnswerCard({
    data,
    onCopy,
    copiedId,
    pathBuilder,
}: {
    data: any;
    onCopy: (text: string, id: string) => void;
    copiedId: string | null;
    pathBuilder: (path: string) => string;
}) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '16px', overflow: 'hidden',
            marginBottom: '1.5rem',
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
                    <span style={{ color: '#c7d2fe', fontWeight: '600', fontSize: '0.9rem' }}>
                        إجابة وثيق AI
                    </span>
                    {!data.aiEnabled && (
                        <span style={{
                            background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        }}>
                            بحث بدون AI
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {data.responseTime && (
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {(data.responseTime / 1000).toFixed(1)}s
                        </span>
                    )}
                    {data.cached && (
                        <span style={{
                            background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        }}>
                            ⚡ مخزن مؤقتاً
                        </span>
                    )}
                    <button
                        onClick={() => onCopy(data.answer, 'answer')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: 'none', border: 'none',
                            color: copiedId === 'answer' ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
                            cursor: 'pointer', fontSize: '0.75rem',
                        }}
                    >
                        {copiedId === 'answer' ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copiedId === 'answer' ? 'تم النسخ' : 'نسخ'}
                    </button>
                </div>
            </div>

            {/* Answer Body */}
            <div style={{ padding: '1.5rem' }}>
                <div style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.95rem',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    direction: 'rtl',
                }}>
                    {data.answer}
                </div>

                {/* Confidence Bar */}
                {data.confidence > 0 && (
                    <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                مستوى الثقة
                            </span>
                            <span style={{
                                color: data.confidence >= 0.7 ? '#6ee7b7' : data.confidence >= 0.4 ? '#fbbf24' : '#fca5a5',
                                fontSize: '0.8rem', fontWeight: '600',
                            }}>
                                {Math.round(data.confidence * 100)}%
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${data.confidence * 100}%`,
                                height: '100%',
                                borderRadius: '4px',
                                background: data.confidence >= 0.7
                                    ? 'linear-gradient(90deg, #10b981, #6ee7b7)'
                                    : data.confidence >= 0.4
                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                        : 'linear-gradient(90deg, #ef4444, #fca5a5)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Citations */}
            {data.citations?.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.5rem' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                        📎 المراجع القانونية
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {data.citations.map((cit: Citation, i: number) => (
                            <Link
                                key={i}
                                to={pathBuilder(`/legal-library/regulations/${cit.regulationId}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: '8px', padding: '6px 12px',
                                    color: '#c7d2fe', fontSize: '0.8rem',
                                    textDecoration: 'none', transition: 'all 0.2s',
                                }}
                            >
                                <FileText size={14} />
                                المادة {cit.articleNumber} — {cit.regulationTitle}
                                <ExternalLink size={12} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Source Counts */}
            {data.sources && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 1.5rem', display: 'flex', gap: '1.5rem' }}>
                    {data.sources.articles?.length > 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} /> {data.sources.articles.length} مادة
                        </span>
                    )}
                    {data.sources.precedents?.length > 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Scale size={12} /> {data.sources.precedents.length} سابقة
                        </span>
                    )}
                    {data.sources.regulations?.length > 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BookOpen size={12} /> {data.sources.regulations.length} نظام
                        </span>
                    )}
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
            <div style={{
                textAlign: 'center', padding: '3rem',
                color: 'rgba(255,255,255,0.4)',
            }}>
                <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>لم يتم العثور على نتائج</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Regulations */}
            {data.regulations?.length > 0 && (
                <ResultSection
                    title="الأنظمة واللوائح"
                    icon={<BookOpen size={18} />}
                    color="#6366f1"
                    items={data.regulations.map((r: any) => ({
                        id: r.id,
                        title: r.title,
                        subtitle: r.category,
                        link: pathBuilder(`/legal-library/regulations/${r.id}`),
                    }))}
                />
            )}

            {/* Precedents */}
            {data.precedents?.length > 0 && (
                <ResultSection
                    title="السوابق القضائية"
                    icon={<Scale size={18} />}
                    color="#10b981"
                    items={data.precedents.map((p: any) => ({
                        id: p.id,
                        title: `${p.court} — ${p.caseType}`,
                        subtitle: p.summary?.substring(0, 120) + '...',
                        link: pathBuilder(`/legal-library/precedents/${p.id}`),
                    }))}
                />
            )}

            {/* Terms */}
            {data.terms?.length > 0 && (
                <ResultSection
                    title="المصطلحات القانونية"
                    icon={<FileText size={18} />}
                    color="#f59e0b"
                    items={data.terms.map((t: any) => ({
                        id: t.id,
                        title: t.termAr,
                        subtitle: t.definition?.substring(0, 120) + '...',
                    }))}
                />
            )}
        </div>
    );
}

function ResultSection({
    title,
    icon,
    color,
    items,
}: {
    title: string;
    icon: React.ReactNode;
    color: string;
    items: { id: string; title: string; subtitle?: string; link?: string }[];
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', overflow: 'hidden',
        }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.75rem 1rem',
                    background: `rgba(${color === '#6366f1' ? '99,102,241' : color === '#10b981' ? '16,185,129' : '245,158,11'},0.08)`,
                    border: 'none', cursor: 'pointer', color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color }}>{icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{title}</span>
                    <span style={{
                        background: `rgba(${color === '#6366f1' ? '99,102,241' : color === '#10b981' ? '16,185,129' : '245,158,11'},0.2)`,
                        color, padding: '1px 8px', borderRadius: '10px', fontSize: '0.75rem',
                    }}>
                        {items.length}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                    }}
                />
            </button>

            {expanded && (
                <div style={{ padding: '0.5rem' }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                transition: 'background 0.15s',
                                cursor: item.link ? 'pointer' : 'default',
                            }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                            {item.link ? (
                                <Link to={item.link} style={{ textDecoration: 'none' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                                        {item.title}
                                    </div>
                                    {item.subtitle && (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                                            {item.subtitle}
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <>
                                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                                        {item.title}
                                    </div>
                                    {item.subtitle && (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                                            {item.subtitle}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

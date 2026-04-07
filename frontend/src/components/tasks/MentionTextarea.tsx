import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi, MentionItem } from '@/api/tasks.api';
import {
    AtSign,
    User,
    Briefcase,
    Users,
    Calendar,
    FileText,
    Receipt,
    X,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionTextareaProps {
    value: string;
    onChange: (value: string) => void;
    onMentionsChange: (mentions: MentionItem[]) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    className?: string;
}

type MentionType = 'all' | 'user' | 'case' | 'client' | 'hearing' | 'document' | 'invoice';

const TYPE_TABS: { type: MentionType; label: string; icon: React.ElementType }[] = [
    { type: 'all',      label: 'الكل',     icon: AtSign    },
    { type: 'user',     label: 'أشخاص',    icon: User      },
    { type: 'case',     label: 'قضايا',    icon: Briefcase },
    { type: 'client',   label: 'عملاء',    icon: Users     },
    { type: 'hearing',  label: 'جلسات',    icon: Calendar  },
    { type: 'document', label: 'مستندات',  icon: FileText  },
    { type: 'invoice',  label: 'فواتير',   icon: Receipt   },
];

const TYPE_COLORS: Record<string, string> = {
    user:     'bg-blue-100 text-blue-700',
    case:     'bg-purple-100 text-purple-700',
    client:   'bg-green-100 text-green-700',
    hearing:  'bg-orange-100 text-orange-700',
    document: 'bg-gray-100 text-gray-700',
    invoice:  'bg-rose-100 text-rose-700',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    user:     User,
    case:     Briefcase,
    client:   Users,
    hearing:  Calendar,
    document: FileText,
    invoice:  Receipt,
};

const TYPE_LABELS: Record<string, string> = {
    user:     'مستخدم',
    case:     'قضية',
    client:   'عميل',
    hearing:  'جلسة',
    document: 'مستند',
    invoice:  'فاتورة',
};

export function MentionTextarea({
    value,
    onChange,
    onMentionsChange,
    placeholder,
    rows = 3,
    disabled,
    className,
}: MentionTextareaProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [apiQuery, setApiQuery] = useState('');       // ما يُرسل للـ API
    const [localSearch, setLocalSearch] = useState(''); // بحث داخل الـ dropdown
    const [activeType, setActiveType] = useState<MentionType>('all');
    const [mentionStart, setMentionStart] = useState(-1);
    const [mentionTyped, setMentionTyped] = useState(''); // النص بعد @
    const [mentions, setMentions] = useState<MentionItem[]>([]);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // جلب البيانات من الـ API
    const { data: searchResults, isFetching } = useQuery({
        queryKey: ['mentionables', apiQuery],
        queryFn: () => tasksApi.searchMentionables(apiQuery),
        enabled: showDropdown,
        staleTime: 5000,
    });

    const allResults = searchResults?.data || [];

    // تصفية حسب النوع + البحث المحلي
    const filtered = allResults.filter(item => {
        const matchType = activeType === 'all' || item.type === activeType;
        const matchSearch = localSearch.trim() === '' ||
            item.name.toLowerCase().includes(localSearch.toLowerCase());
        return matchType && matchSearch;
    });

    // كشف @ في النص
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const pos = e.target.selectionStart;
        onChange(text);

        const textBeforeCursor = text.substring(0, pos);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1) {
            const afterAt = textBeforeCursor.substring(lastAt + 1);
            if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
                setMentionStart(lastAt);
                setMentionTyped(afterAt);
                setApiQuery(afterAt); // أرسل للـ API
                setLocalSearch('');   // أعد البحث المحلي
                setShowDropdown(true);
                setActiveType('all');

                if (textareaRef.current) {
                    const rect = textareaRef.current.getBoundingClientRect();
                    setDropdownPos({ top: rect.bottom + 6, left: rect.left });
                }
                return;
            }
        }

        closeDropdown();
    };

    const closeDropdown = () => {
        setShowDropdown(false);
        setMentionStart(-1);
        setMentionTyped('');
        setApiQuery('');
        setLocalSearch('');
    };

    const handleSelect = useCallback((item: MentionItem) => {
        if (mentionStart === -1 || !textareaRef.current) return;

        const before = value.substring(0, mentionStart);
        const after = value.substring(mentionStart + 1 + mentionTyped.length);
        const mentionText = `@${item.name} `;
        const newValue = before + mentionText + after;

        onChange(newValue);

        const updated = [...mentions.filter(m => !(m.id === item.id && m.type === item.type)), item];
        setMentions(updated);
        onMentionsChange(updated);

        closeDropdown();

        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = before.length + mentionText.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    }, [mentionStart, mentionTyped, value, mentions, onChange, onMentionsChange]);

    const removeMention = (id: string, type: string) => {
        const updated = mentions.filter(m => !(m.id === id && m.type === type));
        setMentions(updated);
        onMentionsChange(updated);
    };

    // إغلاق عند الضغط خارج
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                closeDropdown();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // تركيز على حقل البحث عند فتح الـ dropdown
    useEffect(() => {
        if (showDropdown) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [showDropdown]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && showDropdown) {
            closeDropdown();
            e.preventDefault();
        }
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none",
                    "focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
                    className
                )}
            />

            {/* تلميح @ */}
            <div className="flex items-center gap-1 mt-1">
                <AtSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">اكتب @ للإشارة إلى شخص، قضية، عميل، جلسة...</span>
            </div>

            {/* Chips للمنشنات المحددة */}
            {mentions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {mentions.map(m => {
                        const Icon = TYPE_ICONS[m.type] || AtSign;
                        return (
                            <span
                                key={`${m.type}-${m.id}`}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                    TYPE_COLORS[m.type] || 'bg-primary/10 text-primary'
                                )}
                            >
                                <Icon className="w-3 h-3" />
                                {m.name}
                                <button
                                    type="button"
                                    onClick={() => removeMention(m.id, m.type)}
                                    className="hover:opacity-60 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="fixed z-50 bg-popover border rounded-xl shadow-2xl overflow-hidden"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, width: '320px' }}
                >
                    {/* حقل البحث */}
                    <div className="p-2 border-b bg-muted/20">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                placeholder="بحث..."
                                className="w-full pr-8 pl-3 py-1.5 text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 text-right"
                                onKeyDown={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* تبويبات النوع */}
                    <div className="flex overflow-x-auto border-b bg-muted/10 px-1 py-1 gap-0.5 scrollbar-none">
                        {TYPE_TABS.map(tab => {
                            const Icon = tab.icon;
                            const count = tab.type === 'all'
                                ? allResults.length
                                : allResults.filter(r => r.type === tab.type).length;
                            return (
                                <button
                                    key={tab.type}
                                    onMouseDown={e => { e.preventDefault(); setActiveType(tab.type); }}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap transition-all flex-shrink-0",
                                        activeType === tab.type
                                            ? "bg-primary text-white"
                                            : "text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    <Icon className="w-3 h-3" />
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={cn(
                                            "px-1 rounded-full text-[10px]",
                                            activeType === tab.type ? "bg-white/20" : "bg-muted"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* النتائج */}
                    <div className="max-h-52 overflow-y-auto">
                        {isFetching ? (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                جارٍ البحث...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                <AtSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                لا توجد نتائج
                            </div>
                        ) : (
                            filtered.map(item => {
                                const Icon = TYPE_ICONS[item.type] || AtSign;
                                return (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-right border-b border-border/30 last:border-0"
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                            TYPE_COLORS[item.type] || 'bg-primary/10 text-primary'
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{TYPE_LABELS[item.type]}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

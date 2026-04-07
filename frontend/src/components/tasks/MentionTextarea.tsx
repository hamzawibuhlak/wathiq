import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi, MentionItem } from '@/api/tasks.api';
import { AtSign, User, Briefcase, Users, Calendar, FileText, Receipt, X } from 'lucide-react';
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

const mentionTypeIcons: Record<string, React.ElementType> = {
    user: User,
    case: Briefcase,
    client: Users,
    hearing: Calendar,
    document: FileText,
    invoice: Receipt,
};

const mentionTypeLabels: Record<string, string> = {
    user: 'مستخدم',
    case: 'قضية',
    client: 'عميل',
    hearing: 'جلسة',
    document: 'مستند',
    invoice: 'فاتورة',
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
    const [searchQuery, setSearchQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const [mentions, setMentions] = useState<MentionItem[]>([]);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Search mentionables
    const { data: searchResults } = useQuery({
        queryKey: ['mentionables', searchQuery],
        queryFn: () => tasksApi.searchMentionables(searchQuery),
        enabled: showDropdown && searchQuery.length >= 0,
        staleTime: 5000,
    });

    const mentionables = searchResults?.data || [];

    // Handle text changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const pos = e.target.selectionStart;
        onChange(text);

        // Check for @ trigger
        const textBeforeCursor = text.substring(0, pos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // No space in the search query = still mentioning
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionStart(lastAtIndex);
                setSearchQuery(textAfterAt);
                setShowDropdown(true);

                // Position dropdown near cursor (approximate)
                if (textareaRef.current) {
                    const rect = textareaRef.current.getBoundingClientRect();
                    setDropdownPos({
                        top: rect.bottom + 4,
                        left: rect.left,
                    });
                }
                return;
            }
        }

        setShowDropdown(false);
        setMentionStart(-1);
        setSearchQuery('');
    };

    const handleSelect = useCallback((item: MentionItem) => {
        if (mentionStart === -1 || !textareaRef.current) return;

        const before = value.substring(0, mentionStart);
        const after = value.substring(mentionStart + 1 + searchQuery.length);
        const mentionText = `@${item.name} `;
        const newValue = before + mentionText + after;

        onChange(newValue);

        // Track mention
        const updated = [...mentions.filter(m => m.id !== item.id), item];
        setMentions(updated);
        onMentionsChange(updated);

        setShowDropdown(false);
        setMentionStart(-1);
        setSearchQuery('');

        // Focus back
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = before.length + mentionText.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    }, [mentionStart, searchQuery, value, mentions, onChange, onMentionsChange]);

    const removeMention = (id: string) => {
        const updated = mentions.filter(m => m.id !== id);
        setMentions(updated);
        onMentionsChange(updated);
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && showDropdown) {
            setShowDropdown(false);
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
                    "w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
                    className
                )}
            />

            {/* @ hint */}
            <div className="flex items-center gap-1 mt-1">
                <AtSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">اكتب @ للإشارة إلى شخص أو قضية أو مستند...</span>
            </div>

            {/* Selected mentions chips */}
            {mentions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {mentions.map(m => {
                        const Icon = mentionTypeIcons[m.type] || AtSign;
                        return (
                            <span
                                key={`${m.type}-${m.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                            >
                                <Icon className="w-3 h-3" />
                                {m.name}
                                <button onClick={() => removeMention(m.id)} className="hover:text-destructive">
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
                    className="fixed z-50 w-72 bg-popover border rounded-xl shadow-xl overflow-hidden"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    <div className="p-2 border-b bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium">
                            {searchQuery ? `نتائج "${searchQuery}"` : 'اختر عنصراً...'}
                        </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {mentionables.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج</p>
                        ) : (
                            mentionables.map(item => {
                                const Icon = mentionTypeIcons[item.type] || AtSign;
                                return (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelect(item);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-sm text-right"
                                    >
                                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0 text-right">
                                            <span className="font-medium truncate block">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">{mentionTypeLabels[item.type]}</span>
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

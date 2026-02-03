import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Scale, Users, Calendar, FileText, Receipt, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/hooks/use-search';

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { data, isLoading } = useGlobalSearch(query);

    // Handle keyboard shortcut to open/close
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, onClose]);

    const handleSelect = useCallback((value: string) => {
        const [type, id] = value.split(':');
        onClose();
        setQuery('');

        switch (type) {
            case 'case':
                navigate(`/cases/${id}`);
                break;
            case 'client':
                navigate(`/clients/${id}`);
                break;
            case 'hearing':
                navigate(`/hearings/${id}/edit`);
                break;
            case 'document':
                navigate(`/documents/${id}`);
                break;
            case 'invoice':
                navigate(`/invoices/${id}`);
                break;
        }
    }, [navigate, onClose]);

    if (!isOpen) return null;

    const results = data?.data;
    const hasResults = results && results.total > 0;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Command Dialog */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
                <Command
                    className="w-full max-w-2xl bg-card rounded-xl shadow-2xl border overflow-hidden"
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 border-b">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <Command.Input
                            value={query}
                            onValueChange={setQuery}
                            placeholder="ابحث في القضايا، العملاء، الجلسات..."
                            className="flex-1 py-4 text-base bg-transparent border-0 outline-none placeholder:text-muted-foreground"
                            autoFocus
                        />
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Results */}
                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        {query.length < 2 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>ابدأ الكتابة للبحث...</p>
                                <p className="text-sm mt-1">
                                    استخدم <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd> للفتح السريع
                                </p>
                            </div>
                        ) : !hasResults && !isLoading ? (
                            <Command.Empty className="py-8 text-center text-muted-foreground">
                                <p>لا توجد نتائج لـ "{query}"</p>
                            </Command.Empty>
                        ) : (
                            <>
                                {/* Cases */}
                                {results?.cases && results.cases.length > 0 && (
                                    <Command.Group heading="القضايا">
                                        {results.cases.map((item: any) => (
                                            <Command.Item
                                                key={`case-${item.id}`}
                                                value={`case:${item.id}`}
                                                onSelect={handleSelect}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                                    <Scale className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.caseNumber} • {item.client?.name}
                                                    </p>
                                                </div>
                                                <StatusBadge status={item.status} />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Clients */}
                                {results?.clients && results.clients.length > 0 && (
                                    <Command.Group heading="العملاء">
                                        {results.clients.map((item: any) => (
                                            <Command.Item
                                                key={`client-${item.id}`}
                                                value={`client:${item.id}`}
                                                onSelect={handleSelect}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
                                                    <Users className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.phone || item.email}
                                                    </p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Hearings */}
                                {results?.hearings && results.hearings.length > 0 && (
                                    <Command.Group heading="الجلسات">
                                        {results.hearings.map((item: any) => (
                                            <Command.Item
                                                key={`hearing-${item.id}`}
                                                value={`hearing:${item.id}`}
                                                onSelect={handleSelect}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
                                                    <Calendar className="w-4 h-4 text-orange-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.case?.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(item.hearingDate).toLocaleDateString('ar-SA')} • {item.courtName}
                                                    </p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Documents */}
                                {results?.documents && results.documents.length > 0 && (
                                    <Command.Group heading="المستندات">
                                        {results.documents.map((item: any) => (
                                            <Command.Item
                                                key={`document-${item.id}`}
                                                value={`document:${item.id}`}
                                                onSelect={handleSelect}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
                                                    <FileText className="w-4 h-4 text-green-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.fileName}
                                                    </p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Invoices */}
                                {results?.invoices && results.invoices.length > 0 && (
                                    <Command.Group heading="الفواتير">
                                        {results.invoices.map((item: any) => (
                                            <Command.Item
                                                key={`invoice-${item.id}`}
                                                value={`invoice:${item.id}`}
                                                onSelect={handleSelect}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                                                    <Receipt className="w-4 h-4 text-purple-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{item.invoiceNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.client?.name} • {Number(item.totalAmount).toLocaleString()} ر.س
                                                    </p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                            </>
                        )}
                    </Command.List>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd> اختيار
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd> تنقل
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> إغلاق
                        </span>
                    </div>
                </Command>
            </div>
        </>
    );
}

// Helper component for status badges
function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string; className: string }> = {
        OPEN: { label: 'مفتوحة', className: 'bg-blue-100 text-blue-700' },
        IN_PROGRESS: { label: 'جارية', className: 'bg-yellow-100 text-yellow-700' },
        CLOSED: { label: 'مغلقة', className: 'bg-green-100 text-green-700' },
        SUSPENDED: { label: 'معلقة', className: 'bg-gray-100 text-gray-700' },
    };

    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', config.className)}>
            {config.label}
        </span>
    );
}

export default GlobalSearch;

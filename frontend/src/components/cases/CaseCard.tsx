import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Scale, Calendar, User, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { CaseStatusBadge } from './CaseStatusBadge';
import type { Case } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface CaseCardProps {
    caseData: Case;
    onDelete?: (id: string) => void;
}

const caseTypeLabels: Record<string, string> = {
    CIVIL: 'مدني',
    CRIMINAL: 'جنائي',
    COMMERCIAL: 'تجاري',
    LABOR: 'عمالي',
    FAMILY: 'أحوال شخصية',
    ADMINISTRATIVE: 'إداري',
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    HIGH: { label: 'عالية', className: 'text-red-600' },
    MEDIUM: { label: 'متوسطة', className: 'text-yellow-600' },
    LOW: { label: 'منخفضة', className: 'text-green-600' },
};

export function CaseCard({ caseData, onDelete }: CaseCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { p } = useSlugPath();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const priority = priorityConfig[caseData.priority || 'MEDIUM'];

    return (
        <div className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <Link
                            to={p(`/cases/${caseData.id}`)}
                            className="font-semibold hover:text-primary transition-colors"
                        >
                            {caseData.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{caseData.caseNumber}</p>
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-40 bg-card rounded-lg shadow-lg border py-1 z-10">
                            <Link
                                to={p(`/cases/${caseData.id}`)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                عرض التفاصيل
                            </Link>
                            <Link
                                to={p(`/cases/${caseData.id}/edit`)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                تعديل
                            </Link>
                            <button
                                onClick={() => onDelete?.(caseData.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            {caseData.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {caseData.description}
                </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                    <Scale className="w-4 h-4" />
                    {caseTypeLabels[caseData.caseType] || caseData.caseType}
                </span>
                {caseData.client && (
                    <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {caseData.client.name}
                    </span>
                )}
                {caseData.filingDate && (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(caseData.filingDate)}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
                <CaseStatusBadge status={caseData.status} />
                <span className={cn('text-xs font-medium', priority.className)}>
                    أولوية {priority.label}
                </span>
            </div>
        </div>
    );
}

export default CaseCard;

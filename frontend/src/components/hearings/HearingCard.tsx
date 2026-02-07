import { Link } from 'react-router-dom';
import { Clock, MapPin, Scale, MoreVertical, Pencil, Trash2, User, Users, Gavel, Hash } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { HearingStatusBadge } from './HearingStatusBadge';
import type { Hearing } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface HearingCardProps {
    hearing: Hearing;
    onDelete?: (id: string) => void;
}

export function HearingCard({ hearing, onDelete }: HearingCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const date = new Date(hearing.hearingDate);
    const isToday = new Date().toDateString() === date.toDateString();

    // Get lawyer info from hearing.assignedTo (direct) or fallback to case.assignedTo
    const lawyer = (hearing as any).assignedTo || hearing.case?.assignedTo;
    
    // Get opponent name from hearing directly or from case
    const opponentName = (hearing as any).opponentName || hearing.case?.opposingParty;

    return (
        <div className={cn(
            'bg-card rounded-xl border p-5 hover:shadow-md transition-shadow',
            isToday && 'border-primary/50 bg-primary/5'
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Lawyer Avatar */}
                    <div className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center overflow-hidden',
                        'bg-primary/10'
                    )}>
                        {lawyer?.avatar ? (
                            <img 
                                src={lawyer.avatar} 
                                alt={lawyer.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-7 h-7 text-primary" />
                        )}
                    </div>

                    <div>
                        {/* Hearing Number */}
                        {(hearing as any).hearingNumber && (
                            <div className="flex items-center gap-1 text-xs text-primary font-medium mb-1">
                                <Hash className="w-3 h-3" />
                                {(hearing as any).hearingNumber}
                            </div>
                        )}
                        <h3 className="font-semibold">{hearing.courtName || 'جلسة'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(hearing.hearingDate)}
                        </div>
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
                        <div className="absolute left-0 top-full mt-1 w-36 bg-card rounded-lg shadow-lg border py-1 z-10">
                            <Link
                                to={`/hearings/${hearing.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                تعديل
                            </Link>
                            <button
                                onClick={() => onDelete?.(hearing.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Case Info */}
            {hearing.case && (
                <Link
                    to={`/cases/${hearing.case.id}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-3"
                >
                    <Scale className="w-4 h-4" />
                    {hearing.case.caseNumber} - {hearing.case.title}
                </Link>
            )}

            {/* Client Info */}
            {(hearing as any).client && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <User className="w-4 h-4" />
                    <span>{(hearing as any).client.name}</span>
                </div>
            )}

            {/* Location - courtName + courtroom */}
            {(hearing.courtName || (hearing as any).courtroom) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    {[hearing.courtName, (hearing as any).courtroom].filter(Boolean).join(' - ')}
                </div>
            )}

            {/* Opposing Party */}
            {opponentName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Users className="w-4 h-4" />
                    <span>الخصم: {opponentName}</span>
                </div>
            )}

            {/* Judge Name */}
            {(hearing as any).judgeName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Gavel className="w-4 h-4" />
                    <span>القاضي: {(hearing as any).judgeName}</span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
                <HearingStatusBadge status={hearing.status} />
                {lawyer && (
                    <span className="text-xs text-muted-foreground">
                        المحامي: {lawyer.name}
                    </span>
                )}
            </div>
        </div>
    );
}

export default HearingCard;

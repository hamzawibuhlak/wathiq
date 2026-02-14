import { Link, useParams } from 'react-router-dom';
import { User, Building2, Mail, Phone, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import type { Client } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface ClientCardProps {
    client: Client;
    onDelete?: (id: string) => void;
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
    const { slug } = useParams<{ slug: string }>();
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

    const isCompany = client.companyName || client.commercialReg;

    return (
        <div className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompany ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'
                        }`}>
                        {isCompany ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
                    </div>
                    <div>
                        <Link
                            to={`/${slug}/clients/${client.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                        >
                            {client.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {isCompany ? 'شركة' : 'فرد'}
                        </p>
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
                                to={`/${slug}/clients/${client.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                عرض التفاصيل
                            </Link>
                            <Link
                                to={`/${slug}/clients/${client.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                تعديل
                            </Link>
                            <button
                                onClick={() => onDelete?.(client.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
                {client.email && (
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                    </div>
                )}
                {client.phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{client.phone}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
                <span className={`text-xs px-2 py-1 rounded-full ${client.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {client.isActive ? 'نشط' : 'غير نشط'}
                </span>
                {client._count?.cases !== undefined && (
                    <span className="text-xs text-muted-foreground">
                        {client._count.cases} قضية
                    </span>
                )}
            </div>
        </div>
    );
}

export default ClientCard;

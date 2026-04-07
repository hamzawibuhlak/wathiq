import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents.api';
import { casesApi } from '@/api/cases.api';
import { X, Save, Loader2, ChevronDown, Check, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Document } from '@/types';

interface EditDocumentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document | null;
}

const documentTypes = [
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'POWER_OF_ATTORNEY', label: 'وكالة' },
    { value: 'COURT_DOCUMENT', label: 'مستند محكمة' },
    { value: 'COURT_ORDER', label: 'حكم محكمة' },
    { value: 'PLEADING', label: 'مذكرة' },
    { value: 'EVIDENCE', label: 'دليل' },
    { value: 'CORRESPONDENCE', label: 'مراسلة' },
    { value: 'INVOICE', label: 'فاتورة' },
    { value: 'RECEIPT', label: 'إيصال' },
    { value: 'ID_DOCUMENT', label: 'وثيقة هوية' },
    { value: 'OTHER', label: 'أخرى' },
];

export function EditDocumentDialog({ isOpen, onClose, document: doc }: EditDocumentDialogProps) {
    const queryClient = useQueryClient();
    const [showCaseList, setShowCaseList] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        documentType: 'OTHER',
        caseIds: [] as string[],
        tags: '',
    });

    // Populate form when doc changes
    useEffect(() => {
        if (doc) {
            setFormData({
                title: doc.title || '',
                description: (doc as any).description || '',
                documentType: doc.documentType || 'OTHER',
                caseIds: (doc as any).caseIds || (doc.caseId ? [doc.caseId] : []),
                tags: ((doc as any).tags || []).join(', '),
            });
        }
    }, [doc]);

    const { data: casesData } = useQuery({
        queryKey: ['cases-list'],
        queryFn: () => casesApi.getAll({ limit: 100 }),
        enabled: isOpen,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            documentsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
            toast.success('تم تحديث المستند بنجاح');
            onClose();
        },
        onError: () => {
            toast.error('فشل في تحديث المستند');
        },
    });

    const toggleCase = (caseId: string) => {
        setFormData(prev => ({
            ...prev,
            caseIds: prev.caseIds.includes(caseId)
                ? prev.caseIds.filter(id => id !== caseId)
                : [...prev.caseIds, caseId],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!doc) return;

        const tags = formData.tags
            ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        updateMutation.mutate({
            id: doc.id,
            data: {
                title: formData.title,
                description: formData.description,
                documentType: formData.documentType,
                tags,
            },
        });
    };

    if (!isOpen || !doc) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">تعديل المستند</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Current File Info */}
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                        <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                                {(doc.fileSize / 1024).toFixed(1)} KB · {doc.mimeType}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">العنوان *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="عنوان المستند"
                            required
                        />
                    </div>

                    {/* Document Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">نوع المستند</label>
                        <select
                            value={formData.documentType}
                            onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        >
                            {documentTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cases (multi-select) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            القضايا (اختياري)
                            {formData.caseIds.length > 0 && (
                                <span className="mr-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                                    {formData.caseIds.length} قضية
                                </span>
                            )}
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowCaseList(!showCaseList)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-right flex items-center justify-between"
                        >
                            <span className="text-sm text-muted-foreground">
                                {formData.caseIds.length === 0
                                    ? 'بدون قضية'
                                    : `${formData.caseIds.length} قضية محددة`}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${showCaseList ? 'rotate-180' : ''}`} />
                        </button>
                        {showCaseList && (
                            <div className="mt-1 border rounded-lg bg-background max-h-36 overflow-y-auto">
                                {casesData?.data?.map((c: any) => (
                                    <label
                                        key={c.id}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.caseIds.includes(c.id)
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-gray-300'
                                            }`}>
                                            {formData.caseIds.includes(c.id) && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm flex-1">
                                            {c.caseNumber} - {c.title}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.caseIds.includes(c.id)}
                                            onChange={() => toggleCase(c.id)}
                                        />
                                    </label>
                                ))}
                                {(!casesData?.data || casesData.data.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-3">لا توجد قضايا</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">الوصف (اختياري)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            rows={3}
                            placeholder="أضف وصفاً للمستند..."
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2">الوسوم (اختياري)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="مهم, عاجل, سري (افصل بفاصلة)"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.title || updateMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جارٍ الحفظ...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    حفظ التغييرات
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditDocumentDialog;

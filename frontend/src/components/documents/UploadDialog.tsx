import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents.api';
import { casesApi } from '@/api/cases.api';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCaseId?: string;
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

export function UploadDialog({ isOpen, onClose, defaultCaseId }: UploadDialogProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        documentType: 'OTHER',
        caseId: defaultCaseId || '',
        tags: '',
    });

    const { data: casesData } = useQuery({
        queryKey: ['cases-list'],
        queryFn: () => casesApi.getAll({ limit: 100 }),
        enabled: isOpen && !defaultCaseId,
    });

    const uploadMutation = useMutation({
        mutationFn: documentsApi.upload,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('تم رفع المستند بنجاح');
            onClose();
            reset();
        },
        onError: () => {
            toast.error('فشل في رفع المستند');
        },
    });

    const reset = () => {
        setFile(null);
        setFormData({
            title: '',
            description: '',
            documentType: 'OTHER',
            caseId: defaultCaseId || '',
            tags: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('الرجاء اختيار ملف');
            return;
        }

        const tags = formData.tags
            ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        uploadMutation.mutate({
            file,
            title: formData.title || file.name,
            description: formData.description,
            documentType: formData.documentType,
            caseId: formData.caseId || undefined,
            tags,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">رفع مستند جديد</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">الملف *</label>
                        {!file ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        اضغط لاختيار ملف أو اسحبه هنا
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PDF, Word, Image (حد أقصى 50MB)
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setFile(f);
                                            if (!formData.title) {
                                                setFormData(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, '') }));
                                            }
                                        }
                                    }}
                                />
                            </label>
                        ) : (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">العنوان</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="عنوان المستند"
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

                    {/* Case (optional) */}
                    {!defaultCaseId && (
                        <div>
                            <label className="block text-sm font-medium mb-2">القضية (اختياري)</label>
                            <select
                                value={formData.caseId}
                                onChange={(e) => setFormData(prev => ({ ...prev, caseId: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            >
                                <option value="">بدون قضية</option>
                                {casesData?.data?.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.caseNumber} - {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!file || uploadMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {uploadMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جارٍ الرفع...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    رفع المستند
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UploadDialog;

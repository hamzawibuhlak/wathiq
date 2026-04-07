import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents.api';
import { documentFoldersApi } from '@/api/documentFolders.api';
import { casesApi } from '@/api/cases.api';
import { X, Upload, FileText, Loader2, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCaseId?: string;
    defaultFolderId?: string; // If set, document will be moved to this folder after upload
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

export function UploadDialog({ isOpen, onClose, defaultCaseId, defaultFolderId }: UploadDialogProps) {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        documentType: 'OTHER',
        caseIds: defaultCaseId ? [defaultCaseId] : [] as string[],
        tags: '',
    });
    const [showCaseList, setShowCaseList] = useState(false);

    const { data: casesData } = useQuery({
        queryKey: ['cases-list'],
        queryFn: () => casesApi.getAll({ limit: 100 }),
        enabled: isOpen,
    });

    const uploadMutation = useMutation({
        mutationFn: documentsApi.upload,
        onSuccess: async (result) => {
            // If inside a folder, move the new document to that folder
            if (defaultFolderId && result?.data?.id) {
                try {
                    await documentFoldersApi.moveDocument(defaultFolderId, result.data.id);
                } catch {
                    // non-critical error, document was uploaded successfully
                }
            }
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
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
            caseIds: defaultCaseId ? [defaultCaseId] : [],
            tags: '',
        });
        setShowCaseList(false);
    };

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
            caseIds: formData.caseIds.length > 0 ? formData.caseIds : undefined,
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
                            <div className="mt-1 border rounded-lg bg-background max-h-40 overflow-y-auto">
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

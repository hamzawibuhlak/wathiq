import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, Download, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '@/api/client';
import { toast } from 'react-hot-toast';

type ImportType = 'clients' | 'cases';

interface ImportResult {
    imported: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
}

export function ImportPage() {
    const [selectedType, setSelectedType] = useState<ImportType>('clients');
    const [dragActive, setDragActive] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const importMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post(`/import/${selectedType}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        onSuccess: (data) => {
            setResult(data.data);
            toast.success(data.message);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في الاستيراد');
        },
    });

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files?.[0]) {
            const file = files[0];
            if (file.name.endsWith('.xlsx')) {
                importMutation.mutate(file);
            } else {
                toast.error('يرجى اختيار ملف Excel (.xlsx)');
            }
        }
    }, [importMutation]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files?.[0]) {
            importMutation.mutate(files[0]);
        }
        e.target.value = '';
    };

    const downloadTemplate = async (type: ImportType) => {
        try {
            const res = await api.get(`/import/templates/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('فشل في تحميل النموذج');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">استيراد البيانات</h1>
                    <p className="text-muted-foreground">استورد العملاء أو القضايا من ملف Excel</p>
                </div>
            </div>

            {/* Type Selection */}
            <div className="flex gap-3">
                <button
                    onClick={() => { setSelectedType('clients'); setResult(null); }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedType === 'clients'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                        }`}
                >
                    <FileSpreadsheet className={`w-6 h-6 mb-2 ${selectedType === 'clients' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium">العملاء</p>
                    <p className="text-sm text-muted-foreground">الاسم، الهاتف، البريد...</p>
                </button>
                <button
                    onClick={() => { setSelectedType('cases'); setResult(null); }}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${selectedType === 'cases'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                        }`}
                >
                    <FileSpreadsheet className={`w-6 h-6 mb-2 ${selectedType === 'cases' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium">القضايا</p>
                    <p className="text-sm text-muted-foreground">العنوان، النوع، العميل...</p>
                </button>
            </div>

            {/* Download Template */}
            <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">تحميل نموذج {selectedType === 'clients' ? 'العملاء' : 'القضايا'}</p>
                        <p className="text-sm text-muted-foreground">حمّل النموذج واملأه ببياناتك</p>
                    </div>
                </div>
                <button
                    onClick={() => downloadTemplate(selectedType)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                    تحميل النموذج
                </button>
            </div>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/30 hover:border-primary/50'
                    }`}
            >
                {importMutation.isPending ? (
                    <div className="space-y-3">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                        <p className="text-muted-foreground">جارٍ استيراد البيانات...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium mb-2">اسحب وأفلت ملف Excel هنا</p>
                        <p className="text-sm text-muted-foreground mb-4">أو</p>
                        <label className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium cursor-pointer">
                            اختر ملف
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-muted-foreground mt-4">
                            الملفات المدعومة: .xlsx (Excel)
                        </p>
                    </>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="p-6 rounded-2xl border bg-card space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">نتيجة الاستيراد</h2>
                        <button
                            onClick={() => setResult(null)}
                            className="p-1 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-700 dark:text-green-400">تم الاستيراد</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <span className="font-medium text-amber-700 dark:text-amber-400">تم تخطيها</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-medium text-red-600">الأخطاء ({result.errors.length}):</h3>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {result.errors.map((err, idx) => (
                                    <div key={idx} className="text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-400">
                                        <strong>الصف {err.row}:</strong> {err.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ImportPage;

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onUpload: (file: File, title: string, description: string, documentType: string, caseId?: string) => void;
    isLoading?: boolean;
    cases?: Array<{ id: string; title: string; caseNumber: string }>;
    defaultCaseId?: string;
}

const documentTypes = [
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'PLEADING', label: 'مذكرة' },
    { value: 'EVIDENCE', label: 'دليل' },
    { value: 'COURT_ORDER', label: 'حكم محكمة' },
    { value: 'CORRESPONDENCE', label: 'مراسلة' },
    { value: 'OTHER', label: 'أخرى' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

export function FileUploader({ onUpload, isLoading, cases = [], defaultCaseId = '' }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [documentType, setDocumentType] = useState('OTHER');
    const [caseId, setCaseId] = useState(defaultCaseId);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Update caseId when defaultCaseId changes
    useEffect(() => {
        if (defaultCaseId) {
            setCaseId(defaultCaseId);
        }
    }, [defaultCaseId]);

    const validateFile = (file: File): boolean => {
        setError('');

        if (file.size > MAX_FILE_SIZE) {
            setError('حجم الملف يتجاوز 10 ميجابايت');
            return false;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('نوع الملف غير مدعوم. أنواع الملفات المسموحة: PDF, Word, JPG, PNG');
            return false;
        }

        return true;
    };

    const handleFile = (file: File) => {
        if (validateFile(file)) {
            setFile(file);
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;
        onUpload(file, title, description, documentType, caseId || undefined);
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
        return <File className="w-8 h-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drop Zone */}
            <div
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
                    error && 'border-destructive'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleChange}
                />

                {file ? (
                    <div className="flex items-center justify-center gap-4">
                        {getFileIcon(file.type)}
                        <div className="text-right">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                setTitle('');
                            }}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium mb-1">اسحب الملف هنا</p>
                        <p className="text-sm text-muted-foreground mb-2">أو اضغط لاختيار ملف</p>
                        <p className="text-xs text-muted-foreground">
                            PDF, Word, JPG, PNG (حد أقصى 10 ميجابايت)
                        </p>
                    </>
                )}
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {file && (
                <>
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">عنوان المستند *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="أدخل عنوان المستند"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">الوصف</Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف المستند (اختياري)"
                            className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Type & Case */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="documentType">نوع المستند</Label>
                            <select
                                id="documentType"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {documentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="caseId">القضية (اختياري)</Label>
                            <select
                                id="caseId"
                                value={caseId}
                                onChange={(e) => setCaseId(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">بدون قضية</option>
                                {cases.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.caseNumber} - {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isLoading} disabled={!file || !title}>
                            <Upload className="w-4 h-4 ml-2" />
                            رفع المستند
                        </Button>
                    </div>
                </>
            )}
        </form>
    );
}

export default FileUploader;

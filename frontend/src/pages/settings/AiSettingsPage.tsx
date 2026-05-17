import { useEffect, useState } from 'react';
import {
    Bot,
    Sparkles,
    Eye,
    EyeOff,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Edit3,
    Check,
    X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiConfigApi, AiPrompt, UpdateAiConfigDto } from '@/api/aiConfig.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/common/LoadingState';
import { cn } from '@/lib/utils';

const PROVIDERS = [
    { value: 'openai', label: 'OpenAI (GPT)', description: 'gpt-4o, gpt-4o-mini' },
    { value: 'anthropic', label: 'Anthropic (Claude)', description: 'claude-3.5-sonnet, claude-3-opus' },
    { value: 'openrouter', label: 'OpenRouter', description: 'وكيل متعدد المزودين' },
];

const SUGGESTED_MODELS: Record<string, string[]> = {
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'o1-mini'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    openrouter: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'],
};

export default function AiSettingsPage() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<UpdateAiConfigDto>({});
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [hasChanges, setHasChanges] = useState(false);

    const { data: configData, isLoading } = useQuery({
        queryKey: ['ai-config'],
        queryFn: () => aiConfigApi.getConfig(),
    });

    const config = configData?.data;

    const updateMutation = useMutation({
        mutationFn: (data: UpdateAiConfigDto) => aiConfigApi.updateConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-config'] });
            toast.success('تم الحفظ بنجاح');
            setForm({});
            setHasChanges(false);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل الحفظ'),
    });

    const testMutation = useMutation({
        mutationFn: (provider: string) => aiConfigApi.testConnection(provider),
        onSuccess: (r) => {
            if (r.success) {
                toast.success(`${r.message}${r.response ? ` — ${r.response}` : ''}`);
            } else {
                toast.error(r.message);
            }
        },
        onError: () => toast.error('فشل اختبار الاتصال'),
    });

    const handleChange = (k: keyof UpdateAiConfigDto, v: string) => {
        setForm((f) => ({ ...f, [k]: v }));
        setHasChanges(true);
    };

    const getValue = (
        k: keyof UpdateAiConfigDto,
        configKey: 'apiKey' | 'model',
        provider: 'openai' | 'anthropic' | 'openrouter',
    ) => {
        if (form[k] !== undefined) return form[k]!;
        return config?.[provider]?.[configKey] ?? '';
    };

    if (isLoading) return <LoadingState size="lg" />;

    const activeProvider = form.provider || config?.provider || 'openai';

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">وكيل الذكاء الاصطناعي</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            اربط مزوّد الذكاء الاصطناعي وخصّص برومتات المساعد القانوني
                        </p>
                    </div>
                </div>
                {config && (() => {
                    const active = (config as any)[activeProvider];
                    const configured = active && typeof active === 'object' && active.configured;
                    return (
                    <div
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                            configured
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700',
                        )}
                    >
                        {configured ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> متصل ({activeProvider})
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4" /> غير مكوّن
                            </>
                        )}
                    </div>
                    );
                })()}
            </div>

            <Tabs defaultValue="connection" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="connection">الاتصال والمفاتيح</TabsTrigger>
                    <TabsTrigger value="prompts">برومتات النظام</TabsTrigger>
                </TabsList>

                {/* ── Connection tab ────────────────────────── */}
                <TabsContent value="connection" className="space-y-6 mt-6">
                    <div className="bg-card rounded-xl border p-6 space-y-5">
                        <div className="space-y-2">
                            <Label>المزوّد الافتراضي</Label>
                            <Select
                                value={activeProvider}
                                onValueChange={(v) => handleChange('provider', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROVIDERS.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            <div className="flex flex-col">
                                                <span>{p.label}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {p.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                هذا المزوّد سيُستخدم تلقائياً في البحث الذكي وكل خدمات الذكاء الاصطناعي
                            </p>
                        </div>

                        {/* Provider cards */}
                        {(['openai', 'anthropic', 'openrouter'] as const).map((p) => {
                            const isActive = activeProvider === p;
                            const cfg = config?.[p];
                            const keyField = `${p}ApiKey` as keyof UpdateAiConfigDto;
                            const modelField = `${p}Model` as keyof UpdateAiConfigDto;

                            return (
                                <div
                                    key={p}
                                    className={cn(
                                        'rounded-lg border p-4 space-y-3 transition',
                                        isActive && 'border-primary/40 bg-primary/[0.02]',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold capitalize flex items-center gap-2">
                                            {PROVIDERS.find((x) => x.value === p)?.label}
                                            {cfg?.configured && (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                    مكوّن
                                                </span>
                                            )}
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!cfg?.configured || testMutation.isPending}
                                            onClick={() => testMutation.mutate(p)}
                                        >
                                            <RefreshCw
                                                className={cn(
                                                    'w-3.5 h-3.5 ml-1.5',
                                                    testMutation.isPending && 'animate-spin',
                                                )}
                                            />
                                            اختبار
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">مفتاح API</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys[p] ? 'text' : 'password'}
                                                    value={getValue(keyField, 'apiKey', p) as string}
                                                    placeholder={
                                                        p === 'openai'
                                                            ? 'sk-...'
                                                            : p === 'anthropic'
                                                            ? 'sk-ant-...'
                                                            : 'sk-or-...'
                                                    }
                                                    onChange={(e) => handleChange(keyField, e.target.value)}
                                                    className="pl-10"
                                                    dir="ltr"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowKeys((s) => ({ ...s, [p]: !s[p] }))
                                                    }
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showKeys[p] ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs">النموذج (Model)</Label>
                                            <Input
                                                value={getValue(modelField, 'model', p) as string}
                                                onChange={(e) => handleChange(modelField, e.target.value)}
                                                dir="ltr"
                                                list={`models-${p}`}
                                            />
                                            <datalist id={`models-${p}`}>
                                                {SUGGESTED_MODELS[p].map((m) => (
                                                    <option key={m} value={m} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                                onClick={() => updateMutation.mutate(form)}
                                disabled={!hasChanges || updateMutation.isPending}
                            >
                                <Save className="w-4 h-4 ml-2" />
                                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                            </Button>
                            {hasChanges && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setForm({});
                                        setHasChanges(false);
                                    }}
                                >
                                    إلغاء
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
                        <p className="font-semibold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-600" />
                            من أين أحصل على مفاتيح API؟
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-1 text-slate-600">
                            <li>
                                OpenAI:{' '}
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    platform.openai.com/api-keys
                                </a>
                            </li>
                            <li>
                                Anthropic:{' '}
                                <a
                                    href="https://console.anthropic.com/settings/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    console.anthropic.com/settings/keys
                                </a>
                            </li>
                            <li>
                                OpenRouter:{' '}
                                <a
                                    href="https://openrouter.ai/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    openrouter.ai/keys
                                </a>
                                — وكيل واحد لكل المزودين
                            </li>
                        </ul>
                    </div>
                </TabsContent>

                {/* ── Prompts tab ───────────────────────────── */}
                <TabsContent value="prompts" className="mt-6">
                    <PromptsManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Prompts Manager
// ═══════════════════════════════════════════════════════════════
function PromptsManager() {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const { data: promptsData, isLoading } = useQuery({
        queryKey: ['ai-prompts'],
        queryFn: () => aiConfigApi.getPrompts(),
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, prompt }: { key: string; prompt: string }) =>
            aiConfigApi.updatePrompt(key, prompt),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
            toast.success('تم تحديث البرومت');
            setEditing(null);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل التحديث'),
    });

    const resetMutation = useMutation({
        mutationFn: (key: string) => aiConfigApi.resetPrompt(key),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
            toast.success('تمت الاستعادة للوضع الافتراضي');
            setEditing(null);
        },
        onError: () => toast.error('فشل الاستعادة'),
    });

    const prompts: AiPrompt[] = promptsData?.data || [];

    useEffect(() => {
        // Sync drafts with fetched prompts
        const init: Record<string, string> = {};
        prompts.forEach((p) => {
            init[p.key] = p.prompt;
        });
        setDrafts(init);
    }, [promptsData]);

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-4">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">برومتات النظام (System Prompts)</p>
                    <p className="text-xs text-violet-700 mt-1">
                        كل برومت يتحكم في سلوك الذكاء الاصطناعي لخدمة محدّدة. عدّل البرومت لتغيير
                        طريقة تجاوب الوكيل، ثم اضغط حفظ.
                    </p>
                </div>
            </div>

            {prompts.map((p) => {
                const isEditing = editing === p.key;
                const draft = drafts[p.key] ?? p.prompt;

                return (
                    <div key={p.key} className="bg-card rounded-xl border overflow-hidden">
                        <div className="flex items-center justify-between gap-3 p-4 border-b bg-muted/30">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold">{p.label}</h3>
                                    {p.isCustom && (
                                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                            مخصص
                                        </span>
                                    )}
                                    <code className="text-[10px] text-muted-foreground font-mono">
                                        {p.key}
                                    </code>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isEditing ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                updateMutation.mutate({
                                                    key: p.key,
                                                    prompt: draft,
                                                })
                                            }
                                            disabled={updateMutation.isPending || draft === p.prompt}
                                        >
                                            <Check className="w-3.5 h-3.5 ml-1" />
                                            حفظ
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setDrafts((d) => ({ ...d, [p.key]: p.prompt }));
                                                setEditing(null);
                                            }}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {p.isCustom && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (confirm('استعادة البرومت الافتراضي؟')) {
                                                        resetMutation.mutate(p.key);
                                                    }
                                                }}
                                                disabled={resetMutation.isPending}
                                                title="استعادة الافتراضي"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditing(p.key)}
                                        >
                                            <Edit3 className="w-3.5 h-3.5 ml-1" />
                                            تعديل
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            {isEditing ? (
                                <Textarea
                                    value={draft}
                                    onChange={(e) =>
                                        setDrafts((d) => ({ ...d, [p.key]: e.target.value }))
                                    }
                                    rows={10}
                                    className="font-mono text-sm leading-relaxed"
                                    placeholder="اكتب البرومت الذي يحدد سلوك الذكاء الاصطناعي..."
                                />
                            ) : (
                                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                                    {p.prompt}
                                </pre>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

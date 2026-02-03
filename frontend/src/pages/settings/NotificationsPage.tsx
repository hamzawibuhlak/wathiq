import { Bell, Mail, MessageSquare, Calendar, Receipt, Scale, Clock, Save } from 'lucide-react';
import { Button, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-settings';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                enabled ? 'bg-primary' : 'bg-muted',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    enabled ? '-translate-x-5' : 'translate-x-0'
                )}
            />
        </button>
    );
}

export function NotificationsPage() {
    const { data: settingsData, isLoading } = useNotificationSettings();
    const updateMutation = useUpdateNotificationSettings();

    const [settings, setSettings] = useState({
        emailEnabled: true,
        smsEnabled: false,
        hearingReminders: true,
        caseUpdates: true,
        invoiceReminders: true,
        dailyDigest: false,
        reminderHoursBefore: 24,
    });

    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (settingsData?.data) {
            setSettings(settingsData.data);
        }
    }, [settingsData]);

    const handleChange = (key: keyof typeof settings, value: boolean | number) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateMutation.mutate(settings, {
            onSuccess: () => setHasChanges(false),
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-muted rounded-lg h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Channels */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        قنوات الإشعارات
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">البريد الإلكتروني</p>
                                <p className="text-sm text-muted-foreground">استلام الإشعارات عبر البريد</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.emailEnabled}
                            onChange={(v) => handleChange('emailEnabled', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">الرسائل النصية SMS</p>
                                <p className="text-sm text-muted-foreground">استلام الإشعارات الهامة عبر SMS</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.smsEnabled}
                            onChange={(v) => handleChange('smsEnabled', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
                <CardHeader>
                    <CardTitle>أنواع الإشعارات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">تذكيرات الجلسات</p>
                                <p className="text-sm text-muted-foreground">تذكير قبل موعد الجلسة</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.hearingReminders}
                            onChange={(v) => handleChange('hearingReminders', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">تحديثات القضايا</p>
                                <p className="text-sm text-muted-foreground">إشعار عند تغيير حالة القضية</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.caseUpdates}
                            onChange={(v) => handleChange('caseUpdates', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Receipt className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">تذكيرات الفواتير</p>
                                <p className="text-sm text-muted-foreground">تذكير بالفواتير المستحقة</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.invoiceReminders}
                            onChange={(v) => handleChange('invoiceReminders', v)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">الملخص اليومي</p>
                                <p className="text-sm text-muted-foreground">ملخص يومي لجميع الأنشطة</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.dailyDigest}
                            onChange={(v) => handleChange('dailyDigest', v)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Reminder Timing */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        توقيت التذكيرات
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Label>التذكير قبل موعد الجلسة بـ</Label>
                        <div className="flex items-center gap-4">
                            {[24, 48, 72].map((hours) => (
                                <button
                                    key={hours}
                                    type="button"
                                    onClick={() => handleChange('reminderHoursBefore', hours)}
                                    className={cn(
                                        'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                                        settings.reminderHoursBefore === hours
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted'
                                    )}
                                >
                                    {hours} ساعة
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            سيتم إرسال التذكير قبل موعد الجلسة بـ {settings.reminderHoursBefore} ساعة
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    isLoading={updateMutation.isPending}
                    disabled={!hasChanges}
                >
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التفضيلات
                </Button>
            </div>
        </div>
    );
}

export default NotificationsPage;

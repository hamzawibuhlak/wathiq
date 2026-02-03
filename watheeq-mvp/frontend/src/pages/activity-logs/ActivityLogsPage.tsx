import { useState } from 'react';
import { useActivityLogs, useActivityStats } from '@/hooks/useActivityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Eye,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const limit = 20;

  const { data, isLoading } = useActivityLogs({
    page,
    limit,
    entity: entity || undefined,
    action: action || undefined,
  });
  const { data: statsData } = useActivityStats();

  const logs = data?.data?.data || [];
  const meta = data?.data?.meta;
  const stats = statsData?.data?.data;

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, React.ReactNode> = {
      CREATE: <Plus className="w-4 h-4 text-green-500" />,
      UPDATE: <Edit className="w-4 h-4 text-blue-500" />,
      DELETE: <Trash2 className="w-4 h-4 text-red-500" />,
      VIEW: <Eye className="w-4 h-4 text-gray-500" />,
    };
    return icons[actionType] || <Activity className="w-4 h-4" />;
  };

  const getActionBadge = (actionType: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive'; label: string; className?: string }
    > = {
      CREATE: { variant: 'default', label: 'إنشاء', className: 'bg-green-500 hover:bg-green-600' },
      UPDATE: { variant: 'default', label: 'تعديل', className: 'bg-blue-500 hover:bg-blue-600' },
      DELETE: { variant: 'destructive', label: 'حذف' },
      VIEW: { variant: 'secondary', label: 'عرض' },
    };
    const config = variants[actionType] || variants.VIEW;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const entityLabels: Record<string, string> = {
    Case: 'القضايا',
    Hearing: 'الجلسات',
    Client: 'العملاء',
    Invoice: 'الفواتير',
    Document: 'المستندات',
    User: 'المستخدمين',
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">سجل النشاطات</h1>
              <p className="text-muted-foreground">
                سجل جميع العمليات في النظام
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="Case">القضايا</SelectItem>
                <SelectItem value="Hearing">الجلسات</SelectItem>
                <SelectItem value="Client">العملاء</SelectItem>
                <SelectItem value="Invoice">الفواتير</SelectItem>
                <SelectItem value="Document">المستندات</SelectItem>
                <SelectItem value="User">المستخدمين</SelectItem>
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                <SelectItem value="CREATE">إنشاء</SelectItem>
                <SelectItem value="UPDATE">تعديل</SelectItem>
                <SelectItem value="DELETE">حذف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  إجمالي النشاطات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  آخر 24 ساعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.last24h.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.last7d.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  الأكثر نشاطاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {stats.topUsers[0]?.userName || '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats.topUsers[0]?.count || 0} عملية
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد نشاطات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>عنوان IP</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {entityLabels[log.entity] || log.entity}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {log.user?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{log.user?.name || 'غير معروف'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(log.createdAt), 'PPp', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                عرض {(page - 1) * limit + 1} - {Math.min(page * limit, meta.total)} من {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
  );
}

export default ActivityLogsPage;

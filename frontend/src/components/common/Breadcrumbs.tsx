import { ChevronLeft, Home } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const defaultLabels: Record<string, string> = {
  dashboard: 'الرئيسية',
  cases: 'القضايا',
  hearings: 'الجلسات',
  clients: 'العملاء',
  invoices: 'الفواتير',
  documents: 'المستندات',
  users: 'المستخدمون',
  settings: 'الإعدادات',
  reports: 'التقارير',
  notifications: 'الإشعارات',
  'activity-logs': 'سجل النشاطات',
  email: 'البريد الإلكتروني',
  sms: 'الرسائل النصية',
  calendar: 'التقويم',
  new: 'جديد',
  edit: 'تعديل',
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const dashboardPath = slug ? `/${slug}/dashboard` : '/dashboard';

  // If custom items provided, use them
  if (items) {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link
          to={dashboardPath}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
        </Link>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Auto-generate from path — skip the slug segment
  const pathnames = location.pathname.split('/').filter(x => x);
  const displayPaths = slug ? pathnames.filter(p => p !== slug) : pathnames;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link
        to={dashboardPath}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {displayPaths.map((name, index) => {
        // Build the full route including slug
        const routeParts = slug ? [slug, ...displayPaths.slice(0, index + 1)] : displayPaths.slice(0, index + 1);
        const routeTo = `/${routeParts.join('/')}`;
        const isLast = index === displayPaths.length - 1;
        const label = defaultLabels[name] || name;

        // Skip UUIDs and 'dashboard' (already shown as home)
        if (name.match(/^[0-9a-f-]{36}$/i) || name === 'dashboard') {
          return null;
        }

        return (
          <div key={name} className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

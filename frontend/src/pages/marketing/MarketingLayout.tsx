import { Outlet } from 'react-router-dom';

export default function MarketingLayout() {
    return (
        <div className="h-full" dir="rtl">
            <Outlet />
        </div>
    );
}

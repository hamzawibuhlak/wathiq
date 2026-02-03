import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            {/* Sidebar */}
            <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

            {/* Header */}
            <Header isCollapsed={isCollapsed} />

            {/* Main Content */}
            <main
                className={cn(
                    'pt-16 min-h-screen transition-all duration-300',
                    isCollapsed ? 'mr-16' : 'mr-64'
                )}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AppLayout;

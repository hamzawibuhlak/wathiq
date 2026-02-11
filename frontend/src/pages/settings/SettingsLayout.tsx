import { Outlet } from 'react-router-dom';

export function SettingsLayout() {
    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
}

export default SettingsLayout;

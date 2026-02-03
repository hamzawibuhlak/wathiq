import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    name: string;
    avatar?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
};

const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
};

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return parts[0][0] + parts[1][0];
    }
    return name.slice(0, 2);
}

function stringToColor(str: string): string {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
        'bg-cyan-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({ name, avatar, size = 'md', className }: UserAvatarProps) {
    const sizeClass = sizeClasses[size];
    const iconClass = iconSizes[size];

    if (avatar) {
        return (
            <img
                src={avatar}
                alt={name}
                className={cn(
                    'rounded-full object-cover ring-2 ring-background',
                    sizeClass,
                    className
                )}
            />
        );
    }

    // Fallback to initials with colored background
    const bgColor = stringToColor(name);
    const initials = getInitials(name);

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center text-white font-medium ring-2 ring-background',
                sizeClass,
                bgColor,
                className
            )}
            title={name}
        >
            {initials ? (
                <span>{initials.toUpperCase()}</span>
            ) : (
                <User className={iconClass} />
            )}
        </div>
    );
}

export default UserAvatar;

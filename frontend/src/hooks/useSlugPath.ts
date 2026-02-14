import { useParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook to build slug-aware paths and navigate with slug prefix.
 * Usage:
 *   const { p, nav } = useSlugPath();
 *   <Link to={p('/cases/new')}>...</Link>
 *   nav('/hearings');
 */
export function useSlugPath() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    /** Build a slug-prefixed path, e.g. p('/cases') => '/test/cases' */
    const p = useCallback(
        (path: string) => {
            if (!slug) return path;
            // Already has slug prefix
            if (path.startsWith(`/${slug}`)) return path;
            // Ensure path starts with /
            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            return `/${slug}${normalizedPath}`;
        },
        [slug],
    );

    /** Navigate with slug prefix */
    const nav = useCallback(
        (path: string, options?: { replace?: boolean }) => {
            navigate(p(path), options);
        },
        [navigate, p],
    );

    return { p, nav, slug };
}

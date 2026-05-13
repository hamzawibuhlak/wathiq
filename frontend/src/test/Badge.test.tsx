import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
    it('يعرض النص الداخلي', () => {
        render(<Badge>مفتوح</Badge>);
        expect(screen.getByText('مفتوح')).toBeInTheDocument();
    });

    it('يُطبّق variant الافتراضي', () => {
        const { container } = render(<Badge>نص</Badge>);
        expect(container.firstChild).toHaveClass('bg-primary');
    });

    it('يُطبّق variant=success', () => {
        const { container } = render(<Badge variant="success">مكتمل</Badge>);
        expect(container.firstChild).toHaveClass('bg-green-500');
    });

    it('يُطبّق variant=destructive', () => {
        const { container } = render(<Badge variant="destructive">ملغي</Badge>);
        expect(container.firstChild).toHaveClass('bg-destructive');
    });

    it('يُطبّق variant=warning', () => {
        const { container } = render(<Badge variant="warning">معلّق</Badge>);
        expect(container.firstChild).toHaveClass('bg-yellow-500');
    });

    it('يُطبّق className إضافي', () => {
        const { container } = render(<Badge className="custom-class">نص</Badge>);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});

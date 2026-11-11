import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { controlBase } from '@/components/ui/input';

const textareaVariants = cva(cn(controlBase, 'field-sizing-content resize-y'), {
    variants: {
        size: {
            xs: 'min-h-16 px-inset-sm py-inset-xs text-xs',
            sm: 'min-h-20 px-inset-md py-inset-xs text-sm',
            md: 'min-h-24 px-inset-lg py-inset-sm text-sm',
            lg: 'min-h-28 px-inset-xl py-inset-sm text-base',
        },
    },
    defaultVariants: { size: 'md' },
});

export interface TextareaProps
    extends
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        VariantProps<typeof textareaVariants> {}

/**
 * Campo de texto multilínea (Figma: Textarea). Con `forwardRef` para React Hook Form.
 *
 * @example
 * <Textarea rows={4} {...register('mensaje')} />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, size, ...props }, ref) => (
        <textarea
            ref={ref}
            data-slot="textarea"
            className={cn(textareaVariants({ size }), className)}
            {...props}
        />
    ),
);
Textarea.displayName = 'Textarea';

export { Textarea };

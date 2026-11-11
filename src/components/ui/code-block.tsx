'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/button';

type TokenType = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'variable' | 'plain';

const tokenClass: Record<TokenType, string> = {
    keyword: 'text-syntax-keyword',
    string: 'text-syntax-string',
    number: 'text-syntax-number',
    comment: 'text-syntax-comment italic',
    function: 'text-syntax-function',
    variable: 'text-syntax-variable',
    plain: '',
};

const KEYWORDS =
    /^(const|let|var|function|return|if|else|for|while|import|from|export|default|async|await|new|class|type|interface|true|false|null|undefined)$/;

const TOKEN_RE =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

/**
 * Trocea código JS/TS en tokens para colorearlos con `--syntax-*`.
 * Es un resaltado sencillo, suficiente para ejemplos cortos.
 *
 * @param code - Código fuente.
 * @returns Lista de fragmentos con su tipo.
 */
function tokenize(code: string): { text: string; type: TokenType }[] {
    const out: { text: string; type: TokenType }[] = [];
    let last = 0;
    const re = new RegExp(TOKEN_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
        const i = m.index;
        if (i > last) out.push({ text: code.slice(last, i), type: 'plain' });
        let type: TokenType = 'plain';
        if (m[1]) type = 'comment';
        else if (m[2]) type = 'string';
        else if (m[3]) type = 'number';
        else if (m[4]) {
            if (KEYWORDS.test(m[4])) type = 'keyword';
            else if (code[i + m[4].length] === '(') type = 'function';
            else type = 'variable';
        }
        out.push({ text: m[0], type });
        last = i + m[0].length;
    }
    if (last < code.length) out.push({ text: code.slice(last), type: 'plain' });
    return out;
}

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Código a mostrar. */
    code: string;
    /** Lenguaje que se enseña en la cabecera ("tsx"). */
    language?: string;
    /** Muestra el número de línea. */
    showLineNumbers?: boolean;
    /** Muestra el botón de copiar. */
    copyable?: boolean;
    /** Versión compacta sin cabecera para fragmentos cortos (Figma: type=inline). */
    inline?: boolean;
}

/**
 * Bloque de código con resaltado y botón de copiar (Figma: CodeBlock).
 *
 * @example
 * <CodeBlock language="tsx" code={`<Button variant="brand">Comprar</Button>`} />
 */
const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
    (
        {
            className,
            code,
            language,
            showLineNumbers = false,
            copyable = true,
            inline = false,
            ...props
        },
        ref,
    ) => {
        const [copied, setCopied] = React.useState(false);
        const lines = React.useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);

        const copy = async () => {
            try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                setCopied(false);
            }
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'overflow-hidden border border-border bg-muted text-sm',
                    inline ? 'rounded-sm' : 'rounded-lg',
                    className,
                )}
                {...props}
            >
                {!inline && (language || copyable) && (
                    <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-inset-sm">
                        <span className="font-mono text-xs text-muted-foreground">{language}</span>
                        {copyable && (
                            <IconButton
                                size="xs"
                                variant="ghost"
                                aria-label={copied ? 'Copiado' : 'Copiar código'}
                                onClick={copy}
                            >
                                {copied ? <Check /> : <Copy />}
                            </IconButton>
                        )}
                    </div>
                )}
                <pre
                    className={cn(
                        'overflow-x-auto font-mono',
                        inline ? 'px-inset-xs py-0.5 leading-5' : 'p-inset-sm leading-6',
                    )}
                >
                    <code>
                        {lines.map((line, n) => (
                            <span key={n} className="block">
                                {showLineNumbers && (
                                    <span
                                        aria-hidden="true"
                                        className="mr-4 inline-block w-6 text-right text-muted-foreground select-none"
                                    >
                                        {n + 1}
                                    </span>
                                )}
                                {tokenize(line).map((t, k) => (
                                    <span key={k} className={tokenClass[t.type]}>
                                        {t.text}
                                    </span>
                                ))}
                                {line === '' && '\n'}
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        );
    },
);
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };

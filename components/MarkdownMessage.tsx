'use client';

import React from 'react';

interface MarkdownMessageProps {
    content: string;
    className?: string;
    isUserMessage?: boolean;
}

/**
 * Lightweight markdown renderer for chat messages.
 * Supports: **bold**, *italic*, `code`, - bullet lists, numbered lists, [links](url), and line breaks.
 *
 * Used by the ChatWidget so the AI assistant can return formatted answers
 * without us pulling in a full markdown library.
 */
export default function MarkdownMessage({ content, className = '', isUserMessage = false }: MarkdownMessageProps) {
    if (!content) return null;

    const blocks = parseBlocks(content);

    return (
        <div className={`markdown-msg space-y-1.5 ${className}`}>
            {blocks.map((block, i) => {
                if (block.type === 'list') {
                    return (
                        <ul
                            key={i}
                            className={`list-disc pl-4 space-y-1 ${
                                isUserMessage ? 'marker:text-brand-nude' : 'marker:text-brand-champagne'
                            }`}
                        >
                            {block.items.map((item, j) => (
                                <li key={j} className="text-sm leading-relaxed">
                                    <InlineMarkdown text={item} isUser={isUserMessage} />
                                </li>
                            ))}
                        </ul>
                    );
                }
                if (block.type === 'numbered-list') {
                    return (
                        <ol
                            key={i}
                            className={`list-decimal pl-4 space-y-1 ${
                                isUserMessage ? 'marker:text-brand-nude' : 'marker:text-brand-champagne'
                            }`}
                        >
                            {block.items.map((item, j) => (
                                <li key={j} className="text-sm leading-relaxed">
                                    <InlineMarkdown text={item} isUser={isUserMessage} />
                                </li>
                            ))}
                        </ol>
                    );
                }
                if (block.type === 'paragraph') {
                    if (!block.text.trim()) return null;
                    return (
                        <p key={i} className="text-sm leading-relaxed">
                            <InlineMarkdown text={block.text} isUser={isUserMessage} />
                        </p>
                    );
                }
                return null;
            })}
        </div>
    );
}

type Block =
    | { type: 'list'; items: string[] }
    | { type: 'numbered-list'; items: string[] }
    | { type: 'paragraph'; text: string };

function parseBlocks(content: string): Block[] {
    const lines = content.split('\n');
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const bulletMatch = line.match(/^\s*[-*•]\s+(.+)/);
        const numberedMatch = line.match(/^\s*\d+[.)]\s+(.+)/);

        if (bulletMatch) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*[-*•]\s+(.+)/);
                if (!m) break;
                items.push(m[1]);
                i++;
            }
            blocks.push({ type: 'list', items });
        } else if (numberedMatch) {
            const items: string[] = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*\d+[.)]\s+(.+)/);
                if (!m) break;
                items.push(m[1]);
                i++;
            }
            blocks.push({ type: 'numbered-list', items });
        } else {
            const paraLines: string[] = [];
            while (i < lines.length) {
                const nextLine = lines[i];
                if (nextLine.match(/^\s*[-*•]\s+/) || nextLine.match(/^\s*\d+[.)]\s+/)) break;
                paraLines.push(nextLine);
                i++;
            }
            const text = paraLines.join('\n');
            if (text.trim()) {
                blocks.push({ type: 'paragraph', text });
            }
        }
    }

    return blocks;
}

function InlineMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
    const elements: React.ReactNode[] = [];
    // Regex matches: **bold**, *italic*, `code`, [link](url)
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(text.slice(lastIndex, match.index));
        }

        if (match[1]) {
            elements.push(
                <strong key={match.index} className="font-semibold">
                    {match[2]}
                </strong>,
            );
        } else if (match[3]) {
            elements.push(<em key={match.index}>{match[4]}</em>);
        } else if (match[5]) {
            elements.push(
                <code
                    key={match.index}
                    className={`px-1 py-0.5 rounded text-xs font-mono ${
                        isUser ? 'bg-brand-cocoa/35 text-white' : 'bg-brand-nude/60 text-brand-cocoa'
                    }`}
                >
                    {match[6]}
                </code>,
            );
        } else if (match[7]) {
            const safeHref = sanitizeHref(match[9]);
            if (safeHref) {
                elements.push(
                    <a
                        key={match.index}
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${
                            isUser ? 'text-brand-nude hover:text-white' : 'text-brand-espresso hover:text-brand-cocoa'
                        }`}
                    >
                        {match[8]}
                    </a>,
                );
            } else {
                // Unsafe scheme — render as plain text so we don't create a clickable XSS sink.
                elements.push(<span key={match.index}>{match[8]}</span>);
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }

    return <>{elements}</>;
}

/**
 * Returns a safe href, or null if the URL uses a dangerous scheme.
 *
 * Allowed: relative paths starting with "/", http(s):, mailto:, tel:.
 * Blocked: javascript:, data:, vbscript:, file:, protocol-relative URLs.
 *
 * Critical for chatbot output because the LLM (or an indirect prompt
 * injection in retrieved context) can produce arbitrary markdown links.
 */
function sanitizeHref(raw: string): string | null {
    if (!raw) return null;
    const url = raw.trim();
    if (!url) return null;
    if (url.startsWith('//')) return null;
    if (url.startsWith('/')) return url;

    const colon = url.indexOf(':');
    if (colon === -1) {
        return `https://${url}`;
    }
    const scheme = url.slice(0, colon).toLowerCase();
    if (scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel') {
        return url;
    }
    return null;
}

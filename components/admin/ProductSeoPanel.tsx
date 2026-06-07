'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { APP_TITLE } from '@/lib/brand';
import { slugify, sanitizeSlugInput, validateSlug, getSlugLengthStatus } from '@/lib/slug';

type ProductSeoPanelProps = {
    productName: string;
    description: string;
    price?: string;
    images: { url: string }[];
    seoTitle: string;
    setSeoTitle: (value: string) => void;
    metaDescription: string;
    setMetaDescription: (value: string) => void;
    urlSlug: string;
    setUrlSlug: (value: string) => void;
    keywords: string;
    setKeywords: (value: string) => void;
    productId?: string;
    slugManuallyEdited: boolean;
    setSlugManuallyEdited: (value: boolean) => void;
};

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://veecare.shop').replace(/\/+$/, '');

function CharCounter({
    current,
    recommended,
    max,
}: {
    current: number;
    recommended: number;
    max: number;
}) {
    const status = getSlugLengthStatus(current, 1, recommended);
    const color =
        status === 'good'
            ? 'text-green-600'
            : status === 'warn'
              ? 'text-amber-600'
              : current > max
                ? 'text-red-600'
                : 'text-gray-500';

    return (
        <p className={`text-sm mt-2 ${color}`}>
            {current}/{max} characters
            {current > 0 && current <= recommended && (
                <span className="ml-2 text-green-600 font-medium">Good length</span>
            )}
            {current > recommended && current <= max && (
                <span className="ml-2 text-amber-600 font-medium">A bit long — may be truncated</span>
            )}
            {current > max && (
                <span className="ml-2 text-red-600 font-medium">Too long — will be cut off in search</span>
            )}
            {current === 0 && (
                <span className="ml-2">Recommended: up to {recommended} characters</span>
            )}
        </p>
    );
}

export default function ProductSeoPanel({
    productName,
    description,
    price,
    images,
    seoTitle,
    setSeoTitle,
    metaDescription,
    setMetaDescription,
    urlSlug,
    setUrlSlug,
    keywords,
    setKeywords,
    productId,
    slugManuallyEdited,
    setSlugManuallyEdited,
}: ProductSeoPanelProps) {
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [slugMessage, setSlugMessage] = useState('');

    const displayTitle = seoTitle.trim() || productName.trim() || 'Product title';
    const displayDescription =
        metaDescription.trim() ||
        description.trim().slice(0, 160) ||
        `Shop ${productName || 'this product'} at ${APP_TITLE} — feminine care & wellness in Ghana.`;
    const previewImage = images[0]?.url;
    const slugValidation = validateSlug(urlSlug);
    const productUrl = urlSlug ? `${SITE_URL}/product/${urlSlug}` : '';

    const seoChecklist = useMemo(
        () => [
            {
                label: 'Page title set',
                ok: displayTitle.length >= 10,
            },
            {
                label: 'Meta description set',
                ok: displayDescription.length >= 50,
            },
            {
                label: 'URL slug is valid',
                ok: slugValidation.valid,
            },
            {
                label: 'Slug is unique',
                ok: slugStatus === 'available' || (slugStatus === 'idle' && !!productId && slugValidation.valid),
            },
            {
                label: 'Keywords added',
                ok: keywords.split(',').map((k) => k.trim()).filter(Boolean).length > 0,
            },
        ],
        [displayTitle, displayDescription, slugValidation.valid, slugStatus, productId, keywords],
    );

    const seoScore = seoChecklist.filter((item) => item.ok).length;

    useEffect(() => {
        if (!urlSlug.trim()) {
            setSlugStatus('idle');
            setSlugMessage('');
            return;
        }

        const validation = validateSlug(urlSlug);
        if (!validation.valid) {
            setSlugStatus('invalid');
            setSlugMessage(validation.message || 'Invalid slug');
            return;
        }

        const timer = setTimeout(async () => {
            setSlugStatus('checking');
            let query = supabase
                .from('products')
                .select('id')
                .eq('slug', urlSlug.trim())
                .limit(1);

            const { data, error } = await query;

            if (error) {
                setSlugStatus('idle');
                setSlugMessage('Could not verify slug availability');
                return;
            }

            const taken = data?.some((row) => row.id !== productId);
            if (taken) {
                setSlugStatus('taken');
                setSlugMessage('This slug is already used by another product');
            } else {
                setSlugStatus('available');
                setSlugMessage('Slug is available');
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [urlSlug, productId]);

    const autoFillSeo = () => {
        if (productName.trim()) {
            setSeoTitle(`${productName.trim()} | ${APP_TITLE}`);
        }
        if (description.trim()) {
            setMetaDescription(description.trim().slice(0, 160));
        } else if (productName.trim()) {
            setMetaDescription(
                `Shop ${productName.trim()} at ${APP_TITLE}. Feminine care & wellness delivered across Ghana — discreet packaging & secure checkout.`,
            );
        }
        if (productName.trim() && !slugManuallyEdited) {
            setUrlSlug(slugify(productName));
        }
        if (productName.trim() && !keywords.trim()) {
            const words = productName
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => w.length > 3)
                .slice(0, 5);
            if (words.length) setKeywords(words.join(', '));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Search Engine Optimization</h3>
                    <p className="text-gray-600">
                        Control how this product appears on Google, WhatsApp link previews, and social shares.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={autoFillSeo}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:border-brand-espresso hover:bg-brand-nude/30 transition-colors whitespace-nowrap"
                >
                    <i className="ri-magic-line" />
                    Auto-fill from product
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Page Title</label>
                        <input
                            type="text"
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            maxLength={70}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                            placeholder={productName ? `${productName} | ${APP_TITLE}` : 'SEO-friendly title for Google'}
                        />
                        <CharCounter current={seoTitle.length || displayTitle.length} recommended={60} max={70} />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Meta Description</label>
                        <textarea
                            rows={4}
                            maxLength={320}
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso resize-none"
                            placeholder="Short summary that appears under your title in Google search results"
                        />
                        <CharCounter
                            current={metaDescription.length || displayDescription.length}
                            recommended={160}
                            max={320}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">URL Slug</label>
                        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
                            <div className="flex flex-1 min-w-0">
                                <span className="text-gray-600 bg-gray-100 px-3 py-3 border-2 border-r-0 border-gray-300 rounded-l-lg text-sm whitespace-nowrap shrink-0">
                                    {SITE_URL.replace(/^https?:\/\//, '')}/product/
                                </span>
                                <input
                                    type="text"
                                    value={urlSlug}
                                    onChange={(e) => {
                                        setSlugManuallyEdited(true);
                                        setUrlSlug(sanitizeSlugInput(e.target.value));
                                    }}
                                    className="flex-1 min-w-0 px-4 py-3 border-2 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso font-mono text-sm"
                                    placeholder="herbal-yoni-wash"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (productName.trim()) {
                                        setSlugManuallyEdited(false);
                                        setUrlSlug(slugify(productName));
                                    }
                                }}
                                className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-brand-espresso hover:bg-brand-nude/30 transition-colors text-sm font-semibold whitespace-nowrap"
                                title="Regenerate slug from product name"
                            >
                                <i className="ri-refresh-line mr-1" />
                                Regenerate
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            {slugStatus === 'checking' && (
                                <span className="text-gray-500 flex items-center gap-1">
                                    <i className="ri-loader-4-line animate-spin" /> Checking availability…
                                </span>
                            )}
                            {slugStatus === 'available' && (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <i className="ri-check-line" /> {slugMessage}
                                </span>
                            )}
                            {slugStatus === 'taken' && (
                                <span className="text-red-600 font-medium flex items-center gap-1">
                                    <i className="ri-error-warning-line" /> {slugMessage}
                                </span>
                            )}
                            {slugStatus === 'invalid' && (
                                <span className="text-red-600 font-medium flex items-center gap-1">
                                    <i className="ri-error-warning-line" /> {slugMessage}
                                </span>
                            )}
                        </div>
                        {productUrl && slugValidation.valid && (
                            <p className="text-xs text-gray-500 mt-2 break-all">
                                Live URL:{' '}
                                <Link href={`/product/${urlSlug}`} target="_blank" className="text-brand-espresso hover:underline font-medium">
                                    {productUrl}
                                </Link>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Keywords / Tags</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-espresso"
                            placeholder="feminine wash, herbal care, yoni health"
                        />
                        <p className="text-sm text-gray-500 mt-2">Comma-separated. Used for internal search and site discovery.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <i className="ri-google-fill text-lg text-gray-700" />
                            <span className="text-sm font-semibold text-gray-900">Google Search Preview</span>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-500 mb-1">{SITE_URL.replace(/^https?:\/\//, '')} › product › …</p>
                            <p className="text-[#1a0dab] text-xl leading-snug hover:underline cursor-default truncate">
                                {displayTitle.slice(0, 70)}
                            </p>
                            <p className="text-sm text-[#006621] mt-1 truncate">
                                {productUrl || `${SITE_URL}/product/your-product-slug`}
                            </p>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                                {displayDescription.slice(0, 160)}
                                {displayDescription.length > 160 ? '…' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                            <i className="ri-share-line text-lg text-gray-700" />
                            <span className="text-sm font-semibold text-gray-900">Social / WhatsApp Preview</span>
                        </div>
                        <div className="p-4">
                            {previewImage ? (
                                <div className="aspect-[1.91/1] bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-200">
                                    <img src={previewImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="aspect-[1.91/1] bg-gray-100 rounded-lg mb-3 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                                    Add a product image for rich link previews
                                </div>
                            )}
                            <p className="text-xs text-gray-500 uppercase tracking-wide">{SITE_URL.replace(/^https?:\/\//, '')}</p>
                            <p className="font-semibold text-gray-900 mt-1 line-clamp-2">{displayTitle}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{displayDescription.slice(0, 120)}</p>
                            {price && (
                                <p className="text-sm font-semibold text-brand-espresso mt-2">GH₵{Number(price).toFixed(2)}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-900">SEO Health</h4>
                            <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    seoScore >= 4
                                        ? 'bg-green-100 text-green-700'
                                        : seoScore >= 2
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {seoScore}/{seoChecklist.length}
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {seoChecklist.map((item) => (
                                <li key={item.label} className="flex items-center gap-2 text-sm">
                                    <i
                                        className={`${item.ok ? 'ri-check-line text-green-600' : 'ri-close-line text-gray-400'} text-base`}
                                    />
                                    <span className={item.ok ? 'text-gray-800' : 'text-gray-500'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

/**
 * Returns the canonical Albion Online official Render CDN URL for an item.
 * e.g. "T4_MAIN_SWORD" -> "https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png"
 * e.g. "/items/T4_MAIN_SWORD.png" -> "https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png"
 * e.g. "T5_ORE_LEVEL1_1.png" -> "https://render.albiononline.com/v1/item/T5_ORE_LEVEL1@1.png"
 */
export function getAlbionCdnUrl(itemIdentifier) {
  if (!itemIdentifier) return 'https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png';
  let clean = String(itemIdentifier).trim();
  // Strip leading directory paths (e.g. /items/ or items\)
  clean = clean.replace(/^.*[\\\/]/, '').replace(/\.png$/i, '');
  // Map local filesystem names like T5_ORE_LEVEL1_1 to CDN format T5_ORE_LEVEL1@1
  clean = clean.replace(/_LEVEL([1-4])_([1-4])$/i, '_LEVEL$1@$2');
  return `https://render.albiononline.com/v1/item/${clean}.png`;
}

/**
 * Returns the local filesystem fallback path in /items/
 */
export function getLocalItemUrl(itemIdentifier) {
  if (!itemIdentifier) return '/items/T4_MAIN_SWORD.png';
  let clean = String(itemIdentifier).trim();
  clean = clean.replace(/^.*[\\\/]/, '').replace(/\.png$/i, '');
  return `/items/${clean}.png`;
}

/**
 * ItemIcon Component
 * Provides seamless hybrid image loading:
 * 1. In production (Vercel): Loads directly from Albion's fast Cloudflare CDN (0ms setup, no heavy asset hosting).
 * 2. In local development: Attempts local cached /items/ first for offline speed, falling back to CDN on error.
 * 3. Gracefully shows an Albion-themed placeholder if the item doesn't exist on CDN or locally.
 */
export default function ItemIcon({
  src,
  itemId,
  alt = 'Albion Item',
  className = 'w-full h-full object-contain',
  loading = 'lazy',
  fallbackIcon = 'T4_MAIN_SWORD',
  onError,
  ...props
}) {
  const rawIdentifier = itemId || src || fallbackIcon;
  const localUrl = getLocalItemUrl(rawIdentifier);
  const cdnUrl = getAlbionCdnUrl(rawIdentifier);

  // In production builds (or when VITE_USE_CDN_ICONS is enabled), start directly with CDN
  const forceCdn = import.meta.env.VITE_USE_CDN_ICONS === 'true';
  const preferCdn = import.meta.env.PROD || forceCdn;

  const [currentSrc, setCurrentSrc] = useState(preferCdn ? cdnUrl : localUrl);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [isBroken, setIsBroken] = useState(false);

  useEffect(() => {
    setCurrentSrc(preferCdn ? cdnUrl : localUrl);
    setHasTriedFallback(false);
    setIsBroken(false);
  }, [rawIdentifier, preferCdn]);

  const handleImageError = (e) => {
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      // Flip from local to CDN (or from CDN to local if CDN timed out)
      const nextSrc = currentSrc === localUrl ? cdnUrl : localUrl;
      setCurrentSrc(nextSrc);
    } else {
      setIsBroken(true);
      if (onError) onError(e);
    }
  };

  if (isBroken) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900/90 border border-slate-700/60 rounded text-slate-500 font-mono text-[9px] select-none p-0.5 ${className}`}
        title={alt}
      >
        <span className="opacity-60">?</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleImageError}
      {...props}
    />
  );
}

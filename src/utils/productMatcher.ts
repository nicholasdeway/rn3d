import { Product } from '../types';

/**
 * Robust, prioritized product matcher.
 * Prevents cloned products (e.g. "Produto (Cópia)") from falsely matching the original product
 * due to loose string substring matching.
 */
export function findMatchingProduct(
  products: Product[] | undefined | null,
  item: { productId?: string; description?: string; productName?: string } | undefined | null
): Product | undefined {
  if (!products || products.length === 0 || !item) return undefined;

  const desc = (item.description || item.productName || '').trim();
  const descLower = desc.toLowerCase();

  // 1. Match by exact Product ID
  if (item.productId) {
    const byId = products.find((p) => p.id === item.productId);
    if (byId) return byId;
  }

  // Extract SKU from item description if formatted as "... (SKU: XXXX)" or "SKU: XXXX"
  let extractedSku = '';
  const skuMatch = desc.match(/\(SKU:\s*([^)]+)\)/i) || desc.match(/SKU:\s*([^\s)]+)/i);
  if (skuMatch && skuMatch[1]) {
    extractedSku = skuMatch[1].trim().toLowerCase();
  }

  // 2. Match by extracted SKU (exact match)
  if (extractedSku) {
    const bySku = products.find((p) => p.sku && p.sku.trim().toLowerCase() === extractedSku);
    if (bySku) return bySku;
  }

  // 3. Match by product's full SKU appearing inside description
  if (desc) {
    // Sort products by longest SKU first so specific copy SKUs (e.g. "5395-COPY-1234") match before short SKUs ("5395")
    const sortedBySkuLen = [...products]
      .filter((p) => p.sku && p.sku.trim().length > 0)
      .sort((a, b) => b.sku.length - a.sku.length);

    const bySkuSub = sortedBySkuLen.find((p) => {
      const pSkuLower = p.sku.trim().toLowerCase();
      return descLower.includes(pSkuLower);
    });
    if (bySkuSub) return bySkuSub;
  }

  // Clean description by stripping (SKU: ...)
  const cleanDescLower = desc.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

  // 4. Match by exact Product Name (with cleaned description)
  if (cleanDescLower) {
    const byNameExact = products.find(
      (p) => p.name && p.name.trim().toLowerCase() === cleanDescLower
    );
    if (byNameExact) return byNameExact;
  }

  // 5. Match by exact Product Name (with raw description)
  if (descLower) {
    const byFullDescExact = products.find(
      (p) => p.name && p.name.trim().toLowerCase() === descLower
    );
    if (byFullDescExact) return byFullDescExact;
  }

  // 6. Match by exact Product Name prefix (only if word-bounded or exact match)
  if (cleanDescLower) {
    // Sort products by longest name first so "Placa (Cópia)" matches before "Placa"
    const sortedByNameLen = [...products]
      .filter((p) => p.name && p.name.trim().length > 0)
      .sort((a, b) => b.name.length - a.name.length);

    const byPrefix = sortedByNameLen.find((p) => {
      const pNameLower = p.name.trim().toLowerCase();
      if (cleanDescLower === pNameLower) return true;
      if (cleanDescLower.startsWith(pNameLower)) {
        const nextChar = cleanDescLower.charAt(pNameLower.length);
        return nextChar === ' ' || nextChar === '(' || nextChar === '-' || nextChar === ':';
      }
      return false;
    });
    if (byPrefix) return byPrefix;
  }

  return undefined;
}

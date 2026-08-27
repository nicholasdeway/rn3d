import { useState, useEffect } from 'react';
import { Product } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import { CATALOG_PRODUCTS } from '../data/catalogProducts';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  syncMissingProductsToSupabase,
} from '../services/productsService';

import { compressImage } from '../utils/imageCompressor';

export function useProducts(user: any, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = getStorageParsed<Product[]>('rn3d_products', [], true);
    if (!cached || cached.length === 0) return [];
    return cached.map((p) => {
      const cat = CATALOG_PRODUCTS.find(
        (c) => c.sku && p.sku && c.sku.trim().toLowerCase() === p.sku.trim().toLowerCase()
      );
      if (cat && (cat.standardPrice !== undefined || cat.cashPrice !== undefined)) {
        return {
          ...p,
          standardPrice: cat.standardPrice !== undefined ? cat.standardPrice : p.standardPrice,
          cashPrice: cat.cashPrice !== undefined ? cat.cashPrice : (p.cashPrice ?? p.standardPrice),
        };
      }
      return p;
    });
  });

  useEffect(() => {
    if (products && products.length > 0) {
      safeSetLocalStorage('rn3d_products', JSON.stringify(products));
    }
  }, [products]);

  // Load directly from Supabase on mount and merge cleanly
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchProducts()
      .then((dbProducts) => {
        if (isMounted && Array.isArray(dbProducts) && dbProducts.length > 0) {
          setProducts((prev) => {
            const dbIds = new Set(dbProducts.map((p) => p.id));
            const extraLocal = prev.filter((p) => !dbIds.has(p.id));
            return [...dbProducts, ...extraLocal];
          });
        }
      })
      .catch((err) => console.error('Erro ao carregar produtos do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddProduct = async (newProd: Product) => {
    let finalProd = newProd;
    if (newProd.imageUrl && newProd.imageUrl.startsWith('data:image/')) {
      const compressed = await compressImage(newProd.imageUrl, 300, 300, 0.7);
      finalProd = { ...newProd, imageUrl: compressed };
    }
    setProducts((prev) => [finalProd, ...prev]);
    showToast(`Produto "${finalProd.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createProduct(finalProd);
      if (savedInDb && savedInDb.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === finalProd.id ? { ...p, id: savedInDb.id } : p))
        );
      }
    } catch (err: any) {
      console.error('Erro ao salvar produto no Supabase:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    let finalProd = updatedProduct;
    if (updatedProduct.imageUrl && updatedProduct.imageUrl.startsWith('data:image/')) {
      const compressed = await compressImage(updatedProduct.imageUrl, 300, 300, 0.7);
      finalProd = { ...updatedProduct, imageUrl: compressed };
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === finalProd.id ? finalProd : p))
    );
    showToast(`Produto "${finalProd.name}" atualizado com sucesso!`, 'success');
    try {
      await updateProduct(finalProd.id, finalProd);
    } catch (err) {
      console.error('Erro ao atualizar produto no Supabase:', err);
    }
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId || p.id === productId ? { ...p, currentStock: newStock } : p))
    );
    showToast('Saldo de estoque ajustado com sucesso!', 'success');
  };

  const handleSyncProductsToSupabase = async () => {
    try {
      showToast('Sincronizando catálogo de produtos com o Supabase...', 'info');
      const pCount = await syncMissingProductsToSupabase(products);
      const dbProds = await fetchProducts();
      setProducts(dbProds);
      showToast(`✅ Sincronização de produtos concluída! (${pCount} novos registrados)`, 'success');
    } catch (err: any) {
      showToast(`Erro ao sincronizar produtos: ${err?.message || 'Falha de conexão'}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const prodName = prod ? prod.name : 'Produto';

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast(`Produto "${prodName}" excluído com sucesso!`, 'success');

    try {
      await deleteProduct(productId, prod?.sku);
    } catch (err: any) {
      console.error('Erro ao excluir produto no Supabase:', err);
      showToast(`Aviso: Erro ao excluir no Supabase (${err?.message || 'Erro RLS/Permissão'})`, 'error');
    }
  };

  return {
    products,
    setProducts,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUpdateStock,
    handleSyncProductsToSupabase,
  };
}

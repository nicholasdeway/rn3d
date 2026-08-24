import { useState, useEffect } from 'react';
import { Product } from '../types';
import { safeSetLocalStorage, getStorageParsed } from '../utils/storage';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  syncMissingProductsToSupabase,
} from '../services/productsService';

export function useProducts(user: any, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [products, setProducts] = useState<Product[]>(() =>
    getStorageParsed<Product[]>('rn3d_products', [])
  );

  useEffect(() => {
    if (products) {
      const sanitizedProducts = products.map((p) => {
        if (p.imageUrl && (p.imageUrl.length > 300 || p.imageUrl.startsWith('data:image/'))) {
          return { ...p, imageUrl: '' };
        }
        return p;
      });
      safeSetLocalStorage('rn3d_products', JSON.stringify(sanitizedProducts));
    }
  }, [products]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchProducts()
      .then((dbProducts) => {
        if (isMounted && Array.isArray(dbProducts)) {
          setProducts(dbProducts);
        }
      })
      .catch((err) => console.error('Erro ao carregar produtos do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Produto "${newProd.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createProduct(newProd);
      if (savedInDb && savedInDb.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === newProd.id ? { ...p, id: savedInDb.id } : p))
        );
      }
    } catch (err: any) {
      console.error('Erro ao salvar produto no Supabase:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Produto "${updatedProduct.name}" atualizado com sucesso!`, 'success');
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
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

  return {
    products,
    setProducts,
    handleAddProduct,
    handleUpdateProduct,
    handleUpdateStock,
    handleSyncProductsToSupabase,
  };
}

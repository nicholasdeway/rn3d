import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product } from '../types';
import { uploadToSupabaseStorage } from './storageService';

export async function fetchProducts(): Promise<Product[]> {
  let localProducts: Product[] = [];
  try {
    const saved = localStorage.getItem('rn3d_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localProducts = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local products:', e);
  }

  if (!isSupabaseConfigured()) {
    return localProducts;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar produtos no Supabase:', error?.message);
    return localProducts;
  }

  const dbProducts: Product[] = data.map((row) => {
    const localMatch = localProducts.find(
      (lp) => (lp.sku && row.sku && lp.sku.toLowerCase() === row.sku.toLowerCase()) || lp.id === row.id
    );
    const resolvedImageUrl = (row.image_url && row.image_url.trim().length > 0) ? row.image_url : (localMatch?.imageUrl || '');

    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      category: row.category,
      isKeychain: row.is_keychain ?? false,
      description: row.description || '',
      storageCapacity: row.storage_capacity || '',
      imageUrl: resolvedImageUrl,
      material: row.material || 'PLA',
      color: row.color || 'Preto',
      weightGram: Number(row.weight_gram) || 0,
      lengthMm: Number(row.length_mm) || 0,
      widthMm: Number(row.width_mm) || 0,
      heightMm: Number(row.height_mm) || 0,
      avgPrintTimeMinutes: row.avg_print_time_minutes || 0,
      batchQuantity: row.batch_quantity || 1,
      estimatedCost: Number(row.estimated_cost) || 0,
      standardPrice: Number(row.standard_price) || 0,
      cashPrice: row.cash_price !== undefined ? Number(row.cash_price) : Number(row.standard_price) || 0,
      minPrice: Number(row.min_price) || 0,
      suggestedRetailPrice: Number(row.suggested_retail_price) || 0,
      currentStock: row.current_stock || 0,
      minStock: row.min_stock || 5,
      allowsCustomization: row.allows_customization ?? false,
      customizationOptions: {
        name: true,
        logo: false,
        color: true,
        text: false,
        other: false,
      },
      status: row.status as 'Ativo' | 'Inativo',
    };
  });

  try {
    localStorage.setItem('rn3d_products', JSON.stringify(dbProducts));
  } catch (e) {}

  return dbProducts;
}

export async function syncMissingProductsToSupabase(missingProducts: Product[]): Promise<number> {
  if (!isSupabaseConfigured() || missingProducts.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('products').select('sku');
    const existingSkus = new Set((dbData || []).map((row) => (row.sku || '').toLowerCase()));

    const toInsert = missingProducts.filter((p) => p.sku && !existingSkus.has(p.sku.toLowerCase()));
    if (toInsert.length === 0) return 0;

    const rows = await Promise.all(
      toInsert.map(async (p) => {
        let imageUrl = p.imageUrl || '';
        if (imageUrl.startsWith('data:')) {
          imageUrl = await uploadToSupabaseStorage(imageUrl, 'products', p.sku || p.name || 'product');
        }
        return {
          name: p.name,
          sku: p.sku,
          category: p.category || 'Chaveiro',
          is_keychain: p.isKeychain ?? false,
          description: p.description || '',
          image_url: imageUrl,
          material: p.material || 'PLA',
          color: p.color || 'Preto',
          weight_gram: p.weightGram || 50,
          standard_price: p.standardPrice || 0,
          cash_price: p.cashPrice ?? p.standardPrice ?? 0,
          min_price: p.minPrice || 0,
          suggested_retail_price: p.suggestedRetailPrice || 0,
          current_stock: p.currentStock ?? 20,
          min_stock: p.minStock || 5,
          allows_customization: p.allowsCustomization ?? true,
          status: p.status || 'Ativo',
        };
      })
    );

    let { error } = await supabase.from('products').insert(rows);

    if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
      // Retry without cash_price column if it does not exist in Supabase schema
      const strippedRows = rows.map(({ cash_price, ...rest }: any) => rest);
      const retry = await supabase.from('products').insert(strippedRows);
      error = retry.error;
    }

    if (error) {
      console.warn('Aviso na sincronização de lote com Supabase:', error.message);
      throw error;
    } else {
      console.log(`✅ Sincronizados ${rows.length} produtos adicionais no Supabase!`);
      return rows.length;
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de produtos:', err);
    throw err;
  }
}

export async function createProduct(product: Partial<Product>): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let imageUrl = product.imageUrl || '';
  if (imageUrl.startsWith('data:')) {
    imageUrl = await uploadToSupabaseStorage(imageUrl, 'products', product.sku || product.name || 'product');
  }

  const payload: any = {
    name: product.name,
    sku: product.sku,
    category: product.category || 'Geral',
    is_keychain: product.isKeychain ?? false,
    description: product.description || '',
    image_url: imageUrl,
    material: product.material || 'PLA',
    color: product.color || 'Preto',
    weight_gram: product.weightGram || 0,
    standard_price: product.standardPrice || 0,
    cash_price: product.cashPrice ?? product.standardPrice ?? 0,
    min_price: product.minPrice || 0,
    suggested_retail_price: product.suggestedRetailPrice || 0,
    current_stock: product.currentStock ?? 0,
    min_stock: product.minStock || 5,
    allows_customization: product.allowsCustomization ?? false,
    status: product.status || 'Ativo',
  };

  if (product.storageCapacity) {
    payload.storage_capacity = product.storageCapacity;
  }

  let { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single();

  // Retry stripped payload if custom columns (like cash_price or storage_capacity) don't exist in Supabase DB schema yet
  if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
    console.warn('Tentando salvar produto com colunas padrão devido à estrutura do Supabase:', error.message);
    delete payload.storage_capacity;
    delete payload.cash_price;

    const retry = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao cadastrar produto no Supabase:', error.message);
    throw error;
  }

  return data as any;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let imageUrl = updates.imageUrl;
  if (imageUrl && imageUrl.startsWith('data:')) {
    imageUrl = await uploadToSupabaseStorage(imageUrl, 'products', updates.sku || updates.name || id);
  }

  const payload: any = {
    name: updates.name,
    sku: updates.sku,
    category: updates.category,
    is_keychain: updates.isKeychain,
    description: updates.description,
    image_url: imageUrl,
    material: updates.material,
    color: updates.color,
    standard_price: updates.standardPrice,
    cash_price: updates.cashPrice,
    current_stock: updates.currentStock,
    status: updates.status,
  };

  if (updates.storageCapacity) {
    payload.storage_capacity = updates.storageCapacity;
  }

  const isLocalId = !id || id.startsWith('prod-') || id.length < 30;

  let query = supabase.from('products').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else if (updates.sku) {
    query = query.eq('sku', updates.sku);
  }

  let { data, error } = await query.select();

  if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
    delete payload.storage_capacity;
    delete payload.cash_price;

    let retryQuery = supabase.from('products').update(payload);
    if (!isLocalId) {
      retryQuery = retryQuery.eq('id', id);
    } else if (updates.sku) {
      retryQuery = retryQuery.eq('sku', updates.sku);
    }

    const retry = await retryQuery.select();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao atualizar produto no Supabase:', error.message);
    if (error.message.includes('row-level security')) {
      throw new Error('Política RLS no Supabase bloqueou a edição. Execute o SQL de permissão pública no SQL Editor do Supabase.');
    }
    throw error;
  }

  return (data && data[0]) ? (data[0] as any) : null;
}

export async function deleteProduct(id: string, sku?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const isLocalId = !id || id.startsWith('prod-') || id.length < 30;

  let query = supabase.from('products').delete();
  if (!isLocalId) {
    query = query.eq('id', id);
  } else if (sku) {
    query = query.eq('sku', sku);
  } else {
    query = query.eq('id', id);
  }

  const { error } = await query;
  if (error) {
    console.error('Erro ao deletar produto no Supabase:', error.message);
    if (error.message.includes('row-level security')) {
      throw new Error('Política RLS no Supabase bloqueou a exclusão. Verifique as permissões de DELETE no Supabase.');
    }
    throw error;
  }

  return true;
}

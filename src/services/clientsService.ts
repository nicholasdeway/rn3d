import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client } from '../types';

export async function fetchClients(): Promise<Client[]> {
  let localClients: Client[] = [];
  try {
    const saved = localStorage.getItem('rn3d_clients');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localClients = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local clients:', e);
  }

  if (!isSupabaseConfigured()) {
    return localClients;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar clientes no Supabase:', error?.message);
    return localClients;
  }

  try {
    localStorage.removeItem('rn3d_client_logistics');
  } catch (e) {}

  const dbClients: Client[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    fantasyName: row.fantasy_name,
    avatarUrl: row.avatar_url || '',
    document: row.document,
    responsible: row.responsible,
    phone: row.phone,
    whatsapp: row.whatsapp || row.phone,
    email: row.email || '',
    cep: row.cep || '',
    street: row.street || '',
    number: row.number || '',
    complement: row.complement,
    neighborhood: row.neighborhood || '',
    city: row.city || '',
    state: row.state || '',
    type: row.type || 'Cliente direto',
    agreedPriceLevel: row.agreed_price_level || 'Padrão',
    visitFrequency: row.visit_frequency || '15 dias',
    defaultLogisticsType: (row.default_logistics_type || 'combustivel') as any,
    defaultLogisticsCost: row.default_logistics_cost !== null && row.default_logistics_cost !== undefined ? Number(row.default_logistics_cost) : 0,
    notes: row.notes,
    status: row.status || 'Ativo',
    productsOnSiteCount: 0,
    productsValuation: 0,
    receivableBalance: 0,
    lastVisitDate: row.last_visit_date || 'N/A',
    nextVisitDate: row.next_visit_date || 'A agendar',
    visitStatus: 'Em breve',
  }));

  try {
    localStorage.setItem('rn3d_clients', JSON.stringify(dbClients));
  } catch (e) {}

  return dbClients;
}

export async function createClient(client: Partial<Client>): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {
    name: client.name,
    fantasy_name: client.fantasyName,
    avatar_url: client.avatarUrl || '',
    document: client.document,
    responsible: client.responsible,
    phone: client.phone,
    whatsapp: client.whatsapp,
    email: client.email,
    cep: client.cep,
    street: client.street,
    number: client.number,
    complement: client.complement,
    neighborhood: client.neighborhood,
    city: client.city,
    state: client.state,
    type: client.type,
    default_logistics_type: client.defaultLogisticsType || 'combustivel',
    default_logistics_cost: client.defaultLogisticsCost ?? 0,
    status: client.status || 'Ativo',
  };

  let { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()
    .single();

  if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
    delete payload.avatar_url;
    delete payload.default_logistics_type;
    delete payload.default_logistics_cost;
    const retry = await supabase
      .from('clients')
      .insert([payload])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao cadastrar cliente:', error.message);
    throw error;
  }

  return data as any;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const payload: any = {
    name: updates.name,
    fantasy_name: updates.fantasyName,
    avatar_url: updates.avatarUrl || '',
    document: updates.document,
    responsible: updates.responsible,
    phone: updates.phone,
    whatsapp: updates.whatsapp,
    email: updates.email,
    cep: updates.cep,
    street: updates.street,
    number: updates.number,
    complement: updates.complement,
    neighborhood: updates.neighborhood,
    city: updates.city,
    state: updates.state,
    type: updates.type,
    default_logistics_type: updates.defaultLogisticsType,
    default_logistics_cost: updates.defaultLogisticsCost,
    status: updates.status,
  };

  const isLocalId = !id || id.startsWith('cli-') || id.length < 30;

  let query = supabase.from('clients').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else if (updates.name) {
    query = query.ilike('name', updates.name.trim());
  }

  let { data, error } = await query.select();

  if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
    delete payload.avatar_url;
    delete payload.default_logistics_type;
    delete payload.default_logistics_cost;
    let retryQuery = supabase.from('clients').update(payload);
    if (!isLocalId) {
      retryQuery = retryQuery.eq('id', id);
    } else if (updates.name) {
      retryQuery = retryQuery.ilike('name', updates.name.trim());
    }
    const retry = await retryQuery.select();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Erro ao atualizar cliente no Supabase:', error.message);
    throw error;
  }

  return (data && data[0]) ? (data[0] as any) : null;
}

export async function syncMissingClientsToSupabase(missingClients: Client[]): Promise<number> {
  if (!isSupabaseConfigured() || missingClients.length === 0) return 0;

  let syncedCount = 0;

  try {
    const { data: dbData } = await supabase.from('clients').select('id, name');
    const dbNamesMap = new Map((dbData || []).map((c) => [(c.name || '').toLowerCase().trim(), c]));

    for (const c of missingClients) {
      try {
        const normName = (c.name || '').toLowerCase().trim();
        const existingInDb = dbNamesMap.get(normName);

        // ONLY insert if client does NOT exist in Supabase DB at all!
        // Never overwrite existing DB records with browser state!
        if (!existingInDb) {
          await createClient(c);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Erro ao sincronizar cliente ${c.name}:`, err);
      }
    }
  } catch (err) {
    console.error('Erro na sincronização de clientes com Supabase:', err);
  }

  return syncedCount;
}

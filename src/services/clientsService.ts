import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client } from '../types';
import { uploadToSupabaseStorage } from './storageService';

/**
 * 100% Direct Supabase Postgres Fetch — Zero LocalStorage Caching
 */
export async function fetchClients(): Promise<Client[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar clientes no Supabase:', error?.message);
    return [];
  }

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

  return dbClients;
}

export async function syncMissingClientsToSupabase(missingClients: Client[]): Promise<number> {
  if (!isSupabaseConfigured() || missingClients.length === 0) return 0;

  try {
    const { data: dbData } = await supabase.from('clients').select('name, document');
    const existingNames = new Set((dbData || []).map((row) => (row.name || '').toLowerCase().trim()));

    const toInsert = missingClients.filter((c) => c.name && !existingNames.has(c.name.toLowerCase().trim()));
    if (toInsert.length === 0) return 0;

    const rows = await Promise.all(
      toInsert.map(async (c) => {
        let avatarUrl = c.avatarUrl || '';
        if (avatarUrl.startsWith('data:')) {
          avatarUrl = await uploadToSupabaseStorage(avatarUrl, 'clients', c.name || 'client');
        }

        return {
          name: c.name,
          fantasy_name: c.fantasyName || '',
          avatar_url: avatarUrl,
          document: c.document || '',
          responsible: c.responsible || '',
          phone: c.phone || '',
          whatsapp: c.whatsapp || c.phone || '',
          email: c.email || '',
          cep: c.cep || '',
          street: c.street || '',
          number: c.number || '',
          complement: c.complement || '',
          neighborhood: c.neighborhood || '',
          city: c.city || '',
          state: c.state || '',
          type: c.type || 'Cliente direto',
          agreed_price_level: c.agreedPriceLevel || 'Padrão',
          visit_frequency: c.visitFrequency || '15 dias',
          default_logistics_type: c.defaultLogisticsType || 'combustivel',
          default_logistics_cost: c.defaultLogisticsCost || 0,
          notes: c.notes || '',
          status: c.status || 'Ativo',
        };
      })
    );

    const { error } = await supabase.from('clients').insert(rows);
    if (error) {
      console.warn('Aviso na sincronização de clientes com Supabase:', error.message);
      throw error;
    } else {
      return rows.length;
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de clientes:', err);
    throw err;
  }
}

export async function createClient(client: Partial<Client>): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let avatarUrl = client.avatarUrl || '';
  if (avatarUrl.startsWith('data:')) {
    avatarUrl = await uploadToSupabaseStorage(avatarUrl, 'clients', client.name || 'client');
  }

  const payload: any = {
    name: client.name,
    fantasy_name: client.fantasyName || '',
    avatar_url: avatarUrl,
    document: client.document || '',
    responsible: client.responsible || '',
    phone: client.phone || '',
    whatsapp: client.whatsapp || client.phone || '',
    email: client.email || '',
    cep: client.cep || '',
    street: client.street || '',
    number: client.number || '',
    complement: client.complement || '',
    neighborhood: client.neighborhood || '',
    city: client.city || '',
    state: client.state || '',
    type: client.type || 'Cliente direto',
    agreed_price_level: client.agreedPriceLevel || 'Padrão',
    visit_frequency: client.visitFrequency || '15 dias',
    default_logistics_type: client.defaultLogisticsType || 'combustivel',
    default_logistics_cost: client.defaultLogisticsCost || 0,
    notes: client.notes || '',
    status: client.status || 'Ativo',
  };

  const { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar cliente no Supabase:', error.message);
    throw error;
  }

  return data as any;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let avatarUrl = updates.avatarUrl;
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    avatarUrl = await uploadToSupabaseStorage(avatarUrl, 'clients', updates.name || id);
  }

  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.fantasyName !== undefined) payload.fantasy_name = updates.fantasyName;
  if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;
  if (updates.document !== undefined) payload.document = updates.document;
  if (updates.responsible !== undefined) payload.responsible = updates.responsible;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.cep !== undefined) payload.cep = updates.cep;
  if (updates.street !== undefined) payload.street = updates.street;
  if (updates.number !== undefined) payload.number = updates.number;
  if (updates.complement !== undefined) payload.complement = updates.complement;
  if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.state !== undefined) payload.state = updates.state;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.agreedPriceLevel !== undefined) payload.agreed_price_level = updates.agreedPriceLevel;
  if (updates.visitFrequency !== undefined) payload.visit_frequency = updates.visitFrequency;
  if (updates.defaultLogisticsType !== undefined) payload.default_logistics_type = updates.defaultLogisticsType;
  if (updates.defaultLogisticsCost !== undefined) payload.default_logistics_cost = updates.defaultLogisticsCost;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.status !== undefined) payload.status = updates.status;

  const isLocalId = !id || id.startsWith('cli-') || id.length < 30;

  let query = supabase.from('clients').update(payload);
  if (!isLocalId) {
    query = query.eq('id', id);
  } else if (updates.name) {
    query = query.eq('name', updates.name);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('Erro ao atualizar cliente no Supabase:', error.message);
    throw error;
  }

  return (data && data[0]) ? (data[0] as any) : null;
}

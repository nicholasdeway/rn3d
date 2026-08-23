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
    notes: row.notes,
    status: row.status || 'Ativo',
    productsOnSiteCount: 0,
    productsValuation: 0,
    receivableBalance: 0,
    lastVisitDate: row.last_visit_date || 'N/A',
    nextVisitDate: row.next_visit_date || 'A agendar',
    visitStatus: 'Em breve',
  }));

  // Deduplicate between Supabase DB and local clients by ID and by Normalized Name
  const dbIds = new Set(dbClients.map((c) => c.id));
  const dbNamesMap = new Map(dbClients.map((c) => [(c.name || '').toLowerCase().trim(), c]));

  // Merge extra local clients if not present in DB
  const merged: Client[] = [...dbClients];

  for (const localC of localClients) {
    const normName = (localC.name || '').toLowerCase().trim();
    if (!normName) continue;

    if (dbIds.has(localC.id)) {
      continue;
    }

    if (dbNamesMap.has(normName)) {
      // If local client has avatarUrl and DB client does not, enrich DB client with avatarUrl
      const existingDbClient = dbNamesMap.get(normName)!;
      if (localC.avatarUrl && !existingDbClient.avatarUrl) {
        existingDbClient.avatarUrl = localC.avatarUrl;
      }
    } else {
      merged.push(localC);
      dbNamesMap.set(normName, localC);
    }
  }

  return merged;
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
    status: client.status || 'Ativo',
  };

  let { data, error } = await supabase
    .from('clients')
    .insert([payload])
    .select()
    .single();

  if (error && (error.message.includes('column') || error.code === 'PGRST204')) {
    delete payload.avatar_url;
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

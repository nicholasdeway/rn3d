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

  const dbIds = new Set(dbClients.map((c) => c.id));
  const extraLocal = localClients.filter((c) => !dbIds.has(c.id));

  return [...dbClients, ...extraLocal];
}

export async function createClient(client: Partial<Client>): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        name: client.name,
        fantasy_name: client.fantasyName,
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
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar cliente:', error.message);
    throw error;
  }

  return data as any;
}

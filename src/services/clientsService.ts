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

  let parsedLogistics: Record<string, { type?: string; cost?: number }> = {};
  try {
    const savedLogistics = localStorage.getItem('rn3d_client_logistics');
    if (savedLogistics) parsedLogistics = JSON.parse(savedLogistics);
  } catch (e) {
    console.error('Error reading logistics memory:', e);
  }

  const dbClients: Client[] = data.map((row) => {
    const localLogistics = parsedLogistics[row.id];
    const dbCost = row.default_logistics_cost !== null && row.default_logistics_cost !== undefined ? Number(row.default_logistics_cost) : null;
    const dbType = row.default_logistics_type;

    let finalCost = 50.0;
    if (localLogistics?.cost !== undefined) {
      finalCost = localLogistics.cost;
      if (dbCost === null || (dbCost === 50.0 && localLogistics.cost !== 50.0)) {
        updateClient(row.id, {
          defaultLogisticsCost: localLogistics.cost,
          defaultLogisticsType: (localLogistics.type || 'combustivel') as any,
        }).catch((err) => console.error('Error background syncing client logistics to DB:', err));
      }
    } else if (dbCost !== null) {
      finalCost = dbCost;
    }

    const finalType = localLogistics?.type || dbType || 'combustivel';

    return {
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
      defaultLogisticsType: finalType as any,
      defaultLogisticsCost: finalCost,
      notes: row.notes,
      status: row.status || 'Ativo',
      productsOnSiteCount: 0,
      productsValuation: 0,
      receivableBalance: 0,
      lastVisitDate: row.last_visit_date || 'N/A',
      nextVisitDate: row.next_visit_date || 'A agendar',
      visitStatus: 'Em breve',
    };
  });

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

  const extraLocal = localClients.filter(
    (c) => !dbIds.has(c.id) && !dbNamesMap.has((c.name || '').toLowerCase().trim())
  );

  if (extraLocal.length > 0) {
    syncMissingClientsToSupabase(extraLocal).catch((err) =>
      console.error('Auto sync clients error:', err)
    );
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
    default_logistics_type: client.defaultLogisticsType || 'combustivel',
    default_logistics_cost: client.defaultLogisticsCost ?? 50.0,
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
    query = query.eq('name', updates.name);
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
      retryQuery = retryQuery.eq('name', updates.name);
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
    const { data: dbData } = await supabase.from('clients').select('id, name, avatar_url, default_logistics_cost');
    const dbNamesMap = new Map((dbData || []).map((c) => [(c.name || '').toLowerCase().trim(), c]));

    for (const c of missingClients) {
      try {
        const normName = (c.name || '').toLowerCase().trim();
        const existingInDb = dbNamesMap.get(normName);

        if (existingInDb) {
          const updates: Partial<Client> = {};
          if (c.avatarUrl && !existingInDb.avatar_url) {
            updates.avatarUrl = c.avatarUrl;
          }
          if (c.defaultLogisticsCost !== undefined && c.defaultLogisticsCost !== existingInDb.default_logistics_cost) {
            updates.defaultLogisticsCost = c.defaultLogisticsCost;
            updates.defaultLogisticsType = c.defaultLogisticsType;
          }
          if (Object.keys(updates).length > 0) {
            await updateClient(existingInDb.id, updates);
            syncedCount++;
          }
        } else {
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

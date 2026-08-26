import { useState, useEffect } from 'react';
import { Client } from '../types';
import {
  fetchClients,
  createClient,
  updateClient,
} from '../services/clientsService';

export function useClients(user: any, showToast: (msg: string, type?: 'success' | 'error' | 'info') => void) {
  const [clients, setClients] = useState<Client[]>([]);

  // Load directly from Supabase on mount
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    fetchClients()
      .then((dbClients) => {
        if (isMounted && Array.isArray(dbClients)) {
          setClients(dbClients);
        }
      })
      .catch((err) => console.error('Erro ao carregar clientes do Supabase:', err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddClient = async (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`, 'success');
    try {
      const savedInDb = await createClient(newClient);
      if (savedInDb && savedInDb.id) {
        setClients((prev) =>
          prev.map((c) => (c.id === newClient.id ? { ...c, id: savedInDb.id } : c))
        );
      }
    } catch (err) {
      console.error('Erro ao salvar cliente no Supabase:', err);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    showToast(`Cadastro do cliente "${updatedClient.name}" atualizado com sucesso!`, 'success');
    try {
      await updateClient(updatedClient.id, updatedClient);
    } catch (err) {
      console.error('Erro ao atualizar cliente no Supabase:', err);
    }
  };

  return {
    clients,
    setClients,
    handleAddClient,
    handleUpdateClient,
  };
}

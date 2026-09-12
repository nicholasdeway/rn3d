export interface CnpjSocio {
  nome_socio?: string;
  nome?: string;
  qualificacao_socio?: string;
}

export interface CnpjCompanyData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  responsible?: string;
  phone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  qsa?: CnpjSocio[];
}

export async function fetchCompanyByCnpj(cnpj: string): Promise<CnpjCompanyData | null> {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) {
    return null;
  }

  // Tenta 1: BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.razao_social) {
        const firstSocio = data.qsa && data.qsa.length > 0 ? (data.qsa[0].nome_socio || data.qsa[0].nome || '') : '';
        return {
          cnpj: data.cnpj || cleanCnpj,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || data.razao_social,
          responsible: firstSocio || data.razao_social,
          phone: data.ddd_telefone_1 || data.ddd_telefone_2 || '',
          email: data.email || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || data.cidade || '',
          uf: data.uf || '',
          qsa: data.qsa || [],
        };
      }
    }
  } catch (err) {
    console.warn('BrasilAPI CNPJ lookup failed, trying MinhaReceita fallback...', err);
  }

  // Fallback 2: Minha Receita
  try {
    const resFallback = await fetch(`https://minhareceita.org/${cleanCnpj}`);
    if (resFallback.ok) {
      const data = await resFallback.json();
      if (data && data.razao_social) {
        const firstSocio = data.qsa && data.qsa.length > 0 ? (data.qsa[0].nome_socio || data.qsa[0].nome || '') : '';
        return {
          cnpj: data.cnpj || cleanCnpj,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || data.razao_social,
          responsible: firstSocio || data.razao_social,
          phone: data.ddd_telefone_1 || data.ddd_telefone_2 || '',
          email: data.email || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          municipio: data.municipio || data.cidade || '',
          uf: data.uf || '',
          qsa: data.qsa || [],
        };
      }
    }
  } catch (err) {
    console.error('Erro ao consultar CNPJ em ambas as APIs:', err);
  }

  return null;
}

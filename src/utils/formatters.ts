export function formatPhone(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatDocument(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 14);
  if (!digits) return '';
  if (digits.length <= 11) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function parseBRDate(dateStr?: string | null): Date | null {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—' || dateStr === 'A agendar') return null;

  const str = String(dateStr).trim();
  if (!str) return null;

  // 1. Slashes: DD/MM/YYYY or YYYY/MM/DD
  if (str.includes('/')) {
    const parts = str.split(' ')[0].split('/');
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const p2 = Number(parts[2]);
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (parts[0].length === 4) return new Date(p0, p1 - 1, p2);
        if (parts[2].length === 4) return new Date(p2, p1 - 1, p0);
      }
    }
  }

  // 2. Dashes: YYYY-MM-DD or DD-MM-YYYY
  if (str.includes('-')) {
    const parts = str.split(' ')[0].split('T')[0].split('-');
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const p2 = Number(parts[2]);
      if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
        if (parts[0].length === 4) return new Date(p0, p1 - 1, p2);
        if (parts[2].length === 4) return new Date(p2, p1 - 1, p0);
      }
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function normalizeToIsoDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const str = String(dateStr).trim();

  if (str.includes('/')) {
    const parts = str.split(' ')[0].split('/');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p1.length === 4) return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      if (p3.length === 4) return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  if (str.includes('-')) {
    const parts = str.split(' ')[0].split('T')[0].split('-');
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      if (p1.length === 4) return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      if (p3.length === 4) return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  return str.split('T')[0];
}

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—' || dateStr === 'A agendar') return dateStr || '';

  const str = String(dateStr).trim();

  // If already in DD/MM/YYYY format with optional time
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    return str;
  }

  // If ISO format YYYY-MM-DD or YYYY-MM-DD HH:mm or YYYY-MM-DDTHH:mm
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const [_, year, month, day, hours, minutes] = isoMatch;
    if (hours && minutes) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }

  // If DD-MM-YYYY format
  const brDashMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})(?:[T\s](\d{2}):(\d{2}))?/);
  if (brDashMatch) {
    const [_, day, month, year, hours, minutes] = brDashMatch;
    if (hours && minutes) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }

  const d = parseBRDate(str);
  if (!d) return str;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getTodayBR(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getNowBR(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatTimeOnly(timeOrIso?: string | null): string {
  if (!timeOrIso) return '00:00';
  const str = String(timeOrIso).trim();

  if (str.includes('T') || str.includes('+') || (str.includes('-') && str.length > 10)) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
  }

  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }

  return str;
}

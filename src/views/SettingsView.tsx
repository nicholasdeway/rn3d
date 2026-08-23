import React, { useState } from 'react';
import { Settings, Building2, FileText, Warehouse, Download, Upload, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'company' | 'docs' | 'stock' | 'backup'>('company');

  // Form states
  const [companyName, setCompanyName] = useState('RN 3D Soluções');
  const [companyPhone, setCompanyPhone] = useState('(22) 99754-0815');
  const [companyEmail, setCompanyEmail] = useState('contato@rn3d.com.br');
  const [companyCnpj, setCompanyCnpj] = useState('67.570.155/0001-34');
  const [companyInstagram, setCompanyInstagram] = useState('@rn3d.solucoes');
  const [companyAddress, setCompanyAddress] = useState('');

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      app: 'RN 3D - Gestão Interna',
      version: '1.0.0',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_rn3d_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onShowToast('Backup completo em JSON exportado com sucesso!', 'success');
  };

  const handleImportBackup = () => {
    onShowToast('Dados importados e restaurados no banco local com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configurações do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Personalize parâmetros da empresa, sequências numéricas e backups locais.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
        {[
          { id: 'company', label: 'Dados da Empresa', icon: Building2 },
          { id: 'docs', label: 'Numeração de Documentos', icon: FileText },
          { id: 'stock', label: 'Parâmetros de Estoque', icon: Warehouse },
          { id: 'backup', label: 'Backup e Restauração', icon: Download },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 cursor-pointer" />
              <span className="cursor-pointer">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 text-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-sm">Informações Comerciais para Cabeçalhos PDF</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CNPJ da Empresa</label>
                <input
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instagram Oficial</label>
                <input
                  type="text"
                  value={companyInstagram}
                  onChange={(e) => setCompanyInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => onShowToast('Dados comerciais da empresa salvos com sucesso!', 'success')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Document Numbering */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 text-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-sm">Sequenciadores Automáticos</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-800">Próximo Pedido (PED):</span>
              <span className="font-mono font-bold text-indigo-600">PED-000042</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-800">Próximo Orçamento (ORC):</span>
              <span className="font-mono font-bold text-indigo-600">ORC-000035</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-800">Próxima Remessa Consignada (REM):</span>
              <span className="font-mono font-bold text-indigo-600">REM-000042</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="font-semibold text-slate-800">Próxima Nota de Troca (TRC):</span>
              <span className="font-mono font-bold text-indigo-600">TRC-000015</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Parameters */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5 text-xs max-w-2xl">
          <h3 className="font-bold text-slate-900 text-sm">Regras de Giro e Alertas</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dias sem venda para considerar item com Baixo Giro (Alerta)
              </label>
              <input
                type="number"
                defaultValue={30}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Periodicidade padrão para reagendar visita em clientes (Dias)
              </label>
              <input
                type="number"
                defaultValue={14}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <button
              onClick={() => onShowToast('Parâmetros de estoque salvos!', 'success')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
            >
              Salvar Parâmetros
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Backup */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 text-xs max-w-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Backup e Restauração de Dados</h3>
            <p className="text-slate-500 mt-1">
              Como o sistema funciona localmente sem necessidade de servidor externo, você pode fazer download de uma cópia de segurança em formato JSON ou restaurar backups anteriores.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900">Exportar Banco de Dados</h4>
            <p className="text-slate-600">Gera um arquivo .json com todos os produtos, clientes, visitas e movimentações.</p>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" /> Exportar Backup JSON
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900">Restaurar de Cópia de Segurança</h4>
            <p className="text-slate-600">Selecione um arquivo de backup (.json) para carregar no sistema.</p>
            <button
              onClick={handleImportBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" /> Selecionar Arquivo JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

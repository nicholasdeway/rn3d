import React, { useState } from 'react';
import { Client, ClientInventoryItem } from '../types';
import { Store, ChevronDown, ChevronUp, Boxes, DollarSign, MapPin, Repeat } from 'lucide-react';
import { ImageLightboxModal } from '../components/ImageLightboxModal';

interface ClientInventoryViewProps {
  clients: Client[];
  clientInventories: Record<string, ClientInventoryItem[]>;
  onNavigateToExchanges?: (clientId: string) => void;
}

export const ClientInventoryView: React.FC<ClientInventoryViewProps> = ({
  clients,
  clientInventories,
  onNavigateToExchanges,
}) => {
  const [expandedClientId, setExpandedClientId] = useState<string | null>('cli-1');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const totalProductsConsigned = clients.reduce((acc, c) => acc + c.productsOnSiteCount, 0);
  const totalValuation = clients.reduce((acc, c) => acc + c.productsValuation, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Modal Zoom da Foto / Logo do Cliente */}
      {zoomImage && (
        <ImageLightboxModal
          imageUrl={zoomImage.url}
          title={zoomImage.title}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            Estoque Alocado em Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mapeamento em tempo real de onde suas mercadorias em consignação estão alocadas.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Consignado</span>
            <span className="text-xl font-extrabold text-slate-900">{totalProductsConsigned} produtos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Valor de Venda Alocado</span>
            <span className="text-xl font-extrabold text-emerald-600">
              R$ {totalValuation.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Estabelecimentos Ativos</span>
            <span className="text-xl font-extrabold text-slate-900">{clients.length} parceiros</span>
          </div>
        </div>
      </div>

      {/* Client Consignment Accordion List */}
      <div className="space-y-4">
        {clients.map((cli) => {
          const isExpanded = expandedClientId === cli.id;
          const itemsAtStore = clientInventories[cli.id] || [];

          return (
            <div
              key={cli.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedClientId(isExpanded ? null : cli.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    onClick={(e) => {
                      if (cli.avatarUrl) {
                        e.stopPropagation();
                        setZoomImage({ url: cli.avatarUrl, title: cli.name });
                      }
                    }}
                    className={`w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100 overflow-hidden ${
                      cli.avatarUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                    }`}
                    title={cli.avatarUrl ? 'Clique para ampliar a foto' : undefined}
                  >
                    {cli.avatarUrl ? (
                      <img src={cli.avatarUrl} alt={cli.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{cli.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{cli.name}</h3>
                    <p className="text-xs text-slate-500">
                      {cli.city} • Última conferência: {cli.lastVisitDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {onNavigateToExchanges && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToExchanges(cli.id);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Migrar/Remanejar estoque desta loja para outra"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Remanejar Estoque</span>
                    </button>
                  )}

                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900 block">
                      {cli.productsOnSiteCount} produtos
                    </span>
                    <span className="font-semibold text-emerald-600">
                      R$ {cli.productsValuation.toFixed(2)}
                    </span>
                  </div>

                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="p-5 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Itens Presentes no Estabelecimento ({cli.name}):
                    </h4>
                    {onNavigateToExchanges && itemsAtStore.length > 0 && (
                      <button
                        onClick={() => onNavigateToExchanges(cli.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                      >
                        <Repeat className="w-3.5 h-3.5" /> Migrar peças encalhadas desta loja ➔
                      </button>
                    )}
                  </div>

                  {itemsAtStore.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum produto cadastrado nesta loja.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-500 font-semibold uppercase">
                          <tr>
                            <th className="p-3">Produto</th>
                            <th className="p-3 text-center">Enviado</th>
                            <th className="p-3 text-center">Vendido</th>
                            <th className="p-3 text-center">Atual</th>
                            <th className="p-3 text-right">Preço Unit.</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {itemsAtStore.map((item) => (
                            <tr key={item.productId} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                              <td className="p-3 text-center text-slate-600">{item.sentQuantity}</td>
                              <td className="p-3 text-center font-bold text-emerald-600">{item.soldQuantity}</td>
                              <td className="p-3 text-center font-extrabold text-slate-900">{item.currentQuantity} un</td>
                              <td className="p-3 text-right text-slate-600">R$ {item.unitPrice.toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                R$ {(item.currentQuantity * item.unitPrice).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

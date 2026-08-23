import React, { useState } from 'react';
import { Product } from '../types';
import {
  Package,
  Plus,
  Search,
  Grid,
  List,
  X,
  Edit2,
  Printer,
  Image as ImageIcon,
  Crop,
  ArrowUpDown,
  Trash2,
  Sparkles,
  CloudUpload,
} from 'lucide-react';
import { ImageCropperModal } from '../components/ImageCropperModal';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onSyncSupabase?: () => Promise<void>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onSyncSupabase,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [keychainOnly, setKeychainOnly] = useState<'todos' | 'chaveiro' | 'nao-chaveiro'>('todos');
  const [sortBy, setSortBy] = useState<'name-asc' | 'category' | 'sku' | 'price-asc' | 'price-desc'>('name-asc');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Image Cropper modal state
  const [croppingImageSrc, setCroppingImageSrc] = useState<string | null>(null);
  const [isCroppingEditMode, setIsCroppingEditMode] = useState<boolean>(false);

  // New product form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Case de Munição',
    isKeychain: false,
    description: '',
    storageCapacity: '',
    imageUrl: '',
    material: 'PLA',
    color: 'Preto',
    weightGram: 50,
    lengthMm: 100,
    widthMm: 50,
    heightMm: 40,
    avgPrintTimeMinutes: 60,
    batchQuantity: 5,
    estimatedCost: 8.0,
    standardPrice: undefined,
    cashPrice: undefined,
    minPrice: 20.0,
    suggestedRetailPrice: 80.0,
    currentStock: 20,
    minStock: 5,
    allowsCustomization: true,
    status: 'Ativo',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  const categories = ['Todos', 'Case de Munição', 'Fidgets', 'Chaveiro', 'Decoração', 'Acessórios', 'Organizadores'];

  // Default Alphabetical Sorting (A-Z) & Filters
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      const matchesKeychain =
        keychainOnly === 'todos' ||
        (keychainOnly === 'chaveiro' && p.isKeychain) ||
        (keychainOnly === 'nao-chaveiro' && !p.isKeychain);

      return matchesSearch && matchesCategory && matchesStatus && matchesKeychain;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category, 'pt-BR');
      }
      if (sortBy === 'sku') {
        return a.sku.localeCompare(b.sku);
      }
      if (sortBy === 'price-asc') {
        return a.standardPrice - b.standardPrice;
      }
      if (sortBy === 'price-desc') {
        return b.standardPrice - a.standardPrice;
      }
      return 0;
    });

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCroppingImageSrc(base64);
      setIsCroppingEditMode(isEdit);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedBase64: string) => {
    if (isCroppingEditMode) {
      setEditFormData((prev) => ({ ...prev, imageUrl: croppedBase64 }));
    } else {
      setFormData((prev) => ({ ...prev, imageUrl: croppedBase64 }));
    }
    setCroppingImageSrc(null);
  };

  const generateUniqueSku = (isEdit: boolean = false) => {
    const existingSkus = new Set(products.map((p) => (p.sku || '').trim().toLowerCase()));

    let candidate = '';
    let attempts = 0;
    const maxAttempts = 10000;

    while (attempts < maxAttempts) {
      const num = Math.floor(Math.random() * 9000 + 1000).toString();
      if (!existingSkus.has(num.toLowerCase())) {
        candidate = num;
        break;
      }
      attempts++;
    }

    if (candidate) {
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, sku: candidate }));
      } else {
        setFormData((prev) => ({ ...prev, sku: candidate }));
      }
    }
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({ ...product });
    setSelectedProduct(null);
  };

  const handleSubmitNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      alert('Por favor, preencha o Nome e o SKU do produto.');
      return;
    }

    if (
      formData.cashPrice === undefined ||
      formData.cashPrice === null ||
      isNaN(Number(formData.cashPrice)) ||
      Number(formData.cashPrice) <= 0 ||
      formData.standardPrice === undefined ||
      formData.standardPrice === null ||
      isNaN(Number(formData.standardPrice)) ||
      Number(formData.standardPrice) <= 0
    ) {
      alert('Por favor, preencha obrigatoriamente os valores de Preço À Vista e Preço Consignado com valores maiores que zero.');
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: formData.name,
      sku: formData.sku,
      category: formData.category || 'Chaveiro',
      isKeychain: formData.category === 'Chaveiro' || formData.category === 'Fidgets' || !!formData.isKeychain,
      description: formData.description || '',
      storageCapacity: formData.storageCapacity || '',
      imageUrl: formData.imageUrl || '',
      material: formData.material || 'PLA',
      color: formData.color || 'Preto',
      weightGram: Number(formData.weightGram) || 50,
      lengthMm: Number(formData.lengthMm) || 100,
      widthMm: Number(formData.widthMm) || 50,
      heightMm: Number(formData.heightMm) || 40,
      avgPrintTimeMinutes: Number(formData.avgPrintTimeMinutes) || 60,
      batchQuantity: Number(formData.batchQuantity) || 1,
      estimatedCost: Number(formData.estimatedCost) || 8.0,
      standardPrice: Number(formData.standardPrice),
      cashPrice: Number(formData.cashPrice),
      minPrice: Number(formData.cashPrice),
      suggestedRetailPrice: Number(formData.standardPrice) * 1.5,
      currentStock: Number(formData.currentStock) ?? 20,
      minStock: Number(formData.minStock) || 5,
      allowsCustomization: !!formData.allowsCustomization,
      customizationOptions: { name: true, logo: true, color: true, text: true, other: false },
      status: formData.status || 'Ativo',
    };

    onAddProduct(newProd);
    setIsModalOpen(false);
    setFormData({
      name: '',
      sku: '',
      category: 'Case de Munição',
      isKeychain: false,
      description: '',
      storageCapacity: '',
      imageUrl: '',
      material: 'PLA',
      color: 'Preto',
      weightGram: 50,
      lengthMm: 100,
      widthMm: 50,
      heightMm: 40,
      avgPrintTimeMinutes: 60,
      batchQuantity: 5,
      estimatedCost: 8.0,
      standardPrice: undefined,
      cashPrice: undefined,
      minPrice: 20.0,
      suggestedRetailPrice: 80.0,
      currentStock: 20,
      minStock: 5,
      allowsCustomization: true,
      status: 'Ativo',
    });
  };

  const handleSubmitEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editFormData.id) return;

    if (
      editFormData.cashPrice === undefined ||
      editFormData.cashPrice === null ||
      isNaN(Number(editFormData.cashPrice)) ||
      Number(editFormData.cashPrice) <= 0 ||
      editFormData.standardPrice === undefined ||
      editFormData.standardPrice === null ||
      isNaN(Number(editFormData.standardPrice)) ||
      Number(editFormData.standardPrice) <= 0
    ) {
      alert('Por favor, preencha obrigatoriamente os valores de Preço À Vista e Preço Consignado com valores maiores que zero.');
      return;
    }

    const updatedProd: Product = {
      ...editingProduct,
      ...editFormData,
      name: editFormData.name || editingProduct.name,
      sku: editFormData.sku || editingProduct.sku,
      category: editFormData.category || editingProduct.category,
      storageCapacity: editFormData.storageCapacity !== undefined ? editFormData.storageCapacity : editingProduct.storageCapacity,
      imageUrl: editFormData.imageUrl !== undefined ? editFormData.imageUrl : editingProduct.imageUrl,
      standardPrice: Number(editFormData.standardPrice),
      cashPrice: Number(editFormData.cashPrice),
      currentStock: Number(editFormData.currentStock) ?? editingProduct.currentStock,
      status: (editFormData.status as 'Ativo' | 'Inativo') || editingProduct.status,
    };

    onUpdateProduct(updatedProd);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Catálogo de Produtos RN 3D
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Organizado em ordem alfabética (A-Z) com ferramenta de redimensionamento e recorte de fotos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-2.5 shadow-xs">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total no Catálogo</span>
              <span className="text-sm font-black text-indigo-700">{products.length} Produtos</span>
            </div>
          </div>

          {onSyncSupabase && (
            <button
              onClick={onSyncSupabase}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
              title="Enviar todos os produtos do sistema diretamente para o Supabase PostgreSQL"
            >
              <CloudUpload className="w-4 h-4 text-emerald-400 animate-pulse" />
              Sincronizar Supabase
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do produto ou SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
              Exibindo: <strong>{filteredProducts.length}</strong> de {products.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="name-asc">Ordem: Alfabética (A-Z)</option>
                <option value="category">Ordem: Categoria</option>
                <option value="sku">Ordem: Código / SKU</option>
                <option value="price-asc">Preço: Menor para Maior</option>
                <option value="price-desc">Preço: Maior para Menor</option>
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Cat: {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  {/* Image / Thumbnail */}
                  <div
                    onClick={() => setSelectedProduct(p)}
                    className="w-full h-52 bg-slate-900/5 rounded-xl flex items-center justify-center relative overflow-hidden mb-3.5 border border-slate-200/80 cursor-pointer group-hover:border-indigo-500/50 transition-all shadow-inner"
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-xl transform group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Printer className="w-12 h-12 text-indigo-300 group-hover:scale-110 transition-transform duration-200" />
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/95 text-slate-800 shadow-sm border border-slate-200/60">
                      {p.sku}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {p.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <h3
                      onClick={() => setSelectedProduct(p)}
                      className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {p.name}
                    </h3>
                    {p.storageCapacity && (
                      <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-1">
                        Capacidade: {p.storageCapacity}
                      </span>
                    )}
                  </div>

                  {/* Financial & Dual Price Display */}
                  <div className="flex items-center justify-between my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">À Vista / 50%:</span>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        R$ {(p.cashPrice ?? (p.isKeychain || p.category === 'Chaveiro' ? 4.0 : p.standardPrice)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Consignado / Faturado:</span>
                      <span className="font-extrabold text-indigo-600 text-sm">
                        R$ {p.standardPrice.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Edit Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estoque: <strong className="text-slate-900">{p.currentStock} un</strong></span>
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Capacidade</th>
                  <th className="p-4">Preço À Vista</th>
                  <th className="p-4">Preço Consignado</th>
                  <th className="p-4">Estoque</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] overflow-hidden border border-slate-200">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          '3D'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{p.material} • {p.color}</p>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="p-4 text-slate-600">{p.category}</td>
                    <td className="p-4 font-semibold text-indigo-600">{p.storageCapacity || '-'}</td>
                    <td className="p-4 font-bold text-emerald-600">R$ {(p.cashPrice ?? (p.isKeychain || p.category === 'Chaveiro' ? 4.0 : p.standardPrice)).toFixed(2).replace('.', ',')}</td>
                    <td className="p-4 font-bold text-indigo-600">R$ {p.standardPrice.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4 font-bold text-slate-900">{p.currentStock} un</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Editar Produto: {editingProduct.sku}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Product Image */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-900">Foto do Produto (PDF & Catálogo)</label>
                  {editFormData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, imageUrl: '' })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Foto
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative group">
                    {editFormData.imageUrl ? (
                      <img src={editFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 w-fit cursor-pointer shadow-xs">
                        <Crop className="w-4 h-4" />
                        {editFormData.imageUrl ? 'Substituir / Recortar Foto' : 'Selecionar e Recortar Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, true)}
                          className="hidden"
                        />
                      </label>
                      {editFormData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, imageUrl: '' })}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={editFormData.imageUrl || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                      placeholder="Ou cole o link/URL da imagem (https://...)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">SKU / Código *</label>
                    <button
                      type="button"
                      onClick={() => generateUniqueSku(true)}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Gerar código aleatório único de 4 dígitos não existente no banco"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Gerar Código
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editFormData.sku || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    placeholder="Ex: 7991"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editFormData.category || 'Case de Munição'}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {categories.filter((c) => c !== 'Todos').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacidade de Armazenamento</label>
                  <input
                    type="text"
                    value={editFormData.storageCapacity || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, storageCapacity: e.target.value })}
                    placeholder="Ex: 50 munições, 20 munições (Pocket)..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço À Vista / 50% (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={editFormData.cashPrice ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, cashPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Ex: 4.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Consignado / Faturado (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={editFormData.standardPrice ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, standardPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Ex: 6.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Oficina</label>
                  <input
                    type="number"
                    value={editFormData.currentStock ?? 0}
                    onChange={(e) => setEditFormData({ ...editFormData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cadastrar Produto Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-300 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Cadastrar Novo Produto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProduct} className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">
                  1. Informações do Produto
                </h4>

                {/* Image Upload Input */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-900">Foto do Produto (PDF & Catálogo)</label>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir Foto
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 w-fit cursor-pointer shadow-xs">
                          <Crop className="w-4 h-4" />
                          {formData.imageUrl ? 'Substituir / Recortar Foto' : 'Selecionar e Recortar Foto'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, false)}
                            className="hidden"
                          />
                        </label>
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold flex items-center gap-1 cursor-pointer border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="Ou cole o link/URL da imagem (https://...)"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Case Elite Rosqueável 9mm"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">SKU / Código *</label>
                      <button
                        type="button"
                        onClick={() => generateUniqueSku(false)}
                        className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Gerar código aleatório único de 4 dígitos não existente no banco"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Gerar Código
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Ex: 7991"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    >
                      {categories.filter((c) => c !== 'Todos').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Capacidade de Armazenamento</label>
                    <input
                      type="text"
                      value={formData.storageCapacity || ''}
                      onChange={(e) => setFormData({ ...formData, storageCapacity: e.target.value })}
                      placeholder="Ex: 50 munições, 20 munições..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço À Vista / 50% (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={formData.cashPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, cashPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Ex: 4.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Consignado / Faturado (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={formData.standardPrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Ex: 6.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Inicial Oficina</label>
                  <input
                    type="number"
                    value={formData.currentStock ?? 20}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    placeholder="Ex: 20"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal (Renders on top of all active modals with z-[100]) */}
      {croppingImageSrc && (
        <ImageCropperModal
          imageSrc={croppingImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setCroppingImageSrc(null)}
        />
      )}
    </div>
  );
};

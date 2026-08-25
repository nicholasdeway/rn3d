import React, { useState, useMemo } from 'react';
import {
  Zap,
  Package,
  Layers,
  ShoppingBag,
  DollarSign,
  Info,
  Copy,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Percent,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Tag,
  AlertTriangle,
  Plus,
  Minus,
  Gift,
  Users,
} from 'lucide-react';
import { CalculatorInputs, MarketplacePreset, Product } from '../types';

interface CalculatorViewProps {
  onSaveAsProduct?: (newProduct: Product) => void;
}

// Preset Item Templates
const QUICK_PRESETS = [
  {
    name: 'Chaveiro Personalizado',
    weight: 15,
    hours: 0,
    minutes: 40,
    packaging: 0.5,
    tags: 0.5,
    hardware: 0.8,
    material: 'PLA' as const,
  },
  {
    name: 'Vaso Decorativo Moderno',
    weight: 120,
    hours: 7,
    minutes: 30,
    packaging: 2.5,
    tags: 0.5,
    hardware: 0.0,
    material: 'PLA' as const,
  },
  {
    name: 'Action Figure / Miniatura',
    weight: 180,
    hours: 11,
    minutes: 0,
    packaging: 4.0,
    tags: 1.0,
    hardware: 0.0,
    material: 'PLA' as const,
  },
  {
    name: 'Suporte Técnico Resistente',
    weight: 90,
    hours: 4,
    minutes: 15,
    packaging: 1.5,
    tags: 0.0,
    hardware: 2.0,
    material: 'PETG' as const,
  },
];

// Predefined Marketplace Channel Configurations
const DEFAULT_MARKETPLACES: MarketplacePreset[] = [
  {
    id: 'direct',
    name: 'Venda Direta / WhatsApp',
    commissionPct: 0,
    fixedFee: 0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-emerald-500 text-white',
  },
  {
    id: 'shopee_standard',
    name: 'Shopee (Padrão)',
    commissionPct: 18,
    fixedFee: 0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-orange-500 text-white',
  },
  {
    id: 'shopee_freeship',
    name: 'Shopee (Frete Grátis)',
    commissionPct: 20,
    fixedFee: 0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-amber-600 text-white',
  },
  {
    id: 'ml_classic',
    name: 'Mercado Livre (Clássico)',
    commissionPct: 12,
    fixedFee: 6.0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-yellow-500 text-slate-900',
  },
  {
    id: 'ml_premium',
    name: 'Mercado Livre (Premium)',
    commissionPct: 17,
    fixedFee: 6.0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'amazon',
    name: 'Amazon Brasil',
    commissionPct: 15,
    fixedFee: 2.0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-slate-900 text-amber-400',
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    commissionPct: 6,
    fixedFee: 2.0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-stone-900 text-rose-400',
  },
];

export const CalculatorView: React.FC<CalculatorViewProps> = ({ onSaveAsProduct }) => {
  // Input State
  const [inputs, setInputs] = useState<CalculatorInputs>({
    spoolPrice: 100, // R$ 100 por rolo de 1kg
    spoolWeightGrams: 1000,
    printWeightGrams: 45,
    failureRatePct: 5,
    materialType: 'PLA',
    printerPowerWatts: 150, // W
    energyKwhCost: 0.3, // R$ 0,30 per kWh
    printHours: 3,
    printMinutes: 30,
    packagingCost: 1.5,
    tagsCardsCost: 0.5,
    hardwareCost: 0.0,
    laborPrepCost: 0.0,
    desiredProfitMarginPct: 50, // 50% net profit margin target
    extraDiscountAffiliatePct: 0, // Padrão 0% para descontos/comissões/afiliados
  });

  // Selected Active Marketplace for Details Tab
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState<string>('shopee_standard');

  // Custom Marketplace Adjustments
  const [customMarketplace, setCustomMarketplace] = useState<MarketplacePreset>({
    id: 'custom',
    name: 'Canal Customizado',
    commissionPct: 15,
    fixedFee: 4.0,
    freeShippingCost: 0,
    affiliateCommissionPct: 0,
    couponDiscountPct: 0,
    badgeColor: 'bg-indigo-600 text-white',
  });

  // Simulator / Manual Price Input
  const [manualPriceInput, setManualPriceInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Modal State for Saving to Catalog
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Decoração');

  // Basic Input Handlers
  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  // Quick Preset Loader
  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setInputs((prev) => ({
      ...prev,
      printWeightGrams: preset.weight,
      printHours: preset.hours,
      printMinutes: preset.minutes,
      packagingCost: preset.packaging,
      tagsCardsCost: preset.tags,
      hardwareCost: preset.hardware,
      materialType: preset.material,
    }));
    setProductName(preset.name);
  };

  // --- CORE CALCULATIONS ---

  // 1. Filament Costs
  const filamentCostPerGram = useMemo(() => {
    if (inputs.spoolWeightGrams <= 0) return 0;
    return inputs.spoolPrice / inputs.spoolWeightGrams;
  }, [inputs.spoolPrice, inputs.spoolWeightGrams]);

  const rawFilamentCost = useMemo(() => {
    return inputs.printWeightGrams * filamentCostPerGram;
  }, [inputs.printWeightGrams, filamentCostPerGram]);

  const failureCost = useMemo(() => {
    return rawFilamentCost * (inputs.failureRatePct / 100);
  }, [rawFilamentCost, inputs.failureRatePct]);

  const totalFilamentCost = useMemo(() => {
    return rawFilamentCost + failureCost;
  }, [rawFilamentCost, failureCost]);

  // 2. Electricity Costs
  const totalPrintHoursDecimal = useMemo(() => {
    return inputs.printHours + inputs.printMinutes / 60;
  }, [inputs.printHours, inputs.printMinutes]);

  const totalKwhUsed = useMemo(() => {
    return (inputs.printerPowerWatts / 1000) * totalPrintHoursDecimal;
  }, [inputs.printerPowerWatts, totalPrintHoursDecimal]);

  const electricityCost = useMemo(() => {
    return totalKwhUsed * inputs.energyKwhCost;
  }, [totalKwhUsed, inputs.energyKwhCost]);

  // 3. Additional Insumos
  const totalExtraCosts = useMemo(() => {
    return (
      inputs.packagingCost +
      inputs.tagsCardsCost +
      inputs.hardwareCost +
      inputs.laborPrepCost
    );
  }, [inputs.packagingCost, inputs.tagsCardsCost, inputs.hardwareCost, inputs.laborPrepCost]);

  // 4. Total Direct Production Cost (COGS)
  const totalDirectCost = useMemo(() => {
    return totalFilamentCost + electricityCost + totalExtraCosts;
  }, [totalFilamentCost, electricityCost, totalExtraCosts]);

  // Function to calculate marketplace selling price for a given config and target profit margin
  const calculateMarketplaceMetrics = (mkt: MarketplacePreset, targetMarginPct: number) => {
    const cost = totalDirectCost;
    const fixedDeductions = mkt.fixedFee + mkt.freeShippingCost;
    const totalPctDeductions =
      (mkt.commissionPct +
        mkt.affiliateCommissionPct +
        mkt.couponDiscountPct +
        inputs.extraDiscountAffiliatePct) /
      100;
    const desiredMargin = targetMarginPct / 100;

    // Remaining percentage from selling price after fees & profit
    const remainingPct = 1 - totalPctDeductions - desiredMargin;

    let recommendedPrice = 0;
    if (remainingPct > 0.05) {
      recommendedPrice = (cost + fixedDeductions) / remainingPct;
    } else {
      // Fallback if fees are too high
      recommendedPrice = (cost + fixedDeductions) * 2.5;
    }

    const commissionAmount = recommendedPrice * (mkt.commissionPct / 100);
    const affiliateAmount = recommendedPrice * (mkt.affiliateCommissionPct / 100);
    const couponAmount = recommendedPrice * (mkt.couponDiscountPct / 100);
    const extraDiscountAffiliateAmount =
      recommendedPrice * (inputs.extraDiscountAffiliatePct / 100);
    const totalFeesAmount =
      commissionAmount +
      affiliateAmount +
      couponAmount +
      extraDiscountAffiliateAmount +
      fixedDeductions;
    const netRevenue = recommendedPrice - totalFeesAmount;
    const netProfit = netRevenue - cost;
    const realProfitMarginPct = recommendedPrice > 0 ? (netProfit / recommendedPrice) * 100 : 0;
    const markupPct = cost > 0 ? (netProfit / cost) * 100 : 0;
    const markupMultiplier = cost > 0 ? recommendedPrice / cost : 0;

    return {
      recommendedPrice,
      commissionAmount,
      affiliateAmount,
      couponAmount,
      extraDiscountAffiliateAmount,
      fixedDeductions,
      totalFeesAmount,
      netRevenue,
      netProfit,
      realProfitMarginPct,
      markupPct,
      markupMultiplier,
    };
  };

  // Active Marketplaces list including custom
  const allMarketplaces = useMemo(() => {
    return [...DEFAULT_MARKETPLACES, customMarketplace];
  }, [customMarketplace]);

  // Currently Selected Marketplace Object
  const selectedMarketplace = useMemo(() => {
    return (
      allMarketplaces.find((m) => m.id === selectedMarketplaceId) ||
      DEFAULT_MARKETPLACES[0]
    );
  }, [allMarketplaces, selectedMarketplaceId]);

  // Metrics for selected marketplace
  const selectedMetrics = useMemo(() => {
    return calculateMarketplaceMetrics(selectedMarketplace, inputs.desiredProfitMarginPct);
  }, [selectedMarketplace, inputs.desiredProfitMarginPct, totalDirectCost, inputs.extraDiscountAffiliatePct]);

  // Price without extra affiliate/discount commission (base channel price)
  const priceWithoutExtra = useMemo(() => {
    const mkt = selectedMarketplace;
    const cost = totalDirectCost;
    const fixedDeductions = mkt.fixedFee + mkt.freeShippingCost;
    const totalPctDeductions = (mkt.commissionPct + mkt.affiliateCommissionPct + mkt.couponDiscountPct) / 100;
    const desiredMargin = inputs.desiredProfitMarginPct / 100;
    const remainingPct = 1 - totalPctDeductions - desiredMargin;
    if (remainingPct > 0.05) {
      return (cost + fixedDeductions) / remainingPct;
    }
    return (cost + fixedDeductions) * 2.5;
  }, [selectedMarketplace, inputs.desiredProfitMarginPct, totalDirectCost]);

  // Simulation Metrics for user's manual price input
  const manualSimulationMetrics = useMemo(() => {
    const customPrice = parseFloat(manualPriceInput.replace(',', '.'));
    if (isNaN(customPrice) || customPrice <= 0) return null;

    const mkt = selectedMarketplace;
    const cost = totalDirectCost;
    const fixedDeductions = mkt.fixedFee + mkt.freeShippingCost;
    const totalPctDeductions =
      (mkt.commissionPct +
        mkt.affiliateCommissionPct +
        mkt.couponDiscountPct +
        inputs.extraDiscountAffiliatePct) /
      100;

    const extraDiscountAffiliateAmount =
      customPrice * (inputs.extraDiscountAffiliatePct / 100);
    const totalFeesAmount = customPrice * totalPctDeductions + fixedDeductions;
    const netRevenue = customPrice - totalFeesAmount;
    const netProfit = netRevenue - cost;
    const profitMarginPct = (netProfit / customPrice) * 100;
    const markupPct = cost > 0 ? (netProfit / cost) * 100 : 0;

    return {
      price: customPrice,
      extraDiscountAffiliateAmount,
      totalFeesAmount,
      netRevenue,
      netProfit,
      profitMarginPct,
      markupPct,
    };
  }, [manualPriceInput, selectedMarketplace, totalDirectCost, inputs.extraDiscountAffiliatePct]);

  // Formatted summary for copying to WhatsApp
  const handleCopyQuote = () => {
    const text = `🖨️ *ORÇAMENTO DE IMPRESSÃO 3D - RN 3D*
----------------------------------------
📦 *Item:* ${productName || 'Peça Sob Medida 3D'}
⚖️ *Material/Peso:* ${inputs.materialType} (${inputs.printWeightGrams}g)
⏱️ *Tempo de Produção:* ${inputs.printHours}h ${inputs.printMinutes}min
${inputs.extraDiscountAffiliatePct > 0 ? `🎁 *Comissões/Afiliados/Descontos:* ${inputs.extraDiscountAffiliatePct}% (R$ ${selectedMetrics.extraDiscountAffiliateAmount.toFixed(2)})\n` : ''}
💰 *Valor Sugerido (Venda Direta):* R$ ${calculateMarketplaceMetrics(DEFAULT_MARKETPLACES[0], inputs.desiredProfitMarginPct).recommendedPrice.toFixed(2)}
🛒 *Valor no Marketplace (${selectedMarketplace.name}):* R$ ${selectedMetrics.recommendedPrice.toFixed(2)}

Qualquer dúvida estou à disposição! 🚀`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Handle Save to Product Catalog
  const handleConfirmSaveProduct = () => {
    if (!onSaveAsProduct) return;

    const directMetrics = calculateMarketplaceMetrics(
      DEFAULT_MARKETPLACES[0],
      inputs.desiredProfitMarginPct
    );

    const newProd: Product = {
      id: `PROD-${Math.floor(Math.random() * 90000 + 10000)}`,
      name: productName || 'Nova Peça 3D',
      sku: `3D-${inputs.materialType}-${inputs.printWeightGrams}G`,
      category: productCategory,
      isKeychain: inputs.printWeightGrams <= 20,
      description: `Peça impressa em 3D (${inputs.materialType}), peso ${inputs.printWeightGrams}g, tempo de impressão ${inputs.printHours}h ${inputs.printMinutes}m.`,
      material: inputs.materialType,
      color: 'Padrão',
      weightGram: inputs.printWeightGrams,
      lengthMm: 50,
      widthMm: 50,
      heightMm: 50,
      avgPrintTimeMinutes: inputs.printHours * 60 + inputs.printMinutes,
      batchQuantity: 1,
      estimatedCost: Number(totalDirectCost.toFixed(2)),
      standardPrice: Number(directMetrics.recommendedPrice.toFixed(2)),
      minPrice: Number((totalDirectCost * 1.3).toFixed(2)),
      suggestedRetailPrice: Number(selectedMetrics.recommendedPrice.toFixed(2)),
      currentStock: 1,
      minStock: 2,
      allowsCustomization: false,
      customizationOptions: { name: false, logo: false, color: true, text: false, other: false },
      status: 'Ativo',
    };

    onSaveAsProduct(newProd);
    setIsSaveModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-900/10 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Calculadora Precisa 3D & Marketplaces
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Calculadora de Costes & Precificação de Impressão
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Calcule exatamente o custo de filamento, energia elétrica (tarifa local), insumos e descubra quanto cobrar na Shopee, Mercado Livre ou Venda Direta para obter a sua margem de lucro real.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleCopyQuote}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-medium backdrop-blur-md transition-all active:scale-95"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Resumo WhatsApp</span>
                </>
              )}
            </button>

            {onSaveAsProduct && (
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Salvar no Catálogo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left 7 Cols) & Calculated Results (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN - INPUT FORMS */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: MATÉRIA PRIMA & FILAMENTO */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. Filamento & Consumo</h3>
                  <p className="text-xs text-slate-500">Custo do rolo e peso utilizado na peça</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                R$ {filamentCostPerGram.toFixed(4)} / grama
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preço do Rolo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preço do Rolo (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputs.spoolPrice}
                    onChange={(e) => handleInputChange('spoolPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Peso do Rolo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Peso do Rolo (Gramas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={inputs.spoolWeightGrams}
                    onChange={(e) => handleInputChange('spoolWeightGrams', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    g (1 kg = 1000g)
                  </span>
                </div>
              </div>

              {/* Peso Usado na Peça */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Peso da Peça (Gramas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={inputs.printWeightGrams}
                    onChange={(e) => handleInputChange('printWeightGrams', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    g
                  </span>
                </div>
              </div>

              {/* Taxa de Falha / Perda */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>Margem de Falha / Suportes</span>
                  <span className="text-slate-400 text-[11px] font-mono">{inputs.failureRatePct}%</span>
                </label>
                <div className="relative flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={inputs.failureRatePct}
                    onChange={(e) => handleInputChange('failureRatePct', parseInt(e.target.value) || 0)}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Material Type */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de Material
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['PLA', 'PETG', 'ABS', 'TPU', 'Resina'] as const).map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => handleInputChange('materialType', mat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${inputs.materialType === mat
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ENERGIA ELÉTRICA & TEMPO */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. Consumo de Energia Elétrica</h3>
                  <p className="text-xs text-slate-500">Tarifa de kWh e tempo de impressão</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                Tarifa local: R$ {inputs.energyKwhCost.toFixed(2)} / kWh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tarifa de Energia (KWh) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Valor kWh (Sua Cidade)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inputs.energyKwhCost}
                    onChange={(e) => handleInputChange('energyKwhCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Potência da Impressora */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Potência da Impressora
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="50"
                    value={inputs.printerPowerWatts}
                    onChange={(e) => handleInputChange('printerPowerWatts', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    Watts (W)
                  </span>
                </div>
              </div>

              {/* Tempo de Impressão */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tempo de Impressão
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={inputs.printHours}
                      onChange={(e) => handleInputChange('printHours', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block text-center mt-0.5">Horas</span>
                  </div>
                  <span className="text-slate-400 font-bold">:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={inputs.printMinutes}
                      onChange={(e) => handleInputChange('printMinutes', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block text-center mt-0.5">Minutos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: EMBALAGEM, TAGS E ADICIONAIS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">3. Embalagem & Custos Adicionais</h3>
                <p className="text-xs text-slate-500">Caixas, sacos bolha, cartões, tags e ferragens</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Embalagem */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Caixa / Saco / Plastico Bolha (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={inputs.packagingCost}
                    onChange={(e) => handleInputChange('packagingCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Cartões & Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cartões, Tags & Mimos (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={inputs.tagsCardsCost}
                    onChange={(e) => handleInputChange('tagsCardsCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Ferragens / Chaveiros */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ferragens / Argolas / Cola (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    value={inputs.hardwareCost}
                    onChange={(e) => handleInputChange('hardwareCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Mão de Obra / Preparação */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Acabamento / Mão de Obra (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={inputs.laborPrepCost}
                    onChange={(e) => handleInputChange('laborPrepCost', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: MARGEM DE LUCRO DESEJADA & SELEÇÃO DE MARKETPLACE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">4. Configuração de Marketplace & Lucro</h3>
                <p className="text-xs text-slate-500">Selecione o canal para ajustar taxas e margem de lucro</p>
              </div>
            </div>

            {/* Profit Margin Slider */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Margem de Lucro Desejada (Líquida):
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-mono text-sm">
                  {inputs.desiredProfitMarginPct}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={inputs.desiredProfitMarginPct}
                onChange={(e) => handleInputChange('desiredProfitMarginPct', parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-600 h-2 bg-emerald-200/60 dark:bg-emerald-900/40 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                <span>10% (Baixa)</span>
                <span>30% (Padrão)</span>
                <span>50% (Recomendada)</span>
                <span>70% (Alta)</span>
              </div>
            </div>

            {/* Marketplace Preset Selector Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Selecione o Marketplace para análise detalhada:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allMarketplaces.map((mkt) => {
                  const isSelected = mkt.id === selectedMarketplaceId;
                  return (
                    <button
                      key={mkt.id}
                      type="button"
                      onClick={() => setSelectedMarketplaceId(mkt.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{mkt.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${mkt.badgeColor}`}>
                          {mkt.commissionPct}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Taxa Fixa: R$ {mkt.fixedFee.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Marketplace Tuning (Shown if Custom is selected) */}
            {selectedMarketplaceId === 'custom' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" /> Ajustar Parâmetros do Canal Personalizado
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium">Comissão %</label>
                    <input
                      type="number"
                      value={customMarketplace.commissionPct}
                      onChange={(e) =>
                        setCustomMarketplace((prev) => ({
                          ...prev,
                          commissionPct: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium">Taxa Fixa R$</label>
                    <input
                      type="number"
                      step="0.50"
                      value={customMarketplace.fixedFee}
                      onChange={(e) =>
                        setCustomMarketplace((prev) => ({
                          ...prev,
                          fixedFee: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium">Afiliados %</label>
                    <input
                      type="number"
                      value={customMarketplace.affiliateCommissionPct}
                      onChange={(e) =>
                        setCustomMarketplace((prev) => ({
                          ...prev,
                          affiliateCommissionPct: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium">Cupom %</label>
                    <input
                      type="number"
                      value={customMarketplace.couponDiscountPct}
                      onChange={(e) =>
                        setCustomMarketplace((prev) => ({
                          ...prev,
                          couponDiscountPct: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: COMISSÕES, DESCONTOS E AFILIADOS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">5. Comissões, Descontos e Afiliados</h3>
                  <p className="text-xs text-slate-500">Desconto adicional ou comissão para afiliados / cupons</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg">
                {inputs.extraDiscountAffiliatePct}% adicionados
              </span>
            </div>

            <div className="space-y-4">
              {/* Stepper with -1% and +1% buttons */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-600" />
                    Taxa Extra de Afiliados / Desconto (%):
                  </label>
                  <span className="text-cyan-700 font-mono text-sm font-extrabold bg-white px-3 py-1 rounded-lg border border-cyan-200 shadow-2xs">
                    {inputs.extraDiscountAffiliatePct}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange('extraDiscountAffiliatePct', Math.max(0, inputs.extraDiscountAffiliatePct - 1))
                    }
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                    title="Diminuir 1%"
                  >
                    <Minus className="w-4 h-4 text-rose-500" />
                    <span>-1%</span>
                  </button>

                  <div className="relative w-28 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="1"
                      value={inputs.extraDiscountAffiliatePct}
                      onChange={(e) =>
                        handleInputChange('extraDiscountAffiliatePct', Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInputChange('extraDiscountAffiliatePct', inputs.extraDiscountAffiliatePct + 1)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                    title="Aumentar 1%"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>+1%</span>
                  </button>
                </div>

                {/* Range slider */}
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={inputs.extraDiscountAffiliatePct}
                  onChange={(e) => handleInputChange('extraDiscountAffiliatePct', parseInt(e.target.value) || 0)}
                  className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />

                {/* Quick selection preset chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Atalhos:</span>
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleInputChange('extraDiscountAffiliatePct', pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${inputs.extraDiscountAffiliatePct === pct
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {pct === 10 ? '10% (Padrão)' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-cyan-200/90 leading-relaxed bg-cyan-50/60 dark:bg-cyan-950/40 p-3.5 rounded-xl border border-cyan-100 dark:border-cyan-900/50 space-y-1">
                <div className="font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Impacto no Valor Final:
                </div>
                <p>
                  Com <b>{inputs.extraDiscountAffiliatePct}%</b> configurados, adicionamos <b>R$ {selectedMetrics.extraDiscountAffiliateAmount.toFixed(2)}</b> ao preço de venda para que você continue garantindo seu lucro líquido total de <b>R$ {selectedMetrics.netProfit.toFixed(2)} ({inputs.desiredProfitMarginPct}%)</b> mesmo após repassar descontos ou comissões a parceiros.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - RESULTS & BREAKDOWN */}
        <div className="lg:col-span-5 space-y-6">
          {/* MAIN PRICING SUMMARY CARD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Resumo de Precificação
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${selectedMarketplace.badgeColor}`}>
                {selectedMarketplace.name}
              </span>
            </div>

            {/* Big Recommended Price Display */}
            <div className="text-center py-3 bg-gradient-to-b from-indigo-50/70 via-slate-50 to-cyan-50/30 dark:from-indigo-950/60 dark:via-slate-900 dark:to-cyan-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 p-4 space-y-1">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                Preço Recomendado de Venda
              </span>
              <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 my-1 font-mono tracking-tight">
                R$ {selectedMetrics.recommendedPrice.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Garante <span className="font-bold text-emerald-600 dark:text-emerald-400">{inputs.desiredProfitMarginPct}%</span> de lucro líquido real (R$ {selectedMetrics.netProfit.toFixed(2)})
              </p>

              {inputs.extraDiscountAffiliatePct > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800">
                    +{inputs.extraDiscountAffiliatePct}% Comissão Repassada
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    (Sem comissão: <b>R$ {priceWithoutExtra.toFixed(2)}</b>)
                  </span>
                </div>
              )}
            </div>

            {/* Cost, Profit, Commission & Margin Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Custo Direto (COGS)</span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  R$ {totalDirectCost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Material + Energia + Insumos</span>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-0.5">Lucro Líquido Real</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  R$ {selectedMetrics.netProfit.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 block mt-0.5">
                  Bolso limpo pós-taxas
                </span>
              </div>

              {/* CARD DEDICADO: Comissões e Afiliados Extras */}
              <div className={`p-3 rounded-2xl border transition-all ${inputs.extraDiscountAffiliatePct > 0 ? 'bg-cyan-50/90 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-900/60 ring-2 ring-cyan-500/20' : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800'}`}>
                <span className="text-[11px] font-bold text-cyan-900 dark:text-cyan-200 flex items-center justify-between">
                  Comissão / Afiliados
                  <Gift className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </span>
                <span className="text-base font-bold text-cyan-700 dark:text-cyan-400 font-mono block mt-0.5">
                  R$ {selectedMetrics.extraDiscountAffiliateAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-cyan-800 dark:text-cyan-300/80 font-medium block mt-0.5">
                  {inputs.extraDiscountAffiliatePct > 0 ? `${inputs.extraDiscountAffiliatePct}% adicionados ao preço` : '0% (sem comissão)'}
                </span>
              </div>

              {/* Margem Líquida (% sobre a Venda) */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  Margem Líquida
                  <Percent className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                </span>
                <span className="text-base font-bold text-indigo-700 dark:text-indigo-400 font-mono block mt-0.5">
                  {selectedMetrics.realProfitMarginPct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80 block mt-0.5">
                  % sobre o Preço de Venda
                </span>
              </div>

              {/* Markup (% sobre o Custo Direto) */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 col-span-2">
                <span className="text-[11px] font-semibold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  Markup no Custo
                  <TrendingUp className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                </span>
                <span className="text-base font-bold text-purple-700 dark:text-purple-400 font-mono block mt-0.5">
                  +{selectedMetrics.markupPct.toFixed(0)}% <span className="text-[11px] font-normal text-purple-600 dark:text-purple-300">({selectedMetrics.markupMultiplier.toFixed(2)}x sobre R$ {totalDirectCost.toFixed(2)})</span>
                </span>
                <span className="text-[10px] text-purple-600/80 dark:text-purple-300/80 block mt-0.5">
                  Multiplicador total de custo para definir a venda
                </span>
              </div>
            </div>

            {/* Info Badge Explaining Difference between Margin and Markup */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-600" /> Entenda a diferença entre Margem e Markup:
              </div>
              <p>
                • <b>Margem Líquida ({selectedMetrics.realProfitMarginPct.toFixed(1)}%):</b> Porcentagem do valor final da venda que vai direto para o seu bolso como lucro.
              </p>
              <p>
                • <b>Markup (+{selectedMetrics.markupPct.toFixed(0)}% / {selectedMetrics.markupMultiplier.toFixed(2)}x):</b> Quantas vezes você multiplicou o custo de fabricação da peça (R$ {totalDirectCost.toFixed(2)}) para definir o preço cobrado.
              </p>
            </div>

            {/* Detailed Cost Component Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Composição do Preço Final</span>
                <span className="font-mono text-slate-500">100%</span>
              </div>

              {/* Multi-segmented Progress Bar */}
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {/* Filamento */}
                <div
                  style={{
                    width: `${Math.min(100, (totalFilamentCost / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-indigo-500 h-full"
                  title={`Filamento: R$ ${totalFilamentCost.toFixed(2)}`}
                />
                {/* Energia */}
                <div
                  style={{
                    width: `${Math.min(100, (electricityCost / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-amber-400 h-full"
                  title={`Energia: R$ ${electricityCost.toFixed(2)}`}
                />
                {/* Extras */}
                <div
                  style={{
                    width: `${Math.min(100, (totalExtraCosts / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-purple-500 h-full"
                  title={`Embalagens/Tags: R$ ${totalExtraCosts.toFixed(2)}`}
                />
                {/* Taxas Mkt */}
                <div
                  style={{
                    width: `${Math.min(100, ((selectedMetrics.totalFeesAmount - selectedMetrics.extraDiscountAffiliateAmount) / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-rose-400 h-full"
                  title={`Taxas Marketplace: R$ ${(selectedMetrics.totalFeesAmount - selectedMetrics.extraDiscountAffiliateAmount).toFixed(2)}`}
                />
                {/* Comissões / Afiliados */}
                <div
                  style={{
                    width: `${Math.min(100, (selectedMetrics.extraDiscountAffiliateAmount / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-cyan-500 h-full"
                  title={`Comissão/Afiliados (${inputs.extraDiscountAffiliatePct}%): R$ ${selectedMetrics.extraDiscountAffiliateAmount.toFixed(2)}`}
                />
                {/* Lucro */}
                <div
                  style={{
                    width: `${Math.min(100, (selectedMetrics.netProfit / selectedMetrics.recommendedPrice) * 100)}%`,
                  }}
                  className="bg-emerald-500 h-full"
                  title={`Lucro Líquido: R$ ${selectedMetrics.netProfit.toFixed(2)}`}
                />
              </div>

              {/* Legend Items */}
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] pt-1 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-600">Filamento:</span>
                  <span className="font-mono text-slate-900 font-bold">R$ {totalFilamentCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-600">Energia:</span>
                  <span className="font-mono text-slate-900 font-bold">R$ {electricityCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span className="text-slate-600">Embalagens/Tags:</span>
                  <span className="font-mono text-slate-900 font-bold">R$ {totalExtraCosts.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  <span className="text-slate-600">Taxas Marketplace:</span>
                  <span className="font-mono text-slate-900 font-bold">R$ {(selectedMetrics.totalFeesAmount - selectedMetrics.extraDiscountAffiliateAmount).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 pt-0.5 border-t border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span className="text-slate-600">Comissões/Afiliados ({inputs.extraDiscountAffiliatePct}%):</span>
                  <span className="font-mono text-cyan-700 font-bold">R$ {selectedMetrics.extraDiscountAffiliateAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* MANUAL PRICE SIMULATOR INPUT */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                Simular Preço Personalizado neste Marketplace
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    placeholder={`Ex: ${selectedMetrics.recommendedPrice.toFixed(0)}`}
                    value={manualPriceInput}
                    onChange={(e) => setManualPriceInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                {manualPriceInput && (
                  <button
                    onClick={() => setManualPriceInput('')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Simulation Result Alert */}
              {manualSimulationMetrics && (
                <div className="p-3 bg-slate-900 text-white rounded-2xl text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Preço Simulado: <b>R$ {manualSimulationMetrics.price.toFixed(2)}</b></span>
                    <span>Taxas Mkt: <b>R$ {manualSimulationMetrics.totalFeesAmount.toFixed(2)}</b></span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800 font-bold">
                    <span>Lucro Líquido:</span>
                    <span className={manualSimulationMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      R$ {manualSimulationMetrics.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-300 font-mono">
                    <span>Margem na Venda: <b className="text-indigo-300">{manualSimulationMetrics.profitMarginPct.toFixed(1)}%</b></span>
                    <span>Markup no Custo: <b className="text-purple-300">+{manualSimulationMetrics.markupPct.toFixed(0)}%</b></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MULTI-CHANNEL COMPARISON TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Comparativo por Canal
              </h3>
              {inputs.extraDiscountAffiliatePct > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 border border-cyan-200">
                  +{inputs.extraDiscountAffiliatePct}% Comissão Incluída
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Quanto cobrar em cada canal para obter R$ {selectedMetrics.netProfit.toFixed(2)} de lucro líquido:
            </p>

            <div className="divide-y divide-slate-100">
              {DEFAULT_MARKETPLACES.map((mkt) => {
                const metrics = calculateMarketplaceMetrics(mkt, inputs.desiredProfitMarginPct);
                return (
                  <div key={mkt.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${mkt.badgeColor.split(' ')[0]}`} />
                      <span className="font-semibold text-slate-800">{mkt.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono block">
                        R$ {metrics.recommendedPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {inputs.extraDiscountAffiliatePct > 0
                          ? `(Taxas: R$ ${(metrics.totalFeesAmount - metrics.extraDiscountAffiliateAmount).toFixed(2)} + R$ ${metrics.extraDiscountAffiliateAmount.toFixed(2)} Com.)`
                          : `Taxas: R$ ${metrics.totalFeesAmount.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SAVE TO CATALOG MODAL OVERLAY */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-300 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Cadastrar no Catálogo de Produtos
              </h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: Suporte de Headset V2"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Categoria</label>
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white"
                >
                  <option value="Decoração">Decoração</option>
                  <option value="Chaveiros">Chaveiros</option>
                  <option value="Utilidades">Utilidades</option>
                  <option value="Peças Técnicas">Peças Técnicas</option>
                  <option value="Geek & Miniaturas">Geek & Miniaturas</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl space-y-1 text-indigo-950 font-medium">
                <div className="flex justify-between">
                  <span>Custo Calculado:</span>
                  <span className="font-bold">R$ {totalDirectCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Preço Padrão (Venda Direta):</span>
                  <span className="font-bold">
                    R$ {calculateMarketplaceMetrics(DEFAULT_MARKETPLACES[0], inputs.desiredProfitMarginPct).recommendedPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Preço Sugerido (Shopee/Marketplace):</span>
                  <span className="font-bold text-indigo-700">
                    R$ {selectedMetrics.recommendedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSaveProduct}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

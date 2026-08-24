export type ViewMode =
  | 'dashboard'
  | 'calculator'
  | 'products'
  | 'clients'
  | 'client-profile'
  | 'consignments'
  | 'visits'
  | 'visit-execution'
  | 'exchanges'
  | 'quotes'
  | 'orders'
  | 'inventory-general'
  | 'inventory-movements'
  | 'inventory-clients'
  | 'financial'
  | 'reports'
  | 'settings';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  isKeychain: boolean;
  description: string;
  storageCapacity?: string;
  imageUrl?: string;
  // Characteristics
  material: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina';
  color: string;
  weightGram: number;
  // Measures (mm)
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  // Production
  avgPrintTimeMinutes: number;
  batchQuantity: number;
  estimatedCost: number;
  // Pricing
  standardPrice: number; // Preço Consignado / Faturado
  cashPrice?: number;     // Preço À Vista / 50% Entrada
  minPrice: number;
  suggestedRetailPrice: number;
  // Inventory
  currentStock: number;
  minStock: number;
  // Customization
  allowsCustomization: boolean;
  customizationOptions: {
    name: boolean;
    logo: boolean;
    color: boolean;
    text: boolean;
    other: boolean;
  };
  status: 'Ativo' | 'Inativo';
  notes?: string;
  // Performance metrics
  monthlySalesCount?: number;
  turnoverRatePct?: number; // Giro
  daysWithoutMovement?: number;
}

export type ClientType = 'Cliente direto' | 'Revendedor' | 'Consignação' | 'Outro';
export type VisitFrequency = '7 dias' | '15 dias' | '30 dias' | 'Personalizado';

export interface Client {
  id: string;
  name: string; // Nome / Razão Social
  fantasyName?: string;
  avatarUrl?: string;
  document: string; // CPF or CNPJ
  stateRegistration?: string;
  responsible: string;
  phone: string;
  whatsapp: string;
  email: string;
  // Address
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  // Commercial
  type: ClientType;
  agreedPriceLevel: string;
  visitFrequency: VisitFrequency;
  notes?: string;
  status: 'Ativo' | 'Inativo';
  // Logistics default memory
  defaultLogisticsType?: 'combustivel' | 'frete' | 'retirada';
  defaultLogisticsCost?: number;
  // Calculated stats
  productsOnSiteCount: number;
  productsValuation: number; // Retail value of goods at store
  receivableBalance: number; // A receber
  lastVisitDate: string;
  nextVisitDate: string;
  visitStatus: 'Hoje' | 'Atrasada' | 'Em breve' | 'Concluída';
}

export interface ConsignmentItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Consignment {
  id: string; // e.g. REM-000041
  clientId: string;
  clientName: string;
  date: string;
  itemsCount: number;
  totalValue: number;
  status: 'Em andamento' | 'Finalizada' | 'Cancelada';
  lastAuditDate: string;
  items: ConsignmentItem[];
  notes?: string;
}

export interface ClientInventoryItem {
  productId: string;
  productName: string;
  sku?: string;
  sentQuantity?: number;
  soldQuantity?: number;
  currentQuantity?: number;
  quantityOnSite?: number;
  unitPrice: number;
  valuation?: number;
  daysOnSite?: number;
  status?: string;
  lastMovementDate?: string;
  imageUrl?: string;
}

export interface Visit {
  id: string; // e.g. VIS-000052
  clientId: string;
  clientName: string;
  scheduledDate: string;
  timeSlot?: string;
  reason: string;
  productsOnSite: number;
  lastVisitText: string;
  status: 'Hoje' | 'Atrasada' | 'Em breve' | 'Concluída';
  completedAt?: string;
  completedSummary?: {
    durationMinutes: number;
    itemsSold: number;
    totalRevenue: number;
    receivedAmount: number;
    itemsRemoved: number;
    itemsAdded: number;
    finalStockCount: number;
    nextVisitDate: string;
  };
}

export interface ExchangeNote {
  id: string; // e.g. TRC-000014
  visitId?: string;
  clientId: string;
  clientName: string;
  destinationClientId?: string;
  destinationClientName?: string;
  type?: 'troca_local' | 'migracao_lojas' | 'recolhimento_oficina';
  date: string;
  responsible: string;
  responsibleName?: string;
  itemsRemoved: {
    productId: string;
    productName: string;
    quantity: number;
    reason?: string;
  }[];
  itemsAdded?: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  notes?: string;
}

export type AttendanceMode = 'presencial' | 'online';

export type QuoteStatus = 'Rascunho' | 'Enviado' | 'Aguardando aprovação' | 'Aprovado' | 'Recusado' | 'Expirado';

export interface QuoteItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quote {
  id: string; // e.g. ORC-000034
  clientId: string;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  clientAddress?: string;
  date: string;
  validityDays: number;
  productionSlaDays: number;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentTerms: string;
  notes?: string;
  status: QuoteStatus;
  attendanceMode?: AttendanceMode;
  internalLogisticsType?: 'combustivel' | 'frete' | 'retirada';
  internalLogisticsCost?: number;
}

export type OrderStatus = 'Novo' | 'Aguardando pagamento' | 'Em produção' | 'Pronto' | 'Entregue' | 'Cancelado';

export interface Order {
  id: string; // e.g. PED-000081
  clientId: string;
  clientName: string;
  date: string;
  itemsCount: number;
  totalValue: number;
  paidAmount: number;
  paymentStatusText: string;
  status: OrderStatus;
  productionProgressPct: number;
  productionSlaDate?: string;
  estimatedDeliveryDate?: string;
  attendanceMode?: AttendanceMode;
  internalLogisticsType?: 'combustivel' | 'frete' | 'retirada';
  internalLogisticsCost?: number;
  notes?: string;
  paymentTerms?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  timeline: {
    date: string;
    title: string;
    description?: string;
  }[];
}

export type MovementType =
  | 'Entrada'
  | 'Saída'
  | 'Consignação'
  | 'Venda'
  | 'Reposição'
  | 'Retirada'
  | 'Troca'
  | 'Ajuste'
  | 'Produção';

export interface InventoryMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  quantityDelta: number; // positive or negative
  type: MovementType;
  clientName?: string;
  referenceCode?: string; // e.g. VIS-000052, PED-000081
  notes?: string;
}

export interface SaleTransaction {
  id: string;
  timestamp: string;
  clientName: string;
  amount: number;
  receivedAmount: number;
  balance: number;
  paymentMethod: 'PIX' | 'Dinheiro' | 'Cartão' | 'Outro';
  status: 'Pago' | 'Parcial' | 'Pendente' | 'Atrasado';
  dueDate: string;
  referenceCode?: string;
}

export interface AppSettings {
  company: {
    fantasyName: string;
    legalName: string;
    document: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    logoUrl?: string;
  };
  prefixes: {
    order: string; // PED
    quote: string; // ORC
    consignment: string; // REM
    exchange: string; // TRC
    visit: string; // VIS
  };
  quotes: {
    defaultValidityDays: number;
    defaultTerms: string;
    footerText: string;
  };
  inventory: {
    defaultMinStock: number;
  };
  lastBackupTimestamp?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface MarketplacePreset {
  id: string;
  name: string;
  commissionPct: number;
  fixedFee: number;
  freeShippingCost: number;
  affiliateCommissionPct: number;
  couponDiscountPct: number;
  badgeColor: string;
}

export interface CalculatorInputs {
  spoolPrice: number;
  spoolWeightGrams: number;
  printWeightGrams: number;
  failureRatePct: number;
  materialType: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina';
  printerPowerWatts: number;
  energyKwhCost: number;
  printHours: number;
  printMinutes: number;
  packagingCost: number;
  tagsCardsCost: number;
  hardwareCost: number;
  laborPrepCost: number;
  desiredProfitMarginPct: number;
  extraDiscountAffiliatePct: number;
}


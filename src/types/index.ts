export type QuestionnaireStatus = 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface ServiceItem {
  id: string;
  name: string;
  isCustom?: boolean;
  isPriority?: boolean;
  displayOrder?: number;
}

export type PricingModel = 'fixed' | 'hourly' | 'range' | 'complexity' | 'other';
export type MarketPosition = 'below' | 'similar' | 'above' | 'unknown';
export type RemoteCapability = 'online_100' | 'online_mostly' | 'hybrid' | 'mainly_in_person';

export interface ServiceAnswerItem {
  serviceId?: string;
  // Paso 3: Descripción cualitativa
  clientProblem?: string;
  solutionActions?: string;
  expectedResult?: string;
  typicalDuration?: string;

  // Paso 4: Precio
  pricingModel?: PricingModel;
  priceMin?: number | string;
  priceMax?: number | string;
  currency?: string;
  priceNotes?: string;

  // Paso 5: Mercado
  marketPosition?: MarketPosition;
  estimatedMarketPrice?: number | string;
  marketNotes?: string;

  // Paso 6: Rentabilidad
  profitabilityScore?: number | null;
  profitabilityIsUncertain?: boolean;

  // Paso 7: Facilidad operativa
  operationalEaseScore?: number | null;
  operationalIssues?: string[];
  operationalIssuesOther?: string;
  operationalNotes?: string;

  // Paso 8: Capacidad remota
  remoteCapability?: RemoteCapability;
  remoteChannels?: string[];
  remoteChannelsOther?: string;
  remoteNotes?: string;

  // Datos derivados
  opportunityScore?: number;
}

export interface TargetAudienceItem {
  key: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
  isCustom?: boolean;
}

export interface ClientItem {
  id: string;
  name: string;
  sector: string;
  country?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  verticalId?: string | null;
  verticalName?: string | null;
  status: QuestionnaireStatus;
  token: string;
  isProtected?: boolean;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  priorityServicesCount?: number;
  totalServicesCount?: number;
  questionnaires?: any[];
}

// ==========================================
// VERTICALES Y CATÁLOGO
// ==========================================

export interface BusinessVertical {
  id: string;
  organization_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: number | boolean;
  is_protected: number | boolean;
  created_at?: string;
  updated_at?: string;
  services_count?: number;
  clients_count?: number;
}

export interface CatalogService {
  id: string;
  organization_id?: string;
  vertical_id: string;
  vertical_name?: string;
  name: string;
  description?: string | null;
  default_priority: number | boolean;
  display_order: number;
  is_active: number | boolean;
  is_protected?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// PLANES ESTRATÉGICOS
// ==========================================

export interface StrategicPlanItem {
  id?: string;
  plan_id?: string;
  service_id?: string | null;
  service_name: string;
  diagnosis?: string | null;
  actions?: string[] | string | null;
  display_order?: number;
}

export interface StrategicPlan {
  id: string;
  organization_id?: string;
  client_id: string;
  client_name?: string;
  client_sector?: string;
  questionnaire_id?: string | null;
  title: string;
  status: 'DRAFT' | 'FINAL';
  general_diagnosis?: string | null;
  general_actions?: string[] | string | null;
  created_at?: string;
  updated_at?: string;
  items?: StrategicPlanItem[];
  items_count?: number;
}

// ==========================================
// PRESUPUESTOS Y SERVICIOS VEGEN
// ==========================================

export interface VegenService {
  id: string;
  organization_id?: string;
  name: string;
  description?: string | null;
  base_price: number;
  currency: string;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  service_id?: string | null;
  service_name: string;
  description?: string | null;
  base_price: number;
  final_price: number;
  display_order?: number;
  is_selected: number | boolean;
}

export interface Quote {
  id: string;
  organization_id?: string;
  client_id: string;
  client_name?: string;
  client_sector?: string;
  client_contact_name?: string;
  client_contact_email?: string;
  plan_id?: string | null;
  title: string;
  status: 'DRAFT' | 'PRESENTED' | 'ACCEPTED' | 'REJECTED';
  subtotal: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  discount_amount: number;
  total: number;
  currency: string;
  show_discount: number | boolean;
  show_item_prices: number | boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: QuoteItem[];
  items_count?: number;
}

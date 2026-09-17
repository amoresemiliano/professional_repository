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
  contactName: string;
  contactEmail: string;
  status: QuestionnaireStatus;
  token: string;
  createdAt: string;
  completedAt?: string;
  priorityServicesCount?: number;
  totalServicesCount?: number;
}

import { ServiceItem, TargetAudienceItem } from '../types';

export const DEFAULT_SERVICES = [
  'Extranjería',
  'Visados / residencia',
  'Nacionalidad',
  'Constitución de empresas',
  'Asesoramiento a emprendedores',
  'Derecho laboral',
  'Derecho civil',
  'Contratos',
];

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 's1',
    name: 'Visados y Autorizaciones de Residencia',
    isPriority: true,
  },
  {
    id: 's2',
    name: 'Nacionalidad Española por Residencia',
    isPriority: true,
  },
  {
    id: 's3',
    name: 'Arraigo y Regularización Extraordinaria',
    isPriority: true,
  },
  {
    id: 's4',
    name: 'Recursos Contencioso-Administrativos',
    isPriority: false,
  },
  {
    id: 's5',
    name: 'Constitución de Sociedades para Extranjeros',
    isPriority: false,
  },
];

export const OPERATIONAL_ISSUES_OPTIONS = [
  { id: 'docs', label: 'Muchos documentos' },
  { id: 'difficult_clients', label: 'Clientes difíciles' },
  { id: 'slow_admin', label: 'Procesos administrativos lentos' },
  { id: 'public_dependency', label: 'Dependencia de organismos públicos' },
  { id: 'many_meetings', label: 'Muchas reuniones' },
  { id: 'constant_followup', label: 'Seguimientos constantes' },
  { id: 'conflict_risk', label: 'Alto riesgo de conflicto' },
];

export const REMOTE_CHANNELS_OPTIONS = [
  { id: 'videocall', label: 'Videollamadas' },
  { id: 'whatsapp_email', label: 'WhatsApp / email' },
  { id: 'digital_signature', label: 'Firma digital' },
  { id: 'online_docs', label: 'Documentación online' },
  { id: 'physical_meetings', label: 'Requiere reuniones físicas' },
];

export const TARGET_AUDIENCE_OPTIONS = [
  { id: 'foreigners_living', label: 'Extranjeros que quieren vivir en España' },
  { id: 'moving_pros', label: 'Profesionales que se trasladan a España' },
  { id: 'foreign_companies', label: 'Empresas o emprendedores extranjeros que quieren operar en España' },
  { id: 'freelancers', label: 'Autónomos' },
  { id: 'smes', label: 'PYMES' },
  { id: 'spanish_legal', label: 'Particulares que necesitan asesoramiento profesional' },
];

export const INITIAL_TARGET_AUDIENCES: TargetAudienceItem[] = [
  { key: 'foreigners_living', label: 'Extranjeros que quieren vivir en España', priority: 'high' },
  { key: 'moving_pros', label: 'Profesionales que se trasladan a España', priority: 'high' },
  { key: 'foreign_companies', label: 'Empresas o emprendedores extranjeros que quieren operar en España', priority: 'medium' },
];

export const DIFFERENTIAL_OPTIONS = [
  { id: 'specialization', label: 'Especialización' },
  { id: 'experience', label: 'Experiencia' },
  { id: 'speed', label: 'Rapidez' },
  { id: 'close_contact', label: 'Trato cercano' },
  { id: 'price', label: 'Precio' },
  { id: 'explain_complex', label: 'Capacidad para explicar procesos complejos' },
  { id: 'online_support', label: 'Atención online' },
  { id: 'business_knowledge', label: 'Conocimiento empresarial' },
  { id: 'languages', label: 'Idiomas' },
  { id: 'availability', label: 'Disponibilidad' },
  { id: 'continuous_guidance', label: 'Acompañamiento durante todo el proceso' },
  { id: 'others', label: 'Otros' },
];

export const DEFAULT_DIFFERENTIAL_OPTIONS = [
  'specialization',
  'speed',
  'close_contact',
  'online_support',
  'continuous_guidance',
];

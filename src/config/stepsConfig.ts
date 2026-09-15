/**
 * Vegen Digital — Configuración Centralizada de Pasos del Cuestionario
 * Principio Open/Closed: Permite evolucionar y consultar metadata de los pasos
 * sin dispersar lógica o números mágicos por la aplicación.
 */

export interface StepMetadata {
  id: number;
  key: string;
  name: string;
  shortTitle: string;
  title: string;
  description: string;
}

export const QUESTIONNAIRE_STEPS: StepMetadata[] = [
  {
    id: 1,
    key: 'oferta',
    name: 'Oferta',
    shortTitle: 'Oferta',
    title: '¿Cuáles son tus principales servicios?',
    description:
      'Selecciona todos los servicios que ofreces actualmente. Puedes añadir personalizados con el botón inferior.',
  },
  {
    id: 2,
    key: 'prioritarios',
    name: 'Prioritarios',
    shortTitle: 'Prioritarios',
    title: '¿Cuáles consideras tus servicios principales?',
    description:
      'Indica entre 3 y 5 servicios que te interesan especialmente desarrollar o para los cuales quieres captar más clientes.',
  },
  {
    id: 3,
    key: 'descripcion',
    name: 'Descripción',
    shortTitle: 'Descripción',
    title: 'Descripción cualitativa de tus servicios prioritarios',
    description:
      'Proporciona detalles sobre el enfoque y resolución de cada servicio clave seleccionado.',
  },
  {
    id: 4,
    key: 'precios',
    name: 'Precios',
    shortTitle: 'Precios',
    title: 'Estructura de precios y honorarios habituales',
    description:
      'Indica el rango de honorarios promedio que sueles cobrar a tus clientes para cada servicio prioritario.',
  },
  {
    id: 5,
    key: 'mercado',
    name: 'Mercado',
    shortTitle: 'Mercado',
    title: 'Posicionamiento frente al mercado',
    description:
      '¿Cómo consideras que se encuentra tu precio respecto del promedio de mercado? Esta información ayuda a definir el mensaje de posicionamiento.',
  },
  {
    id: 6,
    key: 'rentabilidad',
    name: 'Rentabilidad',
    shortTitle: 'Rentabilidad',
    title: 'Rentabilidad percibida por servicio',
    description:
      'Evalúa la rentabilidad neta que deja cada servicio considerando tiempo invertido, honorarios y costes operativos.',
  },
  {
    id: 7,
    key: 'facilidad',
    name: 'Facilidad',
    shortTitle: 'Facilidad',
    title: 'Facilidad y predictibilidad operativa',
    description:
      '¿Qué tan fluido y estandarizado es prestar este servicio frente a trámites imprevisibles o con alta fricción externa?',
  },
  {
    id: 8,
    key: 'remoto',
    name: 'Remoto',
    shortTitle: 'Remoto',
    title: 'Capacidad de prestación remota',
    description:
      '¿Qué porcentaje de la gestión puede realizarse a distancia y por qué canales? Los servicios altamente remotos permiten ampliar el radio geográfico de captación.',
  },
  {
    id: 9,
    key: 'publicos',
    name: 'Públicos',
    shortTitle: 'Públicos',
    title: 'Públicos objetivos y perfiles de cliente',
    description:
      'Indica a qué tipos de clientes se dirigen principalmente tus servicios prioritarios y su grado de interés comercial.',
  },
  {
    id: 10,
    key: 'diferenciales',
    name: 'Diferenciales',
    shortTitle: 'Diferenciales',
    title: 'Factores diferenciales y propuesta de valor',
    description:
      '¿Qué elementos distinguen a tu despacho frente a la competencia en el mercado actual?',
  },
  {
    id: 11,
    key: 'resumen',
    name: 'Resumen',
    shortTitle: 'Resumen',
    title: 'Revisión final y confirmación',
    description:
      'Comprueba que toda la información refleje fielmente la realidad de tus servicios antes de finalizar el diagnóstico.',
  },
];

export const TOTAL_STEPS = 10; // Pasos de contenido (1 al 10, siendo el 11 el resumen de confirmación)

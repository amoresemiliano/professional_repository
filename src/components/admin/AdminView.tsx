import { useState } from 'react';
import { ClientItem } from '../../types';
import { Button } from '../common/Button';
import { Card, CardBody, CardHeader } from '../common/Card';
import { Badge } from '../common/Badge';
import { FormGroup, FormLabel, Input, Select } from '../common/FormControls';
import {
  IconPlus,
  IconCopy,
  IconStar,
  IconCheck,
  IconUsers,
  IconFileText,
  IconInfo,
} from '../common/Icons';

interface AdminViewProps {
  clientName?: string;
  onViewClient?: () => void;
}

export function AdminView({ clientName = 'Dr. Berlioz', onViewClient }: AdminViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'comparison' | 'matrix' | 'scoring-config'>('overview');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Clientes de demostración F1
  const [clients, setClients] = useState<ClientItem[]>([
    {
      id: 'c1',
      name: clientName,
      sector: 'Extranjería y Movilidad Internacional',
      contactName: 'Dr. Berlioz',
      contactEmail: 'contacto@drberlioz.com',
      status: 'COMPLETED',
      token: 'f8d3b2e1a9c40567',
      createdAt: '2026-09-10',
      completedAt: '2026-09-14',
      priorityServicesCount: 3,
      totalServicesCount: 5,
    },
    {
      id: 'c2',
      name: 'Gómez & Partners Abogados',
      sector: 'Derecho Mercantil y Startups',
      contactName: 'Lucía Gómez',
      contactEmail: 'lucia@gomezabogados.es',
      status: 'IN_PROGRESS',
      token: 'e2a4c9f0b1837465',
      createdAt: '2026-09-12',
      priorityServicesCount: 4,
      totalServicesCount: 7,
    },
    {
      id: 'c3',
      name: 'Navarro Asesoría Jurídica',
      sector: 'Derecho Laboral y Civil',
      contactName: 'Carlos Navarro',
      contactEmail: 'carlos@navarrojuristas.es',
      status: 'SENT',
      token: 'a9b8c7d6e5f40392',
      createdAt: '2026-09-15',
    },
  ]);

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientSector, setNewClientSector] = useState('Extranjería');

  // Configuración de pesos de Opportunity Score (v1.0)
  const [weights, setWeights] = useState({
    priority: 20,
    profitability: 30,
    operationalEase: 20,
    remoteScalability: 20,
    marketPosition: 10,
  });

  const totalWeights =
    weights.priority +
    weights.profitability +
    weights.operationalEase +
    weights.remoteScalability +
    weights.marketPosition;

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/q/${token}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newId = `c${Date.now()}`;
    const generatedToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    const created: ClientItem = {
      id: newId,
      name: newClientName,
      sector: newClientSector,
      contactName: newClientContact || 'Contacto principal',
      contactEmail: newClientEmail || 'contacto@despacho.com',
      status: 'SENT',
      token: generatedToken,
      createdAt: new Date().toISOString().split('T')[0],
      totalServicesCount: 0,
      priorityServicesCount: 0,
    };

    setClients([created, ...clients]);
    setNewClientName('');
    setNewClientContact('');
    setNewClientEmail('');
    setShowNewClientModal(false);
  };

  // Datos mock para comparativa y matriz F1
  const mockComparisonServices = [
    {
      name: 'Nacionalidad española por residencia',
      isPriority: true,
      price: '500 € – 800 €',
      market: 'Por debajo (-15%)',
      profitability: '4 / 5 (Alta)',
      ease: '4 / 5 (Fácil)',
      remote: '100% online',
      score: 88,
      x: 85, // Facilidad / Escalabilidad
      y: 80, // Rentabilidad
    },
    {
      name: 'Visados de nómadas digitales & inversores',
      isPriority: true,
      price: '1.200 € – 2.500 €',
      market: 'Similar al mercado',
      profitability: '5 / 5 (Muy alta)',
      ease: '4 / 5 (Fácil)',
      remote: '100% online',
      score: 94,
      x: 90,
      y: 95,
    },
    {
      name: 'Extranjería general y arraigos',
      isPriority: true,
      price: '750 € – 1.200 €',
      market: 'Similar al mercado',
      profitability: '4 / 5 (Alta)',
      ease: '3 / 5 (Media)',
      remote: 'Casi todo online (80%)',
      score: 79,
      x: 65,
      y: 75,
    },
    {
      name: 'Constitución de sociedades mercantiles',
      isPriority: false,
      price: '600 € – 1.000 €',
      market: 'Similar al mercado',
      profitability: '3 / 5 (Media)',
      ease: '3 / 5 (Media)',
      remote: 'Híbrido (50%)',
      score: 54,
      x: 50,
      y: 50,
    },
    {
      name: 'Contratos y asesoramiento mercantil continuo',
      isPriority: false,
      price: '150 € / hora',
      market: 'Por encima (+10%)',
      profitability: '3 / 5 (Media)',
      ease: '2 / 5 (Difícil)',
      remote: 'Híbrido (50%)',
      score: 48,
      x: 40,
      y: 50,
    },
  ];

  return (
    <div className="admin-layout">
      {/* Navegación de Pestañas Administrativas */}
      <nav className="admin-nav-bar" aria-label="Secciones de administración">
        <div className="container container-wide">
          <div className="admin-nav-tabs">
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Visión General
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              Clientes y Enlaces ({clients.length})
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              Comparativa de Servicios
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              Opportunity Matrix (2D)
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === 'scoring-config' ? 'active' : ''}`}
              onClick={() => setActiveTab('scoring-config')}
            >
              Configuración de Scoring
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: '1 0 auto', paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
        <div className="container container-wide">
          {/* =========================================================================
              TAB: VISIÓN GENERAL (METRICS + ACTIVIDAD RECIENTE)
              ========================================================================= */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                <div>
                  <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    Diagnósticos Comerciales y Marketing
                  </h1>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Herramienta interna de Vegen Digital para prospección y diagnóstico de servicios profesionales.
                  </p>
                </div>
                <Button variant="primary" iconLeft={<IconPlus size={16} />} onClick={() => setShowNewClientModal(true)}>
                  Nuevo cliente
                </Button>
              </div>

              {/* 4 Métricas Clave */}
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">Clientes Activos</div>
                  <div className="metric-value">{clients.length}</div>
                  <div className="metric-helper">Despachos registrados</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Cuestionarios en curso</div>
                  <div className="metric-value">{clients.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'SENT').length}</div>
                  <div className="metric-helper">Pendientes de completar</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Cuestionarios completados</div>
                  <div className="metric-value">{clients.filter((c) => c.status === 'COMPLETED').length}</div>
                  <div className="metric-helper">Listos para análisis</div>
                </div>

                <div className="metric-card">
                  <div className="metric-label">Respuestas recientes</div>
                  <div className="metric-value">1</div>
                  <div className="metric-helper">Últimos 7 días</div>
                </div>
              </div>

              {/* Diagnósticos Recientes */}
              <Card>
                <CardHeader>
                  <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Últimas respuestas y estados
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('clients')}>
                    Ver todos los clientes
                  </Button>
                </CardHeader>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Cliente / Despacho</th>
                        <th>Especialidad</th>
                        <th>Estado</th>
                        <th>Servicios</th>
                        <th>Enlace del Cuestionario</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td>
                            <strong>{client.name}</strong>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                              {client.contactName} • {client.contactEmail}
                            </div>
                          </td>
                          <td>{client.sector}</td>
                          <td>
                            <Badge
                              variant={
                                client.status === 'COMPLETED'
                                  ? 'success'
                                  : client.status === 'IN_PROGRESS'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {client.status === 'COMPLETED'
                                ? 'Completado'
                                : client.status === 'IN_PROGRESS'
                                ? 'En curso'
                                : 'Enviado'}
                            </Badge>
                          </td>
                          <td>
                            {client.totalServicesCount ? (
                              <span>
                                {client.priorityServicesCount} prioritarios / {client.totalServicesCount} total
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Sin respuestas</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <code style={{ fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-surface-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                                /q/{client.token.substring(0, 8)}...
                              </code>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleCopyLink(client.token)}
                                title="Copiar enlace directo"
                              >
                                {copiedToken === client.token ? <IconCheck size={14} style={{ color: 'var(--color-brand)' }} /> : <IconCopy size={14} />}
                              </button>
                            </div>
                          </td>
                          <td>
                            {client.status === 'COMPLETED' ? (
                              <Button variant="secondary" size="sm" onClick={() => setActiveTab('comparison')}>
                                Ver diagnóstico
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleCopyLink(client.token)}>
                                Reenviar link
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* =========================================================================
              TAB: CLIENTES Y ENLACES
              ========================================================================= */}
          {activeTab === 'clients' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                <div>
                  <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    Gestión de Clientes y Enlaces Únicos
                  </h1>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Generación de accesos seguros, revocables y sin usuario/contraseña para cada profesional.
                  </p>
                </div>
                <Button variant="primary" iconLeft={<IconPlus size={16} />} onClick={() => setShowNewClientModal(true)}>
                  Crear nuevo cliente
                </Button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Sector</th>
                      <th>Fecha creación</th>
                      <th>Estado</th>
                      <th>Token de acceso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td>
                          <strong>{client.name}</strong>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                            {client.contactName} ({client.contactEmail})
                          </div>
                        </td>
                        <td>{client.sector}</td>
                        <td>{client.createdAt}</td>
                        <td>
                          <Badge
                            variant={
                              client.status === 'COMPLETED'
                                ? 'success'
                                : client.status === 'IN_PROGRESS'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {client.status}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>
                              {client.token}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleCopyLink(client.token)}
                              title="Copiar link completo"
                            >
                              {copiedToken === client.token ? <IconCheck size={14} style={{ color: 'var(--color-brand)' }} /> : <IconCopy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (client.status === 'COMPLETED') setActiveTab('comparison');
                              else handleCopyLink(client.token);
                            }}
                          >
                            {client.status === 'COMPLETED' ? 'Ver informe' : 'Copiar URL'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: COMPARATIVA DE SERVICIOS
              ========================================================================= */}
          {activeTab === 'comparison' && (
            <div>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    Comparativa de Servicios — {clientName}
                  </h1>
                  <Badge variant="brand" icon={<IconCheck size={12} />}>
                    Cuestionario completado
                  </Badge>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Evaluación multicriterio y cálculo preliminar del Marketing Opportunity Score v1.0.
                </p>
              </div>

              <div className="data-table-container" style={{ marginBottom: 'var(--space-6)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Prioritario</th>
                      <th>Honorarios</th>
                      <th>Mercado</th>
                      <th>Rentabilidad</th>
                      <th>Facilidad Operativa</th>
                      <th>Prestación Remota</th>
                      <th>Opportunity Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockComparisonServices.map((row) => (
                      <tr key={row.name}>
                        <td>
                          <strong>{row.name}</strong>
                        </td>
                        <td>
                          {row.isPriority ? (
                            <Badge variant="priority" icon={<IconStar size={12} filled />}>
                              Sí
                            </Badge>
                          ) : (
                            <Badge variant="neutral">No</Badge>
                          )}
                        </td>
                        <td>{row.price}</td>
                        <td>
                          <span style={{ fontSize: 'var(--font-size-xs)' }}>{row.market}</span>
                        </td>
                        <td>{row.profitability}</td>
                        <td>{row.ease}</td>
                        <td>{row.remote}</td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <strong
                              style={{
                                fontSize: 'var(--font-size-base)',
                                color: row.score >= 80 ? 'var(--color-brand)' : 'var(--color-text-primary)',
                              }}
                            >
                              {row.score}
                            </strong>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                              / 100
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Explicabilidad Determinística del Score */}
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <IconInfo size={18} style={{ color: 'var(--color-brand)' }} />
                    <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Explicabilidad Determinística del Opportunity Score (Servicio Líder: 94/100)
                    </h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)', lineHeight: 'var(--line-height-relaxed)', marginBottom: 'var(--space-4)' }}>
                    El servicio <strong>&quot;Visados de nómadas digitales & inversores&quot;</strong> presenta la
                    combinación más favorable del despacho:
                  </p>
                  <div className="grid-3" style={{ marginBottom: 'var(--space-4)' }}>
                    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Escalabilidad</div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>100% Online</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Firma y trámite telemático</div>
                    </div>
                    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Rentabilidad</div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>5 / 5 (Muy alta)</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Ticket superior con bajo conflicto</div>
                    </div>
                    <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Prioridad Cliente</div>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Prioritario</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Especial interés en captación</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    * El score no representa una certeza de demanda externa de mercado, sino una hipótesis
                    estratégica normalizada basada en los 5 factores declarados por el profesional.
                  </p>
                </CardBody>
              </Card>
            </div>
          )}

          {/* =========================================================================
              TAB: OPPORTUNITY MATRIX (2D SVG GRAPH)
              ========================================================================= */}
          {activeTab === 'matrix' && (
            <div>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  Opportunity Matrix (2D)
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Eje X: Facilidad Operativa y Capacidad Remota • Eje Y: Rentabilidad Percibida.
                </p>
              </div>

              <div className="matrix-container">
                <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                  {/* SVG Nativo de la Matriz */}
                  <svg
                    viewBox="0 0 700 450"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    aria-label="Matriz 2D de oportunidades"
                  >
                    {/* Cuadrantes de fondo */}
                    <rect x="60" y="30" width="290" height="180" fill="#F8FAFC" />
                    <rect x="350" y="30" width="290" height="180" fill="#F0FDF4" />
                    <rect x="60" y="210" width="290" height="180" fill="#F1F5F9" />
                    <rect x="350" y="210" width="290" height="180" fill="#F8FAFC" />

                    {/* Etiquetas de cuadrantes */}
                    <text x="500" y="60" fill="#166534" fontSize="13" fontWeight="600" textAnchor="middle">
                      Zona de Captación Óptima
                    </text>
                    <text x="200" y="60" fill="#475569" fontSize="12" textAnchor="middle">
                      Alta Rentabilidad / Complejo
                    </text>
                    <text x="500" y="370" fill="#475569" fontSize="12" textAnchor="middle">
                      Fácil / Ticket Menor
                    </text>

                    {/* Ejes */}
                    <line x1="60" y1="210" x2="640" y2="210" stroke="#CBD5E1" strokeDasharray="4 4" />
                    <line x1="350" y1="30" x2="350" y2="390" stroke="#CBD5E1" strokeDasharray="4 4" />

                    {/* Borde exterior del área */}
                    <rect x="60" y="30" width="580" height="360" fill="none" stroke="#94A3B8" strokeWidth="1" />

                    {/* Títulos de ejes */}
                    <text x="350" y="420" fill="#334155" fontSize="13" fontWeight="600" textAnchor="middle">
                      Facilidad Operativa y Escalabilidad Remota →
                    </text>
                    <text
                      x="-210"
                      y="25"
                      fill="#334155"
                      fontSize="13"
                      fontWeight="600"
                      textAnchor="middle"
                      transform="rotate(-90)"
                    >
                      Rentabilidad Percibida →
                    </text>

                    {/* Puntos de Servicios */}
                    {mockComparisonServices.map((s, idx) => {
                      // Mapeo coordenadas: X 60..640 (span 580), Y 390..30 (span 360)
                      const cx = 60 + (s.x / 100) * 580;
                      const cy = 390 - (s.y / 100) * 360;

                      return (
                        <g key={s.name} style={{ cursor: 'pointer' }}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={s.isPriority ? 9 : 6}
                            fill={s.isPriority ? 'var(--color-brand)' : '#64748B'}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                          <text
                            x={cx + 12}
                            y={cy + 4}
                            fontSize="11"
                            fill="#0F172A"
                            fontWeight={s.isPriority ? '600' : '400'}
                          >
                            {idx + 1}. {s.name.split(' ')[0]} ({s.score})
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', fontSize: 'var(--font-size-xs)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--color-brand)' }} />
                    <span>Servicio Prioritario</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748B' }} />
                    <span>Servicio Secundario</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: CONFIGURACIÓN DE SCORING
              ========================================================================= */}
          {activeTab === 'scoring-config' && (
            <div>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  Configuración del Marketing Opportunity Score (v1.0)
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Ponderación de hipótesis de decisión para Vegen Digital. La suma de factores debe ser
                  exactamente 100%.
                </p>
              </div>

              <Card style={{ maxWidth: '640px' }}>
                <CardHeader>
                  <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Pesos de las dimensiones
                  </h2>
                  <Badge variant={totalWeights === 100 ? 'success' : 'danger'}>
                    Suma: {totalWeights} % {totalWeights === 100 ? '(Válido)' : '(Debe sumar 100%)'}
                  </Badge>
                </CardHeader>
                <CardBody>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert('Pesos actualizados y guardados para Vegen Digital.');
                    }}
                  >
                    <FormGroup>
                      <FormLabel htmlFor="w-priority">A. Prioridad del Cliente (%): {weights.priority}%</FormLabel>
                      <input
                        id="w-priority"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weights.priority}
                        onChange={(e) => setWeights({ ...weights, priority: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel htmlFor="w-prof">B. Rentabilidad Percibida (%): {weights.profitability}%</FormLabel>
                      <input
                        id="w-prof"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weights.profitability}
                        onChange={(e) => setWeights({ ...weights, profitability: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel htmlFor="w-ease">C. Facilidad Operativa (%): {weights.operationalEase}%</FormLabel>
                      <input
                        id="w-ease"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weights.operationalEase}
                        onChange={(e) => setWeights({ ...weights, operationalEase: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel htmlFor="w-remote">D. Escalabilidad Remota (%): {weights.remoteScalability}%</FormLabel>
                      <input
                        id="w-remote"
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={weights.remoteScalability}
                        onChange={(e) => setWeights({ ...weights, remoteScalability: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <FormLabel htmlFor="w-mkt">E. Posicionamiento en Mercado (%): {weights.marketPosition}%</FormLabel>
                      <input
                        id="w-mkt"
                        type="range"
                        min="0"
                        max="30"
                        step="5"
                        value={weights.marketPosition}
                        onChange={(e) => setWeights({ ...weights, marketPosition: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: 'var(--color-brand)' }}
                      />
                    </FormGroup>

                    <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setWeights({
                            priority: 20,
                            profitability: 30,
                            operationalEase: 20,
                            remoteScalability: 20,
                            marketPosition: 10,
                          })
                        }
                      >
                        Restablecer valores por defecto
                      </Button>
                      <Button type="submit" variant="primary" disabled={totalWeights !== 100}>
                        Guardar ponderaciones
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Modal para Crear Nuevo Cliente */}
      {showNewClientModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 'var(--space-4)',
          }}
          onClick={() => setShowNewClientModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-md)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
              Crear nuevo cliente y generar enlace
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
              Se creará el registro del profesional y se generará un enlace tokenizado privado.
            </p>

            <form onSubmit={handleCreateClient}>
              <FormGroup>
                <FormLabel htmlFor="client-name">Nombre del Despacho o Profesional</FormLabel>
                <Input
                  id="client-name"
                  placeholder="Ej: Sánchez Abogados España"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="client-sector">Sector / Especialidad</FormLabel>
                <Select
                  id="client-sector"
                  value={newClientSector}
                  onChange={(e) => setNewClientSector(e.target.value)}
                  options={[
                    { value: 'Extranjería y Visados', label: 'Extranjería y Visados' },
                    { value: 'Derecho Mercantil / Empresas', label: 'Derecho Mercantil / Empresas' },
                    { value: 'Derecho Laboral', label: 'Derecho Laboral' },
                    { value: 'Derecho Civil / Inmobiliario', label: 'Derecho Civil / Inmobiliario' },
                    { value: 'Otro sector profesional', label: 'Otro sector profesional' },
                  ]}
                />
              </FormGroup>

              <div className="grid-2">
                <FormGroup>
                  <FormLabel htmlFor="contact-name">Persona de contacto</FormLabel>
                  <Input
                    id="contact-name"
                    placeholder="Ej: Marta Sánchez"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="contact-email">Email</FormLabel>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="marta@sanchez.es"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                </FormGroup>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button type="button" variant="ghost" onClick={() => setShowNewClientModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Crear cliente y generar enlace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

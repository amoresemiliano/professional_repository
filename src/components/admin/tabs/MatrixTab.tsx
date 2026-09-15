import { ComparisonServiceRow } from '../../../services/adminService';

interface MatrixTabProps {
  services: ComparisonServiceRow[];
}

export function MatrixTab({ services }: MatrixTabProps) {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          Opportunity Matrix (2D)
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
          Eje X: Facilidad Operativa y Capacidad Remota • Eje Y: Rentabilidad Percibida.
        </p>
      </div>

      <div className="matrix-container">
        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          {/* SVG Nativo de la Matriz con viewBox responsive */}
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

            {/* Ejes centrales */}
            <line x1="60" y1="210" x2="640" y2="210" stroke="#CBD5E1" strokeDasharray="4 4" />
            <line x1="350" y1="30" x2="350" y2="390" stroke="#CBD5E1" strokeDasharray="4 4" />

            {/* Borde exterior */}
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
            {services.map((s, idx) => {
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
  );
}

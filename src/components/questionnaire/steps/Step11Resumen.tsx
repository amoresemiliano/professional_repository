import { ServiceItem, TargetAudienceItem } from '../../../types';
import { DIFFERENTIAL_OPTIONS } from '../../../config/defaults';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { IconCheck, IconStar, IconInfo } from '../../common/Icons';

interface Step11ResumenProps {
  services: ServiceItem[];
  audiences: TargetAudienceItem[];
  differentials: string[];
  customDifferentialText: string;
  finalPitch: string;
  isSubmitted: boolean;
  onGoToStep: (step: number) => void;
  onResetSubmission: () => void;
}

export function Step11Resumen({
  services,
  audiences,
  differentials,
  customDifferentialText,
  finalPitch,
  isSubmitted,
  onGoToStep,
  onResetSubmission,
}: Step11ResumenProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Resumen de tu diagnóstico</h1>
        <p className="step-description">
          Revisá las respuestas organizadas antes de enviar. Podés volver a cualquier sección
          haciendo clic en el botón &quot;Editar&quot;.
        </p>
      </header>

      {isSubmitted ? (
        <Card style={{ borderColor: 'var(--color-brand-border)', backgroundColor: 'var(--color-brand-light)' }}>
          <CardBody style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-6)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand)',
                color: 'var(--color-brand-contrast)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-4)',
              }}
            >
              <IconCheck size={28} />
            </div>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}>
              ¡Diagnóstico enviado correctamente!
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '50ch', margin: '0 auto var(--space-6) auto' }}>
              El equipo de Vegen Digital ha recibido tu información. Analizaremos tus servicios,
              capacidades operativas y oportunidades de captación para tu propuesta estratégica.
            </p>
            <Button variant="secondary" onClick={onResetSubmission}>
              Volver a visualizar respuestas
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Resumen de Servicios */}
          <Card>
            <CardHeader>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                Servicios y Prioridades ({services.length} en total)
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep(1)}>
                Editar servicios
              </Button>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {services.map((s) => (
                  <Badge
                    key={s.id}
                    variant={s.isPriority ? 'priority' : 'neutral'}
                    icon={s.isPriority ? <IconStar size={12} filled /> : undefined}
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Resumen de Públicos */}
          <Card>
            <CardHeader>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                Públicos Objetivo Prioritarios
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep(9)}>
                Editar públicos
              </Button>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {audiences.map((aud) => (
                  <div
                    key={aud.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <span>{aud.label}</span>
                    <Badge variant={aud.priority === 'high' ? 'brand' : 'neutral'}>
                      Prioridad {aud.priority === 'high' ? 'Alta' : 'Media'}
                    </Badge>
                  </div>
                ))}
                {audiences.length === 0 && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    No se han seleccionado públicos objetivos todavía.
                  </span>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Resumen de Diferenciales y Propuesta */}
          <Card>
            <CardHeader>
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                Propuesta de Valor y Diferenciales
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep(10)}>
                Editar propuesta
              </Button>
            </CardHeader>
            <CardBody>
              {finalPitch ? (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  &quot;{finalPitch}&quot;
                </p>
              ) : (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  No se ha introducido argumento diferenciador.
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {differentials.map((d) => {
                  if (d === 'others') {
                    return (
                      <Badge key={d} variant="brand">
                        {customDifferentialText.trim() ? `Otros: ${customDifferentialText.trim()}` : 'Otros'}
                      </Badge>
                    );
                  }
                  const opt = DIFFERENTIAL_OPTIONS.find((o) => o.id === d);
                  return <Badge key={d} variant="brand">{opt ? opt.label : d}</Badge>;
                })}
                {differentials.length === 0 && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    No se han seleccionado diferenciales.
                  </span>
                )}
              </div>
            </CardBody>
          </Card>

          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
            <IconInfo size={20} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
              Al enviar este diagnóstico, Vegen Digital procesará tus respuestas con el modelo de
              Opportunity Scoring para preparar tu sesión de estrategia comercial. Tus datos se
              tratan con estricta confidencialidad profesional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

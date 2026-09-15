import { TargetAudienceItem } from '../../../types';
import { TARGET_AUDIENCE_OPTIONS } from '../../../config/defaults';
import { Card, CardBody } from '../../common/Card';

interface Step9PublicosProps {
  audiences: TargetAudienceItem[];
  onSetAudiences: (audiences: TargetAudienceItem[]) => void;
}

export function Step9Publicos({
  audiences,
  onSetAudiences,
}: Step9PublicosProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">¿Qué tipo de cliente te interesa captar?</h1>
        <p className="step-description">
          Seleccioná los perfiles a los que diriges tu práctica e indicá el nivel de prioridad
          comercial que tiene cada uno para tu despacho.
        </p>
      </header>

      <div className="grid-1" style={{ marginBottom: 'var(--space-4)' }}>
        {TARGET_AUDIENCE_OPTIONS.map((aud) => {
          const existing = audiences.find((a) => a.key === aud.id);
          const isSelected = !!existing;

          return (
            <Card key={aud.id}>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          onSetAudiences(audiences.filter((a) => a.key !== aud.id));
                        } else {
                          onSetAudiences([...audiences, { key: aud.id, label: aud.label, priority: 'high' }]);
                        }
                      }}
                      style={{ accentColor: 'var(--color-brand)', width: '18px', height: '18px' }}
                    />
                    <span>{aud.label}</span>
                  </label>

                  {isSelected && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        Prioridad:
                      </span>
                      {(['high', 'medium', 'low'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`btn btn-sm ${existing?.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.15rem 0.5rem', minHeight: '26px' }}
                          onClick={() => {
                            onSetAudiences(
                              audiences.map((a) => (a.key === aud.id ? { ...a, priority: p } : a))
                            );
                          }}
                        >
                          {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

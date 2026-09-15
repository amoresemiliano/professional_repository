import { useState } from 'react';
import { TargetAudienceItem } from '../../../types';
import { TARGET_AUDIENCE_OPTIONS } from '../../../config/defaults';
import { Card, CardBody } from '../../common/Card';
import { Button } from '../../common/Button';
import { FormLabel, Input } from '../../common/FormControls';
import { IconTrash } from '../../common/Icons';

interface Step9PublicosProps {
  audiences: TargetAudienceItem[];
  onSetAudiences: (audiences: TargetAudienceItem[]) => void;
}

export function Step9Publicos({
  audiences,
  onSetAudiences,
}: Step9PublicosProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customAudienceName, setCustomAudienceName] = useState('');

  const handleAddCustom = () => {
    if (customAudienceName.trim()) {
      const key = `custom_${Date.now()}`;
      onSetAudiences([
        ...audiences,
        { key, label: customAudienceName.trim(), priority: 'high' },
      ]);
      setCustomAudienceName('');
      setShowAddCustom(false);
    }
  };

  const predefinedKeys = TARGET_AUDIENCE_OPTIONS.map((o) => o.id);
  const customAudiences = audiences.filter((a) => !predefinedKeys.includes(a.key));

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

        {/* Públicos personalizados / Otros */}
        {customAudiences.map((ca) => (
          <Card key={ca.key}>
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
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    {ca.label}
                  </span>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    Prioridad:
                  </span>
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn btn-sm ${ca.priority === p ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.15rem 0.5rem', minHeight: '26px' }}
                      onClick={() => {
                        onSetAudiences(
                          audiences.map((a) => (a.key === ca.key ? { ...a, priority: p } : a))
                        );
                      }}
                    >
                      {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger-ghost"
                    style={{ padding: '0.2rem', minHeight: '26px' }}
                    onClick={() => onSetAudiences(audiences.filter((a) => a.key !== ca.key))}
                    title="Eliminar público personalizado"
                    aria-label={`Eliminar ${ca.label}`}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {!showAddCustom ? (
        <Button variant="secondary" onClick={() => setShowAddCustom(true)}>
          + Añadir otro tipo de cliente
        </Button>
      ) : (
        <Card>
          <CardBody>
            <FormLabel htmlFor="custom-audience-input">Descripción del perfil de cliente</FormLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                id="custom-audience-input"
                placeholder="Describe otro tipo de cliente o perfil al que te diriges..."
                value={customAudienceName}
                onChange={(e) => setCustomAudienceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" onClick={handleAddCustom}>
                  Guardar
                </Button>
                <Button variant="ghost" onClick={() => setShowAddCustom(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

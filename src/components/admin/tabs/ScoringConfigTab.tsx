import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { FormGroup, FormLabel } from '../../common/FormControls';

export interface ScoringWeights {
  priority: number;
  profitability: number;
  operationalEase: number;
  remoteScalability: number;
  marketPosition: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  priority: 20,
  profitability: 30,
  operationalEase: 20,
  remoteScalability: 20,
  marketPosition: 10,
};

export function ScoringConfigTab() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const totalWeights =
    weights.priority +
    weights.profitability +
    weights.operationalEase +
    weights.remoteScalability +
    weights.marketPosition;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeights !== 100) return;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    setSavedSuccess(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          Configuración del Marketing Opportunity Score (v1.0)
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
          Ponderación de hipótesis de decisión para Vegen Digital. La suma de factores debe ser exactamente 100%.
        </p>
      </div>

      <Card style={{ maxWidth: '640px' }}>
        <CardHeader>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
            Pesos de las dimensiones
          </h3>
          <Badge variant={totalWeights === 100 ? 'success' : 'danger'}>
            Suma: {totalWeights} % {totalWeights === 100 ? '(Válido)' : '(Debe sumar 100%)'}
          </Badge>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
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
                style={{ width: '100%', accentColor: 'var(--color-brand)', height: '44px' }}
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
                style={{ width: '100%', accentColor: 'var(--color-brand)', height: '44px' }}
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
                style={{ width: '100%', accentColor: 'var(--color-brand)', height: '44px' }}
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
                style={{ width: '100%', accentColor: 'var(--color-brand)', height: '44px' }}
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
                style={{ width: '100%', accentColor: 'var(--color-brand)', height: '44px' }}
              />
            </FormGroup>

            {savedSuccess && (
              <p style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
                ✓ Ponderaciones guardadas correctamente para la sesión.
              </p>
            )}

            <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Button type="button" variant="ghost" onClick={handleReset}>
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
  );
}

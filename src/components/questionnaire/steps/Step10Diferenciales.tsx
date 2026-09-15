import { DIFFERENTIAL_OPTIONS } from '../../../config/defaults';
import { ChoiceCard } from '../../common/ChoiceCard';
import { FormGroup, FormLabel, Input, Textarea } from '../../common/FormControls';

interface Step10DiferencialesProps {
  differentials: string[];
  customDifferentialText: string;
  finalPitch: string;
  onSetDifferentials: (differentials: string[]) => void;
  onSetCustomDifferentialText: (text: string) => void;
  onSetFinalPitch: (pitch: string) => void;
}

export function Step10Diferenciales({
  differentials,
  customDifferentialText,
  finalPitch,
  onSetDifferentials,
  onSetCustomDifferentialText,
  onSetFinalPitch,
}: Step10DiferencialesProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Diferenciales y propuesta de valor</h1>
        <p className="step-description">
          ¿Qué te diferencia de otros profesionales o firmas de tu especialidad?
          Esta base estructurada fundamentará los argumentos de venta en tu web y campañas.
        </p>
      </header>

      <FormGroup>
        <FormLabel>Factores diferenciales clave (elige los más representativos)</FormLabel>
        <div className="grid-2">
          {DIFFERENTIAL_OPTIONS.map((diff) => {
            const isSelected = differentials.includes(diff.id);
            return (
              <ChoiceCard
                key={diff.id}
                title={diff.label}
                selected={isSelected}
                type="checkbox"
                onToggle={() => {
                  onSetDifferentials(
                    isSelected ? differentials.filter((d) => d !== diff.id) : [...differentials, diff.id]
                  );
                }}
              />
            );
          })}
        </div>
      </FormGroup>

      {/* Campo dinámico cuando se selecciona 'Otros' */}
      {differentials.includes('others') && (
        <FormGroup style={{ marginTop: 'var(--space-4)' }}>
          <FormLabel htmlFor="custom-diff-text">
            Desarrolla tu factor diferencial
          </FormLabel>
          <Input
            id="custom-diff-text"
            placeholder="Describe qué otro factor diferencial o metodología propia ofreces..."
            value={customDifferentialText}
            onChange={(e) => onSetCustomDifferentialText(e.target.value)}
          />
        </FormGroup>
      )}

      <FormGroup style={{ marginTop: 'var(--space-6)' }}>
        <FormLabel htmlFor="final-pitch">
          Si tuvieras que explicarle en pocas palabras a un potencial cliente por qué debería
          trabajar contigo y no con otro profesional, ¿qué le dirías?
        </FormLabel>
        <Textarea
          id="final-pitch"
          rows={4}
          placeholder="Escribe aquí tu argumento principal con tus propias palabras..."
          value={finalPitch}
          onChange={(e) => onSetFinalPitch(e.target.value)}
        />
        <p className="form-hint">
          No te preocupes por la redacción publicitaria: buscamos capturar tu tono natural y
          compromiso profesional.
        </p>
      </FormGroup>
    </div>
  );
}

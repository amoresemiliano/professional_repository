import { StepMetadata, TOTAL_STEPS } from '../../config/stepsConfig';

interface ProgressBarProps {
  currentStep: number;
  stepMeta?: StepMetadata;
}

export function ProgressBar({ currentStep, stepMeta }: ProgressBarProps) {
  // El paso 11 es el resumen de confirmación
  const displayStep = Math.min(currentStep, TOTAL_STEPS);
  const percent = Math.round((currentStep / (TOTAL_STEPS + 1)) * 100);

  return (
    <div className="progress-section" aria-label="Progreso del diagnóstico">
      <div className="progress-header">
        <span className="progress-step-count">
          {currentStep <= TOTAL_STEPS
            ? `Paso ${displayStep} de ${TOTAL_STEPS}`
            : 'Confirmación Final'}
        </span>
        <span className="progress-step-title">{stepMeta?.name || ''}</span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

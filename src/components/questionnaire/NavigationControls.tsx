import { Button } from '../common/Button';
import { IconArrowLeft, IconArrowRight, IconCheck } from '../common/Icons';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isNextDisabled?: boolean;
  submitting?: boolean;
}

export function NavigationControls({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSubmit,
  isNextDisabled = false,
  submitting = false,
}: NavigationControlsProps) {
  const isFirstStep = currentStep === 1;
  const isFinalStep = currentStep === totalSteps;

  return (
    <nav className="form-navigation" aria-label="Navegación del cuestionario">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="ghost"
            iconLeft={<IconArrowLeft size={16} />}
            onClick={onPrev}
          >
            Anterior
          </Button>
        )}
      </div>

      <div>
        {isFinalStep ? (
          <Button
            type="button"
            variant="primary"
            iconRight={<IconCheck size={16} />}
            onClick={onSubmit}
            loading={submitting}
          >
            Confirmar y Enviar Diagnóstico
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            iconRight={<IconArrowRight size={16} />}
            onClick={onNext}
            disabled={isNextDisabled}
          >
            Siguiente
          </Button>
        )}
      </div>
    </nav>
  );
}

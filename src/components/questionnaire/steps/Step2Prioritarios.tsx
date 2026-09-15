import { ServiceItem } from '../../../types';
import { ChoiceCard } from '../../common/ChoiceCard';
import { Badge } from '../../common/Badge';
import { IconCheck, IconStar } from '../../common/Icons';

interface Step2PrioritariosProps {
  services: ServiceItem[];
  priorityServices: ServiceItem[];
  onTogglePriority: (serviceId: string) => void;
}

export function Step2Prioritarios({
  services,
  priorityServices,
  onTogglePriority,
}: Step2PrioritariosProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">¿Cuáles consideras tus servicios principales?</h1>
        <p className="step-description">
          Indica entre 3 y 5 servicios que te interesan especialmente desarrollar o para los cuales quieres captar más clientes.
        </p>
      </header>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Prioritarios seleccionados:{' '}
            <strong>{priorityServices.length}</strong> de {services.length}
          </span>
          {priorityServices.length >= 3 && priorityServices.length <= 5 && (
            <Badge variant="success" icon={<IconCheck size={12} />}>
              Selección óptima (3 a 5)
            </Badge>
          )}
        </div>

        <div className="grid-1">
          {services.map((service) => (
            <ChoiceCard
              key={service.id}
              title={service.name}
              selected={!!service.isPriority}
              type="checkbox"
              badge={
                service.isPriority ? (
                  <Badge variant="priority" icon={<IconStar size={12} filled />}>
                    Prioritario
                  </Badge>
                ) : null
              }
              onToggle={() => onTogglePriority(service.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { ServiceItem, ServiceAnswerItem, RemoteCapability } from '../../../types';
import { REMOTE_CHANNELS_OPTIONS } from '../../../config/defaults';
import { Card, CardHeader, CardBody } from '../../common/Card';
import { ChoiceCard } from '../../common/ChoiceCard';
import { FormLabel } from '../../common/FormControls';

interface Step8RemotoProps {
  priorityServices: ServiceItem[];
  answers: Record<string, ServiceAnswerItem>;
  onUpdateAnswer: (serviceId: string, updates: Partial<ServiceAnswerItem>) => void;
}

export function Step8Remoto({
  priorityServices,
  answers,
  onUpdateAnswer,
}: Step8RemotoProps) {
  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">Capacidad de prestación remota</h1>
        <p className="step-description">
          ¿Qué porcentaje de la gestión puede realizarse a distancia y por qué canales?
          Los servicios altamente remotos permiten ampliar el radio geográfico de captación.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {priorityServices.map((service) => {
          const ans: Partial<ServiceAnswerItem> = answers[service.id] || {};
          const channels = ans.remoteChannels || [];

          return (
            <Card key={service.id}>
              <CardHeader>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {service.name}
                </h2>
              </CardHeader>
              <CardBody>
                <FormLabel>Modalidad habitual de prestación</FormLabel>
                <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                  {[
                    { id: 'online_100', title: '100 % online', subtitle: 'Sin necesidad de encuentros presenciales' },
                    { id: 'online_mostly', title: 'Casi todo online', subtitle: 'Solo trámites finales o juras puntuales' },
                    { id: 'hybrid', title: 'Híbrido', subtitle: 'Requiere firma presencial o acudir al despacho' },
                    { id: 'mainly_in_person', title: 'Principalmente presencial', subtitle: 'Vistas judiciales o presencia indispensable' },
                  ].map((rem) => (
                    <ChoiceCard
                      key={rem.id}
                      title={rem.title}
                      subtitle={rem.subtitle}
                      selected={ans.remoteCapability === rem.id}
                      type="radio"
                      onToggle={() =>
                        onUpdateAnswer(service.id, {
                          remoteCapability: rem.id as RemoteCapability,
                        })
                      }
                    />
                  ))}
                </div>

                <FormLabel optional>Canales digitales y herramientas que utilizás</FormLabel>
                <div className="grid-2" style={{ marginBottom: 'var(--space-4)' }}>
                  {REMOTE_CHANNELS_OPTIONS.map((ch) => {
                    const isSelected = channels.includes(ch.id);
                    return (
                      <ChoiceCard
                        key={ch.id}
                        title={ch.label}
                        selected={isSelected}
                        type="checkbox"
                        onToggle={() => {
                          const updated = isSelected
                            ? channels.filter((c) => c !== ch.id)
                            : [...channels, ch.id];
                          onUpdateAnswer(service.id, { remoteChannels: updated });
                        }}
                      />
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

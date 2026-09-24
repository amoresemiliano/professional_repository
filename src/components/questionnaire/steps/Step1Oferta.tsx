import { useState } from 'react';
import { ServiceItem } from '../../../types';
import { DEFAULT_SERVICES } from '../../../config/defaults';
import { Button } from '../../common/Button';
import { Card, CardBody } from '../../common/Card';
import { ChoiceCard } from '../../common/ChoiceCard';
import { Badge } from '../../common/Badge';
import { FormLabel, Input } from '../../common/FormControls';
import { IconTrash } from '../../common/Icons';

interface Step1OfertaProps {
  services: ServiceItem[];
  onToggleService: (serviceName: string) => void;
  onAddCustomService: (name: string) => void;
  onRemoveCustomService: (id: string) => void;
}

export function Step1Oferta({
  services,
  onToggleService,
  onAddCustomService,
  onRemoveCustomService,
}: Step1OfertaProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');

  const handleAdd = () => {
    if (customServiceName.trim()) {
      onAddCustomService(customServiceName.trim());
      setCustomServiceName('');
      setShowAddCustom(false);
    }
  };

  return (
    <div>
      <header className="step-header">
        <h1 className="step-title">¿Qué servicios brindas?</h1>
        <p className="step-description">
          Selecciona los servicios que brindas actualmente. Si alguno no aparece en la lista, puedes añadirlo.
        </p>
      </header>

      <div className="grid-1" style={{ marginBottom: 'var(--space-4)' }}>
        {services.map((service) => (
          <ChoiceCard
            key={service.id}
            title={service.name}
            selected={true}
            type="checkbox"
            badge={service.isCustom ? <Badge variant="neutral">Personalizado</Badge> : undefined}
            onToggle={() => onToggleService(service.name)}
            actionButton={
              service.isCustom ? (
                <button
                  type="button"
                  className="btn btn-sm btn-danger-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomService(service.id);
                  }}
                  title="Eliminar servicio personalizado"
                  aria-label={`Eliminar ${service.name}`}
                >
                  <IconTrash size={14} />
                </button>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* Añadir Servicio Personalizado */}
      {!showAddCustom ? (
        <Button variant="secondary" onClick={() => setShowAddCustom(true)}>
          + Añadir otro servicio
        </Button>
      ) : (
        <Card>
          <CardBody>
            <FormLabel htmlFor="custom-service-input">Nombre del nuevo servicio</FormLabel>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <Input
                id="custom-service-input"
                placeholder="Ej: Consultoría, Asesoría integral..."
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" onClick={handleAdd}>
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

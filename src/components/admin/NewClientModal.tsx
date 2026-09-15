import { useState } from 'react';
import { Button } from '../common/Button';
import { FormGroup, FormLabel, Input, Select } from '../common/FormControls';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: (clientData: {
    name: string;
    sector: string;
    contactName: string;
    contactEmail: string;
  }) => void;
}

export function NewClientModal({
  isOpen,
  onClose,
  onCreateClient,
}: NewClientModalProps) {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('Extranjería y Visados');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateClient({
      name: name.trim(),
      sector,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
    });

    setName('');
    setContactName('');
    setContactEmail('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 'var(--space-4)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-client-title"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '520px',
          width: '100%',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="modal-client-title"
          style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2)' }}
        >
          Crear nuevo cliente y generar enlace
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
          Se creará el registro del profesional y se generará un enlace tokenizado privado.
        </p>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel htmlFor="new-client-name">Nombre del Despacho o Profesional</FormLabel>
            <Input
              id="new-client-name"
              placeholder="Ej: Sánchez Abogados España"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="new-client-sector">Sector / Especialidad</FormLabel>
            <Select
              id="new-client-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              options={[
                { value: 'Extranjería y Visados', label: 'Extranjería y Visados' },
                { value: 'Derecho Mercantil / Empresas', label: 'Derecho Mercantil / Empresas' },
                { value: 'Derecho Laboral', label: 'Derecho Laboral' },
                { value: 'Derecho Civil / Inmobiliario', label: 'Derecho Civil / Inmobiliario' },
                { value: 'Otro sector profesional', label: 'Otro sector profesional' },
              ]}
            />
          </FormGroup>

          <div className="grid-2">
            <FormGroup>
              <FormLabel htmlFor="new-contact-name">Persona de contacto</FormLabel>
              <Input
                id="new-contact-name"
                placeholder="Ej: Marta Sánchez"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="new-contact-email">Email</FormLabel>
              <Input
                id="new-contact-email"
                type="email"
                placeholder="marta@sanchez.es"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </FormGroup>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear cliente y generar enlace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

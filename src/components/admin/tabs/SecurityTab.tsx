import React, { useState } from 'react';
import { authService } from '../../../services/authService';
import { Card, CardBody } from '../../common/Card';
import { FormGroup, FormLabel, Input } from '../../common/FormControls';
import { Button } from '../../common/Button';
import { IconAlertCircle, IconCheck } from '../../common/Icons';

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('La nueva contraseña y su repetición no coinciden.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('La nueva contraseña no puede ser idéntica a la actual.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Contraseña actualizada exitosamente.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.error || 'No fue posible actualizar la contraseña.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px' }}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
          Mi cuenta / Seguridad
        </h2>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          Gestión de credenciales de acceso para la cuenta de administración
        </p>
      </div>

      <Card>
        <CardBody>
          {successMessage && (
            <div
              className="alert alert-success"
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--color-success)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-success)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <IconCheck size={16} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              className="alert alert-warning"
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-danger, #ef4444)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger, #ef4444)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormGroup>
              <FormLabel htmlFor="sec-current-password">Contraseña actual</FormLabel>
              <Input
                id="sec-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="sec-new-password">Nueva contraseña</FormLabel>
              <Input
                id="sec-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="sec-confirm-password">Repetir nueva contraseña</FormLabel>
              <Input
                id="sec-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
              />
            </FormGroup>

            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                style={{ width: '100%' }}
              >
                Guardar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

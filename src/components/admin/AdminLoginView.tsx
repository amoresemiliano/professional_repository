import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';
import { Card, CardBody } from '../common/Card';
import { FormGroup, FormLabel, Input } from '../common/FormControls';
import { IconAlertCircle, IconArrowLeft } from '../common/Icons';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onBackToDiagnosis: () => void;
}

export function AdminLoginView({ onLoginSuccess, onBackToDiagnosis }: AdminLoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDev = authService.isDev();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'No se pudo iniciar sesión.');
      }
    } catch {
      setErrorMessage('Ocurrió un error al procesar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    authService.loginAsDemo();
    onLoginSuccess();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 180px)',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Volver al diagnóstico */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onBackToDiagnosis}
          style={{
            marginBottom: 'var(--space-4)',
            paddingLeft: 0,
            color: 'var(--color-text-secondary)',
          }}
        >
          <IconArrowLeft size={16} />
          <span>Volver al diagnóstico</span>
        </button>

        <Card>
          <CardBody>
            {/* Logo de Vegen Digital */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <img
                src="/assets/logo_vegen_negativo.png"
                alt="Vegen Digital"
                style={{
                  height: '38px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'inline-block',
                  marginBottom: 'var(--space-3)',
                }}
              />
              <h1
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Acceso administrador
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-1)',
                }}
              >
                Panel de gestión interna y análisis de oportunidades
              </p>
            </div>

            {/* Mensaje de Error */}
            {errorMessage && (
              <div
                className="alert alert-warning"
                role="alert"
                style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}
              >
                <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Formulario de Login */}
            <form onSubmit={handleSubmit} noValidate>
              <FormGroup>
                <FormLabel htmlFor="admin-email">Email</FormLabel>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@vegendigital.com"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="admin-password">Contraseña</FormLabel>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormGroup>

              <div style={{ marginTop: 'var(--space-6)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  style={{ width: '100%' }}
                >
                  Ingresar
                </Button>
              </div>
            </form>

            {/* Opción de Modo Demo EXCLUSIVA para desarrollo */}
            {isDev && (
              <div
                style={{
                  marginTop: 'var(--space-6)',
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px dashed var(--color-border)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-tertiary)',
                    marginBottom: 'var(--space-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Entorno de desarrollo local
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleDemoLogin}
                  style={{ width: '100%' }}
                >
                  Entrar en modo demo
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

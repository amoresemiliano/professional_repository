import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { Card, CardBody } from './Card';
import { IconAlertCircle } from './Icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log interno en consola sin exponer stack trace en la interfaz de usuario
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <Card>
              <CardBody>
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-danger-light)',
                      color: 'var(--color-danger)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <IconAlertCircle size={28} />
                  </div>
                  <h1
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {this.props.fallbackTitle || 'Ha ocurrido un error inesperado'}
                  </h1>
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--line-height-normal)',
                      marginBottom: 'var(--space-6)',
                    }}
                  >
                    {this.props.fallbackMessage ||
                      'No te preocupes: los datos del diagnóstico se guardan automáticamente. Puedes recargar la página para continuar.'}
                  </p>
                  <Button variant="primary" onClick={this.handleReset}>
                    Recargar página
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

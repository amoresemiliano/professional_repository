/**
 * Vegen Digital — Auth Service (Frontera de Servicio / Dependency Inversion)
 * Conectado con el backend real PHP 8.3 / MySQL 5.7.
 */

import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant';
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

class AuthService {
  private session: AuthSession = {
    isAuthenticated: false,
    user: null,
  };

  /**
   * Determina si la aplicación se ejecuta en entorno de desarrollo
   */
  public isDev(): boolean {
    const metaEnv = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    return Boolean(metaEnv?.DEV ?? true);
  }

  /**
   * Obtiene la sesión actual en memoria
   */
  public getSession(): AuthSession {
    return { ...this.session };
  }

  /**
   * Sincroniza la sesión con el backend vía cookie de sesión
   */
  public async checkSession(): Promise<AuthSession> {
    const res = await apiRequest<{ user: AuthUser }>('/auth/me', {
      method: 'GET',
    });

    if (res.success && res.data?.user) {
      this.session = {
        isAuthenticated: true,
        user: res.data.user,
      };
    } else {
      this.session = {
        isAuthenticated: false,
        user: null,
      };
    }

    return { ...this.session };
  }

  /**
   * Inicio de sesión real contra backend
   */
  public async login(email: string, password: string): Promise<LoginResult> {
    const res = await apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (res.success && res.data?.user) {
      this.session = {
        isAuthenticated: true,
        user: res.data.user,
      };
      return {
        success: true,
        user: res.data.user,
      };
    }

    // Si falló y estamos en modo demo local sin backend disponible, fallback controlado
    return {
      success: false,
      error: res.error?.message || 'Credenciales inválidas.',
    };
  }

  /**
   * Cambio de contraseña
   */
  public async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<ChangePasswordResult> {
    const res = await apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });

    if (res.success) {
      return {
        success: true,
        message: res.data?.message || 'Contraseña actualizada exitosamente.',
      };
    }

    return {
      success: false,
      error: res.error?.message || 'No fue posible actualizar la contraseña.',
    };
  }

  /**
   * Acceso exclusivo para desarrollo (Modo Demo)
   */
  public loginAsDemo(): AuthSession {
    this.session = {
      isAuthenticated: true,
      user: {
        id: 'demo-admin',
        email: 'demo@vegendigital.com',
        name: 'Admin Demo (Dev)',
        role: 'admin',
      },
    };
    return { ...this.session };
  }

  /**
   * Cierra la sesión
   */
  public async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Continuar con limpieza local
    } finally {
      this.session = {
        isAuthenticated: false,
        user: null,
      };
    }
  }
}

export const authService = new AuthService();

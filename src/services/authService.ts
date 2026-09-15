/**
 * Vegen Digital — Auth Service (Frontera de Servicio / Dependency Inversion)
 * Contrato de autenticación para frontend desacoplado.
 * En F1.2 proporciona la interfaz y el mock de desarrollo controlado.
 * En F2 será reemplazado por la implementación real con backend.
 */

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
   * Obtiene la sesión actual
   */
  public getSession(): AuthSession {
    return { ...this.session };
  }

  /**
   * Intento de login estándar
   * En producción (hasta F2), informa neutralmente que el backend no está conectado.
   */
  public async login(email: string, _password: string): Promise<LoginResult> {
    // Simula una breve latencia de red para validar estado loading en UI
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!this.isDev()) {
      return {
        success: false,
        error: 'El acceso administrativo todavía no está conectado.',
      };
    }

    // En desarrollo, si se introducen credenciales válidas básicas de prueba
    if (email.trim()) {
      const user: AuthUser = {
        id: 'admin-1',
        email: email.trim(),
        name: 'Administrador Vegen',
        role: 'admin',
      };
      this.session = { isAuthenticated: true, user };
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Por favor, ingresa un correo electrónico válido.',
    };
  }

  /**
   * Acceso exclusivo para desarrollo (Modo Demo)
   * Permite inspeccionar y auditar visualmente el panel sin credenciales
   */
  public loginAsDemo(): AuthSession {
    if (!this.isDev()) {
      throw new Error('Modo demo no disponible en producción');
    }
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
    this.session = {
      isAuthenticated: false,
      user: null,
    };
  }
}

export const authService = new AuthService();

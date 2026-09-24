/**
 * Vegen Digital — Cliente API Centralizado
 * Gestiona peticiones seguras al backend con credentials: 'include'.
 */

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('vegendigital.com')) {
    return envUrl.replace(/\/+$/, '');
  }
  return '/api';
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    request_id?: string;
    details?: any;
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Si baseUrl ya termina con /api y normalizedEndpoint empieza con /api, evitar duplicación
  let url = `${baseUrl}${normalizedEndpoint}`;
  if (baseUrl.endsWith('/api') && normalizedEndpoint.startsWith('/api')) {
    url = `${baseUrl}${normalizedEndpoint.substring(4)}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Obligatorio para cookies de sesión seguras
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || {
          code: `HTTP_${response.status}`,
          message: data?.error?.message || `Error en la solicitud (${response.status})`,
        },
      };
    }

    return data;
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Error de conexión con el servidor',
      },
    };
  }
}

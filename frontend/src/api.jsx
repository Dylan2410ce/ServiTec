const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'servitec_token';

/**
 * Obtiene el token de autenticación almacenado en el navegador.
 */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Guarda o elimina el token de autenticación en el almacenamiento local.
 */
export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Construye la URL completa concatenando la ruta base y los parámetros de consulta válidos.
 */
function buildUrl(endpoint, params = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${cleanEndpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

/**
 * Normaliza los errores devueltos por Django REST Framework (400, 401, 403, 404, 409)
 * en un objeto estándar con estado HTTP, mensaje principal y errores por campo.
 */
function parseApiError(status, data) {
  const fieldErrors = {};
  let message = 'Ocurrió un error al procesar la solicitud.';

  if (status === 401) {
    message = data?.detail || 'Sesión no iniciada o token inválido (401).';
  } else if (status === 403) {
    message = data?.detail || 'No tiene permisos para realizar esta acción (403).';
  } else if (status === 404) {
    message = data?.error || data?.detail || 'El registro solicitado no existe (404).';
  } else if (status === 409) {
    message = data?.error || 'Conflicto de integridad: el registro está en uso o bloqueado (409).';
  } else if (status === 400 && data && typeof data === 'object') {
    const messages = [];
    Object.entries(data).forEach(([field, errors]) => {
      const text = Array.isArray(errors) ? errors.join(' ') : String(errors);
      fieldErrors[field] = text;
      if (field === 'non_field_errors' || field === 'detail') {
        messages.push(text);
      } else {
        messages.push(`${field}: ${text}`);
      }
    });
    message = messages.length > 0 ? messages.join(' | ') : 'Revise los datos ingresados (400).';
  }

  const error = new Error(message);
  error.status = status;
  error.fieldErrors = fieldErrors;
  error.raw = data;
  return error;
}

/**
 * Ejecuta una petición HTTP con fetch nativo, inyectando el token y manejando
 * respuestas JSON, respuestas vacías (204) y fallos de red.
 */
export async function apiRequest(endpoint, { method = 'GET', body = null, params = {}, auth = true } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Token ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(buildUrl(endpoint, params), {
      method,
      headers,
      body: body !== null ? JSON.stringify(body) : undefined,
    });
  } catch {
    const networkError = new Error('No se pudo conectar con el servidor de ServiTec. Verifique que Django esté activo.');
    networkError.status = 0;
    networkError.fieldErrors = {};
    throw networkError;
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      setStoredToken(null);
      window.dispatchEvent(new Event('servitec:unauthorized'));
    }
    throw parseApiError(response.status, data);
  }

  return data;
}

/**
 * Realiza una consulta GET a un recurso de la API.
 */
export function apiGet(endpoint, params = {}, auth = true) {
  return apiRequest(endpoint, { method: 'GET', params, auth });
}

/**
 * Envía una petición POST para crear un recurso o autenticar usuario.
 */
export function apiPost(endpoint, body, auth = true) {
  return apiRequest(endpoint, { method: 'POST', body, auth });
}

/**
 * Envía una petición PUT para actualizar completamente un recurso.
 */
export function apiPut(endpoint, body) {
  return apiRequest(endpoint, { method: 'PUT', body });
}

/**
 * Envía una petición PATCH para actualizar parcialmente un recurso.
 */
export function apiPatch(endpoint, body) {
  return apiRequest(endpoint, { method: 'PATCH', body });
}

/**
 * Envía una petición DELETE para eliminar un recurso existente.
 */
export function apiDelete(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

/**
 * Recorre todas las páginas de un endpoint paginado de Django (5 registros por página)
 * para poblar selectores completos y cruzar nombres de llaves foráneas.
 */
export async function fetchAllPages(endpoint, params = {}) {
  const firstPage = await apiGet(endpoint, { ...params, page: 1 });
  if (!firstPage || !Array.isArray(firstPage.resultados)) {
    return [];
  }

  const allItems = [...firstPage.resultados];
  const totalPages = firstPage.total_paginas || 1;

  if (totalPages > 1) {
    const requests = [];
    for (let p = 2; p <= totalPages; p += 1) {
      requests.push(apiGet(endpoint, { ...params, page: p }));
    }
    const pages = await Promise.all(requests);
    pages.forEach((pageData) => {
      if (pageData?.resultados) {
        allItems.push(...pageData.resultados);
      }
    });
  }

  return allItems;
}

/**
 * Formatea un monto numérico a moneda en colones costarricenses.
 */
export function formatCurrency(amount) {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Formatea una fecha ISO de Django a formato legible local (dd/mm/yyyy HH:mm).
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Convierte una fecha ISO del backend al formato requerido por <input type="datetime-local">.
 */
export function toDateTimeLocalValue(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
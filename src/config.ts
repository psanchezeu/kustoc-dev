/**
 * Configuración centralizada del servidor para todas las APIs
 * Detecta automáticamente si estamos en producción o desarrollo
 */

// Determinar el entorno actual
const isProduction = window.location.hostname !== 'localhost';

// Configurar la URL base según el entorno
let baseUrl = 'http://localhost:3001';

if (isProduction) {
  // Si estamos en el dominio hostybee.com, usar la URL correcta para producción
  // Usar el mismo origen para evitar problemas CORS
  baseUrl = `${window.location.protocol}//${window.location.hostname}:63512`;
}

export const SERVER_CONFIG = {
  BASE_URL: baseUrl
};

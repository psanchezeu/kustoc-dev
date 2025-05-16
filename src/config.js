export const SERVER_CONFIG = {
  // Determinar si estamos en producción (desplegado en la nube) o en desarrollo local
  get IS_PRODUCTION() {
    return window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  },
  // Configuración para entorno de desarrollo
  DEV_IP: 'localhost',
  DEV_PORT: 3001,
  // En producción, el backend debe estar en el mismo dominio pero en el puerto correcto
  // Usamos https en producción
  get BASE_URL() {
    if (this.IS_PRODUCTION) {
      // En producción, usar el mismo hostname pero con el puerto correcto del backend
      return `https://${window.location.hostname}:63512`;
    } else {
      // En desarrollo local
      return `http://${this.DEV_IP}:${this.DEV_PORT}`;
    }
  }
};
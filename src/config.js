// Detectar si estamos en entorno de producción basado en la URL
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const SERVER_CONFIG = {
  // En producción usar hostybee.com, en desarrollo usar localhost
  IP: isProduction ? 'hostybee.com' : 'localhost',
  // En producción usar 63512, en desarrollo usar 3001
  PORT: isProduction ? 63512 : 3001,
  get BASE_URL() {
    // En producción usamos https, en desarrollo http
    const protocol = isProduction ? 'https' : 'http';
    return `${protocol}://${this.IP}:${this.PORT}`;
  }
};
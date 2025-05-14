export const SERVER_CONFIG = {
  IP: '[IP]',
  PORT: [PUERTO],
  get BASE_URL() {
    return `http://${this.IP}:${this.PORT}`;
  }
};
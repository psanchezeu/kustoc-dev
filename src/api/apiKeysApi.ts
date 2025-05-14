import { SERVER_CONFIG } from '../config';
import { ApiKey } from '../types';

/**
 * Obtiene todas las claves API del servidor
 */
const getApiKeys = async (): Promise<ApiKey[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys`);
    if (!response.ok) {
      throw new Error('Error al obtener claves API');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getApiKeys:', error);
    return [];
  }
};

/**
 * Obtiene una clave API específica por su ID
 */
const getApiKeyById = async (keyId: string): Promise<ApiKey | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys/${keyId}`);
    if (!response.ok) {
      throw new Error('Error al obtener la clave API');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getApiKeyById para ID ${keyId}:`, error);
    return null;
  }
};

/**
 * Crea una nueva clave API en el servidor
 */
const createApiKey = async (apiKeyData: Omit<ApiKey, 'key_id' | 'key' | 'created_at' | 'last_used'>): Promise<ApiKey | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiKeyData),
    });
    if (!response.ok) {
      throw new Error('Error al crear la clave API');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createApiKey:', error);
    return null;
  }
};

/**
 * Actualiza una clave API existente
 */
const updateApiKey = async (keyId: string, apiKeyData: Partial<Omit<ApiKey, 'key_id' | 'key' | 'created_at' | 'last_used'>>): Promise<ApiKey | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys/${keyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiKeyData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar la clave API');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en updateApiKey para ID ${keyId}:`, error);
    return null;
  }
};

/**
 * Desactiva una clave API por su ID
 */
const deactivateApiKey = async (keyId: string): Promise<ApiKey | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys/${keyId}/deactivate`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Error al desactivar la clave API');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en deactivateApiKey para ID ${keyId}:`, error);
    return null;
  }
};

/**
 * Regenera una clave API existente
 */
const regenerateApiKey = async (keyId: string): Promise<ApiKey | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/api-keys/${keyId}/regenerate`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Error al regenerar la clave API');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en regenerateApiKey para ID ${keyId}:`, error);
    return null;
  }
};

/**
 * Obtiene claves API por cliente
 */
const getApiKeysByClient = async (clientId: string): Promise<ApiKey[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/api-keys`);
    if (!response.ok) {
      throw new Error('Error al obtener claves API por cliente');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getApiKeysByClient para cliente ID ${clientId}:`, error);
    return [];
  }
};

export {
  getApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKey,
  deactivateApiKey,
  regenerateApiKey,
  getApiKeysByClient,
};

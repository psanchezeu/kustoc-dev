import { Copilot } from '../types';
import { SERVER_CONFIG } from '../config';

/**
 * Obtiene todos los copilotos del servidor
 */
const getCopilots = async (): Promise<Copilot[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots`);
    if (!response.ok) {
      throw new Error('Error al obtener copilotos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getCopilots:', error);
    return [];
  }
};

/**
 * Obtiene un copiloto específico por su ID
 */
const getCopilotById = async (copilotId: string): Promise<Copilot | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots/${copilotId}`);
    if (!response.ok) {
      throw new Error('Error al obtener el copiloto');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getCopilotById para ID ${copilotId}:`, error);
    return null;
  }
};

/**
 * Crea un nuevo copiloto en el servidor
 */
const createCopilot = async (copilotData: Omit<Copilot, 'copilot_id' | 'created_at'>): Promise<Copilot | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(copilotData),
    });
    if (!response.ok) {
      throw new Error('Error al crear el copiloto');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createCopilot:', error);
    return null;
  }
};

/**
 * Actualiza un copiloto existente
 */
const updateCopilot = async (copilotId: string, copilotData: Partial<Omit<Copilot, 'copilot_id' | 'created_at'>>): Promise<Copilot | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots/${copilotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(copilotData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el copiloto');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en updateCopilot para ID ${copilotId}:`, error);
    return null;
  }
};

/**
 * Elimina un copiloto por su ID
 */
const deleteCopilot = async (copilotId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots/${copilotId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el copiloto');
    }
    return true;
  } catch (error) {
    console.error(`Error en deleteCopilot para ID ${copilotId}:`, error);
    return false;
  }
};

/**
 * Obtiene copilotos disponibles (con estado "available")
 */
const getAvailableCopilots = async (): Promise<Copilot[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots?status=available`);
    if (!response.ok) {
      throw new Error('Error al obtener copilotos disponibles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getAvailableCopilots:', error);
    return [];
  }
};

export {
  getCopilots,
  getCopilotById,
  createCopilot,
  updateCopilot,
  deleteCopilot,
  getAvailableCopilots,
};

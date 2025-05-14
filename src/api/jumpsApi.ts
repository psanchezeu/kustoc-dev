import { Jump } from '../types';
import { SERVER_CONFIG } from '../config';

/**
 * Obtiene todos los jumps del servidor
 */
const getJumps = async (): Promise<Jump[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps`);
    if (!response.ok) {
      throw new Error('Error al obtener jumps');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getJumps:', error);
    return [];
  }
};

/**
 * Obtiene un jump específico por su ID
 */
const getJumpById = async (jumpId: string): Promise<Jump | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}`);
    if (!response.ok) {
      throw new Error('Error al obtener el jump');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getJumpById para ID ${jumpId}:`, error);
    return null;
  }
};

/**
 * Crea un nuevo jump en el servidor
 */
const createJump = async (jumpData: Omit<Jump, 'jump_id' | 'created_at' | 'updated_at'>): Promise<Jump | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jumpData),
    });
    if (!response.ok) {
      throw new Error('Error al crear el jump');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createJump:', error);
    return null;
  }
};

/**
 * Actualiza un jump existente
 */
const updateJump = async (jumpId: string, jumpData: Partial<Omit<Jump, 'jump_id' | 'created_at' | 'updated_at'>>): Promise<Jump | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jumpData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el jump');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en updateJump para ID ${jumpId}:`, error);
    return null;
  }
};

/**
 * Elimina un jump por su ID
 */
const deleteJump = async (jumpId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el jump');
    }
    return true;
  } catch (error) {
    console.error(`Error en deleteJump para ID ${jumpId}:`, error);
    return false;
  }
};

/**
 * Obtiene jumps por cliente
 */
const getJumpsByClient = async (clientId: string): Promise<Jump[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/jumps`);
    if (!response.ok) {
      throw new Error('Error al obtener jumps por cliente');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getJumpsByClient para cliente ID ${clientId}:`, error);
    return [];
  }
};

export {
  getJumps,
  getJumpById,
  createJump,
  updateJump,
  deleteJump,
  getJumpsByClient,
};

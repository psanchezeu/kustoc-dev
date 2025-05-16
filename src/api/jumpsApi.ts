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
    console.log('Datos enviados al servidor:', jumpData);
    
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jumpData),
    });
    
    // Registrar el status de la respuesta
    console.log('Status de respuesta del servidor:', response.status);
    
    const responseText = await response.text();
    console.log('Respuesta del servidor (texto):', responseText);
    
    if (!response.ok) {
      throw new Error(`Error al crear el jump: ${response.status} ${responseText}`);
    }
    
    // Convertir la respuesta a JSON después de haberla leído como texto
    const responseData = JSON.parse(responseText);
    console.log('Respuesta del servidor (JSON):', responseData);
    
    return responseData;
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

/**
 * Asocia un cliente a un jump
 */
const associateClientToJump = async (jumpId: string, clientId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId }),
    });
    if (!response.ok) {
      throw new Error('Error al asociar cliente al jump');
    }
    return true;
  } catch (error) {
    console.error(`Error en associateClientToJump para jump ${jumpId} y cliente ${clientId}:`, error);
    return false;
  }
};

/**
 * Obtener clientes asociados a un jump
 */
const getJumpClients = async (jumpId: string): Promise<{ client_id: string; name: string; company: string }[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}/clients`);
    if (!response.ok) {
      throw new Error('Error al obtener clientes del jump');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getJumpClients para jump ${jumpId}:`, error);
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
  associateClientToJump,
  getJumpClients,
};

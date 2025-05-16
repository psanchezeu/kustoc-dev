import { SERVER_CONFIG } from '../config';

/**
 * Interfaz para los datos de referencia
 */
export interface ReferenceData {
  sector_id?: string;
  status_id?: string;
  type_id?: string;
  name: string;
  description?: string;
  active: number;
}

/**
 * Obtiene todos los sectores disponibles
 */
export const getSectors = async (): Promise<ReferenceData[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reference/sectors`);
    if (!response.ok) {
      throw new Error('Error al obtener sectores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getSectors:', error);
    return [];
  }
};

/**
 * Obtiene todos los estados de cliente disponibles
 */
export const getClientStatuses = async (): Promise<ReferenceData[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reference/client-statuses`);
    if (!response.ok) {
      throw new Error('Error al obtener estados de cliente');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getClientStatuses:', error);
    return [];
  }
};

/**
 * Obtiene todos los estados de proyecto disponibles
 */
export const getProjectStatuses = async (): Promise<ReferenceData[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reference/project-statuses`);
    if (!response.ok) {
      throw new Error('Error al obtener estados de proyecto');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getProjectStatuses:', error);
    return [];
  }
};

/**
 * Obtiene todos los estados de jump disponibles
 */
export const getJumpStatuses = async (): Promise<ReferenceData[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reference/jump-statuses`);
    if (!response.ok) {
      throw new Error('Error al obtener estados de jump');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getJumpStatuses:', error);
    return [];
  }
};

/**
 * Obtiene todos los tipos de interacción disponibles
 */
export const getInteractionTypes = async (): Promise<ReferenceData[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/reference/interaction-types`);
    if (!response.ok) {
      throw new Error('Error al obtener tipos de interacción');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getInteractionTypes:', error);
    return [];
  }
};

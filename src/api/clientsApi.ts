import { SERVER_CONFIG } from '../config';

/**
 * Interfaz para los datos del cliente
 */
export interface Client {
  client_id: string;
  name: string;
  company: string;
  sector: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_id: string;
  secondary_contact?: string;
  secondary_email?: string;
  contact_notes?: string;
  status: string;
  created_at: string;
  last_interaction?: string;
}

/**
 * Interfaz para las interacciones del cliente
 */
export interface Interaction {
  interaction_id: string;
  client_id: string;
  interaction_date: string;
  interaction_type: string;
  interaction_summary?: string;
  interaction_files?: string;
}

/**
 * Obtener todos los clientes
 */
export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients`);
    if (!response.ok) {
      throw new Error('Error al obtener clientes');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getClients:', error);
    return [];
  }
};

/**
 * Obtener un cliente por su ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener cliente');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getClientById (${id}):`, error);
    return null;
  }
};

/**
 * Crear un nuevo cliente
 */
export const createClient = async (clientData: Omit<Client, 'client_id' | 'created_at' | 'last_interaction'>): Promise<Client | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    
    if (!response.ok) {
      throw new Error('Error al crear cliente');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en createClient:', error);
    return null;
  }
};

/**
 * Actualizar un cliente existente
 */
export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar cliente');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error en updateClient (${id}):`, error);
    return null;
  }
};

/**
 * Obtener todas las interacciones de un cliente
 */
export const getClientInteractions = async (clientId: string): Promise<Interaction[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/interactions`);
    if (!response.ok) {
      throw new Error('Error al obtener interacciones');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getClientInteractions (${clientId}):`, error);
    return [];
  }
};

/**
 * Crear una nueva interacción para un cliente
 */
export const createClientInteraction = async (
  clientId: string, 
  data: { interaction_type: string; interaction_summary: string; file?: File }
): Promise<Interaction | null> => {
  try {
    const formData = new FormData();
    formData.append('interaction_type', data.interaction_type);
    formData.append('interaction_summary', data.interaction_summary);
    
    if (data.file) {
      formData.append('file', data.file);
    }
    
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/interactions`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Error al crear interacción');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error en createClientInteraction (${clientId}):`, error);
    return null;
  }
};

import { Referral } from '../types';
import { SERVER_CONFIG } from '../config';

/**
 * Obtiene todos los enlaces de referidos
 */
const getReferrals = async (): Promise<Referral[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals`);
    if (!response.ok) {
      throw new Error('Error al obtener referidos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getReferrals:', error);
    return [];
  }
};

/**
 * Obtiene un enlace de referido específico por su ID
 */
const getReferralById = async (referralId: string): Promise<Referral | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals/${referralId}`);
    if (!response.ok) {
      throw new Error('Error al obtener el referido');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getReferralById para ID ${referralId}:`, error);
    return null;
  }
};

/**
 * Crea un nuevo enlace de referido
 */
const createReferral = async (referralData: Omit<Referral, 'referral_id' | 'code' | 'created_at' | 'converted_at'>): Promise<Referral | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referralData),
    });
    if (!response.ok) {
      throw new Error('Error al crear el referido');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createReferral:', error);
    return null;
  }
};

/**
 * Actualiza un enlace de referido existente
 */
const updateReferral = async (referralId: string, referralData: Partial<Omit<Referral, 'referral_id' | 'code' | 'created_at'>>): Promise<Referral | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals/${referralId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referralData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el referido');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en updateReferral para ID ${referralId}:`, error);
    return null;
  }
};

/**
 * Marca un referido como convertido
 */
const markReferralAsConverted = async (referralId: string, clientId: string): Promise<Referral | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals/${referralId}/convert`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        status: 'converted',
        converted_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error('Error al marcar el referido como convertido');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en markReferralAsConverted para ID ${referralId}:`, error);
    return null;
  }
};

/**
 * Elimina un enlace de referido
 */
const deleteReferral = async (referralId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/referrals/${referralId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el referido');
    }
    return true;
  } catch (error) {
    console.error(`Error en deleteReferral para ID ${referralId}:`, error);
    return false;
  }
};

export {
  getReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  markReferralAsConverted,
  deleteReferral,
};

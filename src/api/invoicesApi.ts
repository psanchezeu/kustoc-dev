import { Invoice } from '../types';
import { SERVER_CONFIG } from '../config';

/**
 * Obtiene todas las facturas del servidor
 */
const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices`);
    if (!response.ok) {
      throw new Error('Error al obtener facturas');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getInvoices:', error);
    return [];
  }
};

/**
 * Obtiene una factura específica por su ID
 */
const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices/${invoiceId}`);
    if (!response.ok) {
      throw new Error('Error al obtener la factura');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getInvoiceById para ID ${invoiceId}:`, error);
    return null;
  }
};

/**
 * Crea una nueva factura en el servidor
 */
const createInvoice = async (invoiceData: Omit<Invoice, 'invoice_id' | 'created_at'>): Promise<Invoice | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
      throw new Error('Error al crear la factura');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createInvoice:', error);
    return null;
  }
};

/**
 * Actualiza una factura existente
 */
const updateInvoice = async (invoiceId: string, invoiceData: Partial<Omit<Invoice, 'invoice_id' | 'created_at'>>): Promise<Invoice | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar la factura');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en updateInvoice para ID ${invoiceId}:`, error);
    return null;
  }
};

/**
 * Elimina una factura por su ID
 */
const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar la factura');
    }
    return true;
  } catch (error) {
    console.error(`Error en deleteInvoice para ID ${invoiceId}:`, error);
    return false;
  }
};

/**
 * Obtiene facturas por cliente
 */
const getInvoicesByClient = async (clientId: string): Promise<Invoice[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/invoices`);
    if (!response.ok) {
      throw new Error('Error al obtener facturas por cliente');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getInvoicesByClient para cliente ID ${clientId}:`, error);
    return [];
  }
};

/**
 * Marca una factura como pagada
 */
const markInvoiceAsPaid = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/invoices/${invoiceId}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'paid',
        paid_date: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error('Error al marcar la factura como pagada');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en markInvoiceAsPaid para ID ${invoiceId}:`, error);
    return null;
  }
};

export {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClient,
  markInvoiceAsPaid,
};

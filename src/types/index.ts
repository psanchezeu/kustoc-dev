/**
 * Tipos básicos para la aplicación Kustoc
 */

// Cliente
export interface Client {
  client_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  last_interaction?: string;
}

// Interacción de cliente
export interface ClientInteraction {
  interaction_id: string;
  client_id: string;
  type: 'call' | 'email' | 'meeting' | 'other';
  description: string;
  date: string;
  created_at: string;
}

// Jump (prototipo de aplicación)
export interface Jump {
  jump_id: string;
  client_id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  url?: string;
  github_repo?: string;
  created_at: string;
  updated_at: string;
}

// Factura
export interface Invoice {
  invoice_id: string;
  client_id: string;
  jump_id?: string;
  number: string;
  amount: number;
  tax_percent: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

// Clave API
export interface ApiKey {
  key_id: string;
  client_id?: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_used?: string;
}

// Enlace de referido
export interface Referral {
  referral_id: string;
  code: string;
  email?: string;
  name?: string;
  status: 'pending' | 'registered' | 'converted';
  created_at: string;
  converted_at?: string;
  client_id?: string;
}

// Proyecto
export interface Project {
  project_id: string;
  client_id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  created_at: string;
  updated_at: string;
}

// Copiloto
export interface Copilot {
  copilot_id: string;
  name: string;
  email: string;
  bio?: string;
  specialty: string[];
  status: 'available' | 'busy' | 'inactive';
  hourly_rate: number;
  created_at: string;
}

// Usuario del sistema
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'client';
  created_at: string;
}

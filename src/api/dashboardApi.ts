import { SERVER_CONFIG } from '../config';
import { getClients, Client } from './clientsApi';
import { getProjects } from './projectsApi';
import { Project, Jump, Copilot } from '../types';

// Implementación básica de estas funciones si no están exportadas en projectsApi
const getAvailableJumps = async (): Promise<Jump[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps`);
    if (!response.ok) {
      throw new Error('Error al obtener jumps disponibles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getAvailableJumps:', error);
    return [];
  }
};

const getAvailableCopilots = async (): Promise<Copilot[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/copilots?availability=available`);
    if (!response.ok) {
      throw new Error('Error al obtener copilotos disponibles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getAvailableCopilots:', error);
    return [];
  }
};

export interface DashboardStats {
  clientCount: number;
  projectCount: number;
  jumpCount: number;
  copilotCount: number;
  pendingInvoicesAmount: number;
  recentClients: {
    id: string;
    name: string;
    company: string;
    status: string;
  }[];
  recentProjects: {
    id: string;
    name: string;
    client: string;
    status: string;
  }[];
}

/**
 * Obtiene las estadísticas para el dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Obtenemos los datos de cada entidad en paralelo
    const [clients, projects, jumps, copilots] = await Promise.all([
      getClients(),
      getProjects(),
      getAvailableJumps(),
      getAvailableCopilots(),
    ]);
    
    // Filtrar para obtener los 5 clientes más recientes
    // Asumimos que tienen un campo created_at o similar
    const sortedClients = [...clients].sort((a: Client, b: Client) => {
      // Si no existe created_at, usamos una fecha por defecto
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    
    const recentClients = sortedClients.slice(0, 3).map((client: Client) => ({
      id: client.client_id,
      name: client.name,
      company: client.company || '',
      status: client.status || 'Cliente Activo',
    }));
    
    // Obtener los proyectos más recientes
    // Asumimos que los proyectos tienen una fecha de creación o inicio
    const sortedProjects = [...projects].sort((a: Project, b: Project) => {
      // Si no existe start_date, usamos una fecha por defecto
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateB - dateA;
    });
    
    // Para cada proyecto, necesitamos obtener el nombre del cliente
    const recentProjects = sortedProjects.slice(0, 3).map((project: Project) => {
      // Buscar el cliente asociado a este proyecto
      const clientInfo = clients.find((client: Client) => client.client_id === project.client_id);
      
      return {
        id: project.project_id,
        name: project.name,
        client: clientInfo ? clientInfo.company || clientInfo.name : 'Cliente Desconocido',
        status: mapProjectStatus(project.status || ''),
      };
    });
    
    // Por ahora, para el MVP, dejamos el valor hardcodeado para facturas pendientes
    const pendingInvoicesAmount = 0;
    
    // Retornamos las estadísticas
    return {
      clientCount: clients.length,
      projectCount: projects.length,
      jumpCount: jumps.length,
      copilotCount: copilots.length,
      pendingInvoicesAmount,
      recentClients,
      recentProjects,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    
    // Si hay un error, devolvemos valores predeterminados
    return {
      clientCount: 0,
      projectCount: 0,
      jumpCount: 0,
      copilotCount: 0,
      pendingInvoicesAmount: 0,
      recentClients: [],
      recentProjects: [],
    };
  }
};

// Función de utilidad para mapear los estados de los proyectos a textos más amigables
const mapProjectStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planning': 'Planificación',
    'in_progress': 'En Progreso',
    'on_hold': 'Pausado',
    'completed': 'Completado',
  };
  
  return statusMap[status] || status;
};

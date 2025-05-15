import { SERVER_CONFIG } from '../config';
import { getClients } from './clientsApi';
import { getProjects } from './projectsApi';
import { getAvailableJumps } from './projectsApi';
import { getAvailableCopilots } from './projectsApi';
import { Client } from './clientsApi';
import { Project } from '../types';

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
    const sortedClients = [...clients].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const recentClients = sortedClients.slice(0, 3).map(client => ({
      id: client.client_id,
      name: client.name,
      company: client.company || '',
      status: client.status || 'Cliente Activo',
    }));
    
    // Obtener los proyectos más recientes
    // Asumimos que los proyectos tienen una fecha de creación o inicio
    const sortedProjects = [...projects].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    // Para cada proyecto, necesitamos obtener el nombre del cliente
    const recentProjects = sortedProjects.slice(0, 3).map(project => {
      // Buscar el cliente asociado a este proyecto
      const clientInfo = clients.find(client => client.client_id === project.client_id);
      
      return {
        id: project.project_id,
        name: project.name,
        client: clientInfo ? clientInfo.company || clientInfo.name : 'Cliente Desconocido',
        status: mapProjectStatus(project.status),
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

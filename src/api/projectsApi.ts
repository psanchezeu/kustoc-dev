import { Project, Jump, Copilot } from '../types';
import { SERVER_CONFIG } from '../config';

/**
 * Obtiene todos los proyectos del servidor
 */
const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects`);
    if (!response.ok) {
      throw new Error('Error al obtener proyectos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en getProjects:', error);
    return [];
  }
};

/**
 * Obtiene un proyecto específico por su ID
 */
const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}`);
    if (!response.ok) {
      throw new Error('Error al obtener el proyecto');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getProjectById para ID ${projectId}:`, error);
    return null;
  }
};

/**
 * Crea un nuevo proyecto en el servidor
 */
const createProject = async (projectData: Omit<Project, 'project_id'>): Promise<Project | null> => {
  try {
    // Verificar que todos los campos obligatorios están presentes
    if (!projectData.name || !projectData.client_id || !projectData.jump_id || !projectData.status || 
    projectData.contracted_hours === undefined || !projectData.start_date) {
      console.error('Faltan campos obligatorios para crear un proyecto:', projectData);
      throw new Error('Faltan campos obligatorios para crear el proyecto');
    }
    
    console.log('Enviando datos para crear proyecto:', projectData);
    
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de servidor al crear proyecto:', errorData);
      throw new Error(errorData.error || 'Error al crear el proyecto');
    }
    
    const createdProject = await response.json();
    console.log('Proyecto creado exitosamente:', createdProject);
    return createdProject;
  } catch (error) {
    console.error('Error en createProject:', error);
    return null;
  }
};

/**
 * Actualiza un proyecto existente
 */
const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<Project | null> => {
  try {
    // Verificar que hay datos a actualizar
    if (Object.keys(projectData).length === 0) {
      console.error('No hay datos para actualizar el proyecto');
      throw new Error('No hay datos para actualizar el proyecto');
    }
    
    console.log(`Actualizando proyecto ${projectId} con datos:`, projectData);
    
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error de servidor al actualizar proyecto ${projectId}:`, errorData);
      throw new Error(errorData.error || 'Error al actualizar el proyecto');
    }
    
    const updatedProject = await response.json();
    console.log(`Proyecto ${projectId} actualizado exitosamente:`, updatedProject);
    return updatedProject;
  } catch (error) {
    console.error(`Error en updateProject para ID ${projectId}:`, error);
    return null;
  }
};

/**
 * Elimina un proyecto por su ID
 */
const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el proyecto');
    }
    return true;
  } catch (error) {
    console.error(`Error en deleteProject para ID ${projectId}:`, error);
    return false;
  }
};

/**
 * Obtiene proyectos por cliente
 */
const getProjectsByClient = async (clientId: string): Promise<Project[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}/projects`);
    if (!response.ok) {
      throw new Error('Error al obtener proyectos por cliente');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en getProjectsByClient para cliente ID ${clientId}:`, error);
    return [];
  }
};

/**
 * Obtiene los jumps disponibles para relacionar con un proyecto
 */
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

/**
 * Obtiene los copilotos disponibles para asignar a un proyecto
 */
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

/**
 * Asigna un jump a un proyecto existente
 */
const assignJumpToProject = async (projectId: string, jumpId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}/jump`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jump_id: jumpId }),
    });
    if (!response.ok) {
      throw new Error('Error al asignar jump al proyecto');
    }
    return true;
  } catch (error) {
    console.error(`Error en assignJumpToProject para proyecto ${projectId}:`, error);
    return false;
  }
};

/**
 * Asignar un copiloto a un proyecto (forma tradicional, un solo copiloto)
 */
const assignCopilotToProject = async (projectId: string, copilotId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}/copilot`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ copilot_id: copilotId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al asignar copiloto: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error al asignar copiloto al proyecto:', error);
    throw error;
  }
};

/**
 * Asignar múltiples copilotos a un proyecto
 */
const assignMultipleCopilotsToProject = async (projectId: string, copilotIds: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}/copilots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ copilot_ids: copilotIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al asignar copilotos: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error al asignar múltiples copilotos al proyecto:', error);
    throw error;
  }
};

/**
 * Obtener todos los copilotos asignados a un proyecto
 */
const getProjectCopilots = async (projectId: string): Promise<Copilot[]> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}/copilots`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al obtener copilotos: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener copilotos del proyecto:', error);
    throw error;
  }
};

// Exportamos todas las funciones
export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByClient,
  getAvailableJumps,
  getAvailableCopilots,
  assignJumpToProject,
  assignCopilotToProject,
  assignMultipleCopilotsToProject,
  getProjectCopilots,
};

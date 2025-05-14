import { Project } from '../types';
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
const createProject = async (projectData: Omit<Project, 'project_id' | 'created_at' | 'updated_at'>): Promise<Project | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      throw new Error('Error al crear el proyecto');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en createProject:', error);
    return null;
  }
};

/**
 * Actualiza un proyecto existente
 */
const updateProject = async (projectId: string, projectData: Partial<Omit<Project, 'project_id' | 'created_at' | 'updated_at'>>): Promise<Project | null> => {
  try {
    const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el proyecto');
    }
    return await response.json();
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

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByClient,
};

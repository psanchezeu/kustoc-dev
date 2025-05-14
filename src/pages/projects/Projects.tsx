import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Project } from '../../types';
import { formatDate } from '../../lib/utils';

/**
 * Página de listado de proyectos
 */
const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockProjects: Project[] = [
      {
        project_id: 'PRJ001',
        client_id: 'CLI001',
        name: 'Rediseño de Imagen Corporativa',
        description: 'Actualización completa de la identidad visual de la empresa',
        status: 'in_progress',
        created_at: '2023-05-10T09:00:00Z',
        updated_at: '2023-10-15T14:30:00Z',
      },
      {
        project_id: 'PRJ002',
        client_id: 'CLI002',
        name: 'Sistema de Reservas Online',
        description: 'Implementación de plataforma para gestionar citas y reservas',
        status: 'planning',
        created_at: '2023-09-22T11:15:00Z',
        updated_at: '2023-09-22T11:15:00Z',
      },
      {
        project_id: 'PRJ003',
        client_id: 'CLI003',
        name: 'Aplicación Móvil',
        description: 'Desarrollo de app para gestión de clientes y facturas',
        status: 'completed',
        created_at: '2023-03-15T08:45:00Z',
        updated_at: '2023-08-30T16:20:00Z',
      },
      {
        project_id: 'PRJ004',
        client_id: 'CLI001',
        name: 'Tienda Online',
        description: 'Implementación de e-commerce con pasarela de pagos',
        status: 'on_hold',
        created_at: '2023-06-18T13:30:00Z',
        updated_at: '2023-07-25T10:45:00Z',
      },
      {
        project_id: 'PRJ005',
        client_id: 'CLI004',
        name: 'Migración a la Nube',
        description: 'Traslado de infraestructura a servicios cloud',
        status: 'in_progress',
        created_at: '2023-10-05T09:30:00Z',
        updated_at: '2023-10-28T17:15:00Z',
      },
    ];
    
    setProjects(mockProjects);
    setFilteredProjects(mockProjects);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = projects;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (project) => 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((project) => project.status === statusFilter);
    }
    
    setFilteredProjects(result);
  }, [projects, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planificación';
      case 'in_progress':
        return 'En Progreso';
      case 'on_hold':
        return 'En Pausa';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Link to="/projects/new">
          <Button>Nuevo Proyecto</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="planning">Planificación</option>
                <option value="in_progress">En Progreso</option>
                <option value="on_hold">En Pausa</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando proyectos...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron proyectos que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Link to={`/clients/${project.client_id}`} className="text-primary hover:underline">
                        Cliente {project.client_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(project.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link 
                        to={`/projects/${project.project_id}`} 
                        className="font-medium text-primary hover:underline"
                      >
                        Ver detalles
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;

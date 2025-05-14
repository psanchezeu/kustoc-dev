import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Jump } from '../../types';

/**
 * Página de listado de Jumps (prototipos de aplicaciones)
 */
const Jumps = () => {
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [filteredJumps, setFilteredJumps] = useState<Jump[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockJumps: Jump[] = [
      {
        jump_id: 'JMP001',
        client_id: 'CLI001',
        name: 'E-Commerce Básico',
        description: 'Tienda online con catálogo de productos y carrito de compra',
        status: 'completed',
        url: 'https://jump-ecommerce.kustoc.com',
        github_repo: 'https://github.com/kustoc/jump-ecommerce',
        created_at: '2023-01-15T10:00:00Z',
        updated_at: '2023-02-10T15:30:00Z',
      },
      {
        jump_id: 'JMP002',
        client_id: 'CLI002',
        name: 'CRM Dental',
        description: 'Sistema de gestión para clínicas dentales con agenda y expedientes',
        status: 'in_progress',
        github_repo: 'https://github.com/kustoc/jump-dental-crm',
        created_at: '2023-03-05T09:15:00Z',
        updated_at: '2023-04-20T14:45:00Z',
      },
      {
        jump_id: 'JMP003',
        client_id: 'CLI003',
        name: 'Gestor de Inventario',
        description: 'Aplicación para gestión de inventario y stock',
        status: 'planning',
        created_at: '2023-05-18T11:30:00Z',
        updated_at: '2023-05-18T11:30:00Z',
      },
      {
        jump_id: 'JMP004',
        client_id: 'CLI001',
        name: 'Blog Corporativo',
        description: 'Blog para publicación de noticias y artículos',
        status: 'review',
        url: 'https://jump-blog.kustoc.com',
        github_repo: 'https://github.com/kustoc/jump-corporate-blog',
        created_at: '2023-06-10T16:20:00Z',
        updated_at: '2023-07-05T09:00:00Z',
      },
      {
        jump_id: 'JMP005',
        client_id: 'CLI004',
        name: 'Panel Administrativo',
        description: 'Dashboard para gestión de usuarios y contenidos',
        status: 'archived',
        url: 'https://jump-admin.kustoc.com',
        github_repo: 'https://github.com/kustoc/jump-admin-panel',
        created_at: '2022-11-30T13:45:00Z',
        updated_at: '2023-01-02T10:15:00Z',
      },
    ];
    
    setJumps(mockJumps);
    setFilteredJumps(mockJumps);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = jumps;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (jump) => 
          jump.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jump.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((jump) => jump.status === statusFilter);
    }
    
    setFilteredJumps(result);
  }, [jumps, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
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
      case 'review':
        return 'En Revisión';
      case 'completed':
        return 'Completado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jumps</h1>
        <Link to="/jumps/new">
          <Button>Nuevo Jump</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Jumps</CardTitle>
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
                <option value="review">En Revisión</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando jumps...</div>
          ) : filteredJumps.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron jumps que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJumps.map((jump) => (
                  <TableRow key={jump.jump_id}>
                    <TableCell className="font-medium">{jump.name}</TableCell>
                    <TableCell>{jump.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(jump.status)}`}>
                        {getStatusLabel(jump.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {jump.url ? (
                        <a 
                          href={jump.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver demo
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No disponible</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/jumps/${jump.jump_id}`} 
                        className="text-primary hover:underline"
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

export default Jumps;

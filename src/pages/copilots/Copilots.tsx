import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Copilot } from '../../types';
import { formatCurrency } from '../../lib/utils';

/**
 * Página de listado de Copilotos de IA
 */
const Copilots = () => {
  const [copilots, setCopilots] = useState<Copilot[]>([]);
  const [filteredCopilots, setFilteredCopilots] = useState<Copilot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockCopilots: Copilot[] = [
      {
        copilot_id: 'COP001',
        name: 'Ana López',
        email: 'ana.lopez@kustoc.com',
        bio: 'Especialista en desarrollo frontend con React y diseño UX/UI',
        specialty: ['frontend', 'ux/ui', 'react'],
        status: 'available',
        hourly_rate: 60,
        created_at: '2023-01-15T10:30:00Z',
      },
      {
        copilot_id: 'COP002',
        name: 'Carlos Martínez',
        email: 'carlos.martinez@kustoc.com',
        bio: 'Experto en desarrollo backend y arquitectura de sistemas',
        specialty: ['backend', 'nodejs', 'databases'],
        status: 'busy',
        hourly_rate: 75,
        created_at: '2023-02-20T14:15:00Z',
      },
      {
        copilot_id: 'COP003',
        name: 'Laura Sánchez',
        email: 'laura.sanchez@kustoc.com',
        bio: 'Especialista en automatización de pruebas y DevOps',
        specialty: ['testing', 'devops', 'ci/cd'],
        status: 'available',
        hourly_rate: 65,
        created_at: '2023-03-10T09:45:00Z',
      },
      {
        copilot_id: 'COP004',
        name: 'Miguel Fernández',
        email: 'miguel.fernandez@kustoc.com',
        bio: 'Desarrollador full-stack con experiencia en proyectos de e-commerce',
        specialty: ['fullstack', 'ecommerce', 'react'],
        status: 'inactive',
        hourly_rate: 70,
        created_at: '2023-04-05T16:00:00Z',
      },
      {
        copilot_id: 'COP005',
        name: 'Elena Gómez',
        email: 'elena.gomez@kustoc.com',
        bio: 'Especialista en desarrollo móvil para iOS y Android',
        specialty: ['mobile', 'ios', 'android'],
        status: 'available',
        hourly_rate: 80,
        created_at: '2023-05-12T11:30:00Z',
      },
    ];
    
    setCopilots(mockCopilots);
    setFilteredCopilots(mockCopilots);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = copilots;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        (copilot) => 
          copilot.name.toLowerCase().includes(searchTermLower) ||
          copilot.email.toLowerCase().includes(searchTermLower) ||
          copilot.specialty.some(spec => spec.toLowerCase().includes(searchTermLower))
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((copilot) => copilot.status === statusFilter);
    }
    
    setFilteredCopilots(result);
  }, [copilots, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Copilotos de IA</h1>
        <Link to="/copilots/new">
          <Button>Nuevo Copiloto</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Copilotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email o especialidad..."
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
                <option value="available">Disponible</option>
                <option value="busy">Ocupado</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando copilotos...</div>
          ) : filteredCopilots.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron copilotos que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Tarifa Horaria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCopilots.map((copilot) => (
                  <TableRow key={copilot.copilot_id}>
                    <TableCell className="font-medium">{copilot.name}</TableCell>
                    <TableCell>{copilot.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {copilot.specialty.map((spec, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(copilot.hourly_rate, 'EUR')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(copilot.status)}`}>
                        {getStatusLabel(copilot.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        to={`/copilots/${copilot.copilot_id}`} 
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

export default Copilots;

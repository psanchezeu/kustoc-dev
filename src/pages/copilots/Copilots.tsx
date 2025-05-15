import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  const [filteredCopilots, setFilteredCopilots] = useState<Copilot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Consulta para cargar los copilotos desde la API
  const { data: copilots, isLoading } = useQuery({
    queryKey: ['copilots'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3001/api/copilots');
        if (!response.ok) {
          throw new Error(`Error al cargar los copilotos: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Datos de copilotos cargados:', data);
        return data as Copilot[];
      } catch (err) {
        console.error('Error al cargar los copilotos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los copilotos');
        return [] as Copilot[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!copilots) {
      setFilteredCopilots([]);
      return;
    }
    
    // Aplicar filtros
    let result = [...copilots];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        (copilot: Copilot) => 
          copilot.name.toLowerCase().includes(searchTermLower) ||
          copilot.email.toLowerCase().includes(searchTermLower) ||
          (Array.isArray(copilot.specialty) && copilot.specialty.some((spec: string) => 
            spec.toLowerCase().includes(searchTermLower)
          ))
      );
    }
    
    // Filtrar por estado
    if (availabilityFilter !== 'all') {
      result = result.filter((copilot: Copilot) => copilot.availability === availabilityFilter);
    }
    
    setFilteredCopilots(result);
  }, [copilots, searchTerm, availabilityFilter]);

  const getAvailabilityBadgeClass = (availability: string) => {
    switch (availability) {
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

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'inactive':
        return 'Inactivo';
      default:
        return availability;
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
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
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
                        {(() => {
                          let specialtyArray: string[] = [];
                          try {
                            // Intentar parsear si es una cadena JSON
                            if (typeof copilot.specialty === 'string') {
                              specialtyArray = JSON.parse(copilot.specialty);
                            } 
                            // Si ya es un array, usarlo directamente
                            else if (Array.isArray(copilot.specialty)) {
                              specialtyArray = copilot.specialty;
                            }
                          } catch (e) {
                            console.error('Error al parsear specialty:', e);
                            specialtyArray = [];
                          }
                          
                          return specialtyArray.map((spec, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {spec}
                            </span>
                          ))
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(copilot.hourly_rate, 'EUR')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityBadgeClass(copilot.availability)}`}>
                        {getAvailabilityLabel(copilot.availability)}
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

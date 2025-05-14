import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClients, Client } from '../../api/clientsApi';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatDate } from '../../lib/utils';

/**
 * Componente para mostrar listado de clientes
 */
const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  const sectors = [
    { value: '', label: 'Todos los sectores' },
    { value: 'Talleres Mecánicos', label: 'Talleres Mecánicos' },
    { value: 'Clínicas', label: 'Clínicas' },
    { value: 'Asesorías', label: 'Asesorías' },
    { value: 'Restaurantes', label: 'Restaurantes' },
    { value: 'Otros', label: 'Otros' }
  ];

  const statuses = [
    { value: '', label: 'Todos los estados' },
    { value: 'Prospecto', label: 'Prospecto' },
    { value: 'Cliente Activo', label: 'Cliente Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
    { value: 'En Negociación', label: 'En Negociación' }
  ];

  // Filtrar clientes según los criterios
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = sectorFilter ? client.sector === sectorFilter : true;
    const matchesStatus = statusFilter ? client.status === statusFilter : true;
    
    return matchesSearch && matchesSector && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link to="/clients/new">
          <Button>Nuevo Cliente</Button>
        </Link>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                placeholder="Nombre, empresa o email..."
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-muted-foreground mb-1">
                Sector
              </label>
              <select
                id="sector"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
              >
                {sectors.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">
                Estado
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSectorFilter('');
                  setStatusFilter('');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Clientes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Listado de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error al cargar los clientes. Por favor, intenta nuevamente.
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clientes que coincidan con los filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">ID</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Nombre</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Empresa</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Sector</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Email</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Estado</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Últ. Interacción</th>
                    <th className="text-right text-sm font-medium text-muted-foreground p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client: Client) => (
                    <tr key={client.client_id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{client.client_id}</td>
                      <td className="p-2 text-sm">{client.name}</td>
                      <td className="p-2 text-sm">{client.company}</td>
                      <td className="p-2 text-sm">{client.sector}</td>
                      <td className="p-2 text-sm">{client.email}</td>
                      <td className="p-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.status === 'Cliente Activo' 
                            ? 'bg-green-100 text-green-800' 
                            : client.status === 'Prospecto'
                            ? 'bg-yellow-100 text-yellow-800'
                            : client.status === 'Inactivo'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {client.last_interaction ? formatDate(client.last_interaction) : 'N/A'}
                      </td>
                      <td className="p-2 text-sm text-right">
                        <Link to={`/clients/${client.client_id}`} className="text-primary hover:underline">
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;

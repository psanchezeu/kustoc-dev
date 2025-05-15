import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardStats, getDashboardStats } from '../api/dashboardApi';
import { formatCurrency } from '../lib/utils';

/**
 * Dashboard principal que muestra resumen de información y accesos rápidos
 */
const Dashboard = () => {
  // Definir interfaces para los tipos
  interface Client {
    id: string;
    name: string;
    company: string;
    status: string;
  }

  interface Project {
    id: string;
    name: string;
    client: string;
    status: string;
  }

  interface DashboardStats {
    clientCount: number;
    projectCount: number;
    jumpCount: number;
    invoiceCount: number;
    pendingInvoicesAmount: number;
    recentClients: Client[];
    recentProjects: Project[];
  }

  const [stats, setStats] = useState<DashboardStats>({
    clientCount: 0,
    projectCount: 0,
    jumpCount: 0,
    invoiceCount: 0,
    pendingInvoicesAmount: 0,
    recentClients: [],
    recentProjects: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Obtener datos reales desde la API
        const dashboardData = await getDashboardStats();
        
        // Actualizar el estado con los datos obtenidos
        setStats({
          ...dashboardData,
          invoiceCount: 0, // Por ahora no tenemos esta información
        });
        
        console.log('Datos del dashboard cargados:', dashboardData);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Link to="/clients/new">
            <Button size="sm">Nuevo Cliente</Button>
          </Link>
          <Link to="/projects/new">
            <Button size="sm" variant="outline">Nuevo Proyecto</Button>
          </Link>
        </div>
      </div>
      
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estadísticas de clientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.clientCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gestiona tus relaciones
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Estadísticas de proyectos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.projectCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  En curso actualmente
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Estadísticas de jumps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jumps Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.jumpCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Soluciones listas para usar
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Estadísticas de facturas pendientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingInvoicesAmount, 'EUR')}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  De {stats.invoiceCount} facturas totales
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Sección de clientes recientes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Clientes Recientes</CardTitle>
            <Link to="/clients" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
            </div>
          ) : stats.recentClients.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No hay clientes registrados aún</p>
              <Link to="/clients/new" className="text-primary hover:underline inline-block mt-2">
                Crear nuevo cliente
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">ID</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Nombre</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Empresa</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Estado</th>
                    <th className="text-right text-sm font-medium text-muted-foreground p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClients.map((client: any) => (
                    <tr key={client.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{client.id}</td>
                      <td className="p-2 text-sm">{client.name}</td>
                      <td className="p-2 text-sm">{client.company}</td>
                      <td className="p-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.status === 'Cliente Activo' 
                            ? 'bg-green-100 text-green-800' 
                            : client.status === 'Prospecto'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-right">
                        <Link to={`/clients/${client.id}`} className="text-primary hover:underline">
                          Ver detalles
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
      
      {/* Sección de proyectos recientes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Proyectos Recientes</CardTitle>
            <Link to="/projects" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-full max-w-md"></div>
            </div>
          ) : stats.recentProjects.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No hay proyectos creados aún</p>
              <Link to="/projects/new" className="text-primary hover:underline inline-block mt-2">
                Crear nuevo proyecto
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">ID</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Nombre</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Cliente</th>
                    <th className="text-left text-sm font-medium text-muted-foreground p-2">Estado</th>
                    <th className="text-right text-sm font-medium text-muted-foreground p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentProjects.map((project: any) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{project.id}</td>
                      <td className="p-2 text-sm">{project.name}</td>
                      <td className="p-2 text-sm">{project.client}</td>
                      <td className="p-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'En Progreso' 
                            ? 'bg-blue-100 text-blue-800' 
                            : project.status === 'No Iniciado'
                            ? 'bg-gray-100 text-gray-800'
                            : project.status === 'Completado'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-right">
                        <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                          Ver detalles
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

export default Dashboard;

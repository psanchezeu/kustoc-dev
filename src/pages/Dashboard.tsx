import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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

  useEffect(() => {
    // En una implementación real, obtendríamos estos datos del servidor
    // Para el MVP, usamos datos de ejemplo
    const mockData = {
      clientCount: 8,
      projectCount: 12,
      jumpCount: 5,
      invoiceCount: 15,
      pendingInvoicesAmount: 3250,
      recentClients: [
        { id: 'CLI001', name: 'Juan Pérez', company: 'Taller Pérez S.L.', status: 'Cliente Activo' },
        { id: 'CLI002', name: 'Ana Martínez', company: 'Clínica DentalCare', status: 'Cliente Activo' },
        { id: 'CLI003', name: 'Carlos Rodríguez', company: 'Asesoría Fiscal CR', status: 'Prospecto' }
      ],
      recentProjects: [
        { id: 'PRJ001', name: 'Implementación Jump Taller Pérez', client: 'Taller Pérez S.L.', status: 'En Progreso' },
        { id: 'PRJ002', name: 'Integración API WhatsApp Dental', client: 'Clínica DentalCare', status: 'No Iniciado' }
      ]
    };
    
    setStats(mockData);
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+2</span> este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+3</span> este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jumps Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jumpCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalización disponible
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingInvoicesAmount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {stats.invoiceCount} facturas totales
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

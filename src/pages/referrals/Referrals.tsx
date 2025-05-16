import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Referral } from '../../types';
import { formatDate } from '../../lib/utils';

/**
 * Página de listado de Enlaces de Referidos
 */
const Referrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockReferrals: Referral[] = [
      {
        referral_id: 'REF001',
        code: 'AMIGO10',
        email: 'carlos@ejemplo.com',
        name: 'Carlos López',
        status: 'pending',
        created_at: '2023-06-10T09:30:00Z',
      },
      {
        referral_id: 'REF002',
        code: 'ELENA20',
        email: 'elena@ejemplo.com',
        name: 'Elena Martínez',
        status: 'registered',
        created_at: '2023-07-15T14:45:00Z',
      },
      {
        referral_id: 'REF003',
        code: 'PEDRO15',
        email: 'pedro@ejemplo.com',
        name: 'Pedro Sánchez',
        status: 'converted',
        created_at: '2023-08-22T11:20:00Z',
        converted_at: '2023-09-05T16:30:00Z',
        client_id: 'CLI005',
      },
      {
        referral_id: 'REF004',
        code: 'MARIA25',
        email: 'maria@ejemplo.com',
        name: 'María García',
        status: 'pending',
        created_at: '2023-09-18T10:15:00Z',
      },
      {
        referral_id: 'REF005',
        code: 'JUAN30',
        email: 'juan@ejemplo.com',
        name: 'Juan Rodríguez',
        status: 'converted',
        created_at: '2023-10-05T13:40:00Z',
        converted_at: '2023-10-25T09:10:00Z',
        client_id: 'CLI006',
      },
    ];
    
    setReferrals(mockReferrals);
    setFilteredReferrals(mockReferrals);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = referrals;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        (referral) => 
          (referral.name && referral.name.toLowerCase().includes(searchTermLower)) ||
          (referral.email && referral.email.toLowerCase().includes(searchTermLower)) ||
          referral.code.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((referral) => referral.status === statusFilter);
    }
    
    setFilteredReferrals(result);
  }, [referrals, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'registered':
        return 'Registrado';
      case 'converted':
        return 'Convertido';
      default:
        return status;
    }
  };

  const copyReferralLink = (code: string) => {
    const url = `https://kustoc.com/referral/${code}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Enlace de referido copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enlaces de Referidos</h1>
        <Link to="/referrals/new">
          <Button>Nuevo Enlace</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Enlaces de Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email o código..."
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
                <option value="pending">Pendiente</option>
                <option value="registered">Registrado</option>
                <option value="converted">Convertido</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando enlaces de referidos...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron enlaces de referidos que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Convertido a Cliente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.map((referral) => (
                  <TableRow key={referral.referral_id}>
                    <TableCell className="font-medium">{referral.code}</TableCell>
                    <TableCell>{referral.name || '-'}</TableCell>
                    <TableCell>{referral.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(referral.status)}`}>
                        {getStatusLabel(referral.status)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(referral.created_at)}</TableCell>
                    <TableCell>
                      {referral.client_id ? (
                        <Link to={`/clients/${referral.client_id}`} className="text-primary hover:underline">
                          Ver Cliente
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyReferralLink(referral.code)}
                        >
                          Copiar Enlace
                        </Button>
                        <Link to={`/referrals/${referral.referral_id}`}>
                          <Button variant="ghost" size="sm">
                            Detalles
                          </Button>
                        </Link>
                      </div>
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

export default Referrals;

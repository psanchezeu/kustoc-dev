import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Invoice } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';

/**
 * Página de listado de Facturas
 */
const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockInvoices: Invoice[] = [
      {
        invoice_id: 'INV001',
        client_id: 'CLI001',
        jump_id: 'JMP001',
        number: 'F-2023-001',
        amount: 1200,
        tax_percent: 21,
        status: 'paid',
        issue_date: '2023-01-15T10:00:00Z',
        due_date: '2023-02-15T10:00:00Z',
        paid_date: '2023-02-10T14:30:00Z',
        notes: 'Pago por implementación inicial',
        created_at: '2023-01-15T10:00:00Z',
      },
      {
        invoice_id: 'INV002',
        client_id: 'CLI002',
        number: 'F-2023-002',
        amount: 850,
        tax_percent: 21,
        status: 'sent',
        issue_date: '2023-02-20T15:30:00Z',
        due_date: '2023-03-20T15:30:00Z',
        notes: 'Consultoría técnica mensual',
        created_at: '2023-02-20T15:30:00Z',
      },
      {
        invoice_id: 'INV003',
        client_id: 'CLI003',
        jump_id: 'JMP003',
        number: 'F-2023-003',
        amount: 1500,
        tax_percent: 21,
        status: 'draft',
        issue_date: '2023-03-05T09:15:00Z',
        due_date: '2023-04-05T09:15:00Z',
        notes: 'Desarrollo de Jump Inventario',
        created_at: '2023-03-05T09:15:00Z',
      },
      {
        invoice_id: 'INV004',
        client_id: 'CLI001',
        number: 'F-2023-004',
        amount: 300,
        tax_percent: 21,
        status: 'overdue',
        issue_date: '2023-04-10T11:00:00Z',
        due_date: '2023-05-10T11:00:00Z',
        notes: 'Mantenimiento mensual',
        created_at: '2023-04-10T11:00:00Z',
      },
      {
        invoice_id: 'INV005',
        client_id: 'CLI004',
        jump_id: 'JMP005',
        number: 'F-2023-005',
        amount: 2200,
        tax_percent: 21,
        status: 'paid',
        issue_date: '2023-05-22T14:00:00Z',
        due_date: '2023-06-22T14:00:00Z',
        paid_date: '2023-06-15T09:45:00Z',
        notes: 'Implementación Panel Administrativo',
        created_at: '2023-05-22T14:00:00Z',
      },
    ];
    
    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = invoices;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (invoice) => 
          invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter((invoice) => invoice.status === statusFilter);
    }
    
    setFilteredInvoices(result);
  }, [invoices, searchTerm, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'sent':
        return 'Enviada';
      case 'paid':
        return 'Pagada';
      case 'overdue':
        return 'Vencida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Calcular el importe total con impuestos
  const calculateTotal = (amount: number, taxPercent: number) => {
    return amount * (1 + taxPercent / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Facturas</h1>
        <Link to="/invoices/new">
          <Button>Nueva Factura</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número o cliente..."
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
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="paid">Pagada</option>
                <option value="overdue">Vencida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando facturas...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron facturas que coincidan con los filtros.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Importe (con IVA)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>
                      <Link to={`/clients/${invoice.client_id}`} className="text-primary hover:underline">
                        Cliente {invoice.client_id}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>{formatCurrency(calculateTotal(invoice.amount, invoice.tax_percent), 'EUR')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        to={`/invoices/${invoice.invoice_id}`} 
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

export default Invoices;

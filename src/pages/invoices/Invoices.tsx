import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Invoice } from '../../types';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getInvoices, downloadInvoicePdf } from '../../api/invoicesApi';
import { Printer, Eye, AlertCircle } from 'lucide-react';

/**
 * Página de listado de Facturas
 */
const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [printingInvoiceIds, setPrintingInvoiceIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await getInvoices();
        setInvoices(data);
        setFilteredInvoices(data);
      } catch (error) {
        console.error('Error al cargar facturas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoices();
  }, []);

  useEffect(() => {
    // Aplicar filtros
    let result = invoices;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (invoice) => 
          (invoice.invoice_id && invoice.invoice_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (invoice.client_id && invoice.client_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
  
  // Manejar la impresión de facturas
  const handlePrintInvoice = async (invoiceId: string) => {
    if (!invoiceId) return;
    
    try {
      // Marcar esta factura como en proceso de impresión
      setPrintingInvoiceIds((prev) => [...prev, invoiceId]);
      
      // Llamar a la API para generar el PDF y abrirlo en una nueva pestaña
      await downloadInvoicePdf(invoiceId);
    } catch (error) {
      console.error('Error al imprimir factura:', error);
      // Aquí se podría mostrar una notificación de error
    } finally {
      // Desmarcar la factura del estado de impresión
      setPrintingInvoiceIds((prev) => prev.filter(id => id !== invoiceId));
    }
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
                    <TableCell className="font-medium">{invoice.invoice_id}</TableCell>
                    <TableCell>
                      <Link to={`/clients/${invoice.client_id}`} className="text-primary hover:underline">
                        Cliente {invoice.client_id}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total || 0, 'EUR')}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link 
                        to={`/invoices/${invoice.invoice_id}`} 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary text-white hover:bg-primary/90"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center px-2 py-1 text-xs"
                        onClick={() => handlePrintInvoice(invoice.invoice_id)}
                        disabled={printingInvoiceIds.includes(invoice.invoice_id)}
                      >
                        {printingInvoiceIds.includes(invoice.invoice_id) ? (
                          <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            PDF
                          </>
                        ) : (
                          <>
                            <Printer className="mr-1 h-3 w-3" />
                            PDF
                          </>
                        )}
                      </Button>
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectOption } from '../../components/ui/Select';
import { Invoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

// Esquema de validación con Zod
const invoiceSchema = z.object({
  number: z.string().min(1, { message: 'El número de factura es obligatorio' }),
  client_id: z.string().min(1, { message: 'El cliente es obligatorio' }),
  jump_id: z.string().optional(),
  amount: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) > 0,
    { message: 'El importe debe ser un número positivo' }
  ),
  tax_percent: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) >= 0,
    { message: 'El porcentaje de impuestos debe ser un número positivo o cero' }
  ),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issue_date: z.string().min(1, { message: 'La fecha de emisión es obligatoria' }),
  due_date: z.string().min(1, { message: 'La fecha de vencimiento es obligatoria' }),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

/**
 * Página de detalle de Factura para crear o editar
 */
const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [jumps, setJumps] = useState<{ id: string; name: string }[]>([]);
  // Verificar si estamos en modo edición (el ID existe y no es 'new')
  const isEditing = id !== undefined && id !== 'new';
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      number: '',
      client_id: '',
      jump_id: '',
      amount: '',
      tax_percent: '21', // Valor por defecto del IVA en España
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vencimiento a 30 días
      notes: '',
    },
  });

  // Valores actuales del formulario para cálculos
  const amount = watch('amount');
  const taxPercent = watch('tax_percent');

  // Calcular el total con impuestos
  const calculateTotal = () => {
    const amountValue = parseFloat(amount) || 0;
    const taxValue = parseFloat(taxPercent) || 0;
    return amountValue * (1 + taxValue / 100);
  };

  useEffect(() => {
    // Cargar la lista de clientes desde la API
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/clients');
        if (!response.ok) {
          throw new Error(`Error al cargar clientes: ${response.statusText}`);
        }
        const data = await response.json();
        const formattedClients = data.map((client: any) => ({
          id: client.client_id,
          name: `${client.name} (${client.company || 'Independiente'})`,
        }));
        setClients(formattedClients);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      }
    };

    // Cargar la lista de jumps desde la API
    const fetchJumps = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/jumps');
        if (!response.ok) {
          throw new Error(`Error al cargar jumps: ${response.statusText}`);
        }
        const data = await response.json();
        const formattedJumps = data.map((jump: any) => ({
          id: jump.jump_id,
          name: jump.name,
        }));
        setJumps(formattedJumps);
      } catch (err) {
        console.error('Error al cargar jumps:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar jumps');
      }
    };

    // Cargar la factura existente si estamos en modo edición
    const fetchInvoice = async () => {
      if (!isEditing || !id) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3001/api/invoices/${id}`);
        if (!response.ok) {
          throw new Error(`Error al cargar factura: ${response.statusText}`);
        }
        
        const invoiceData = await response.json();
        console.log('Datos de factura cargados:', invoiceData);
        
        setInvoice(invoiceData);
        
        // Formatear fechas para los inputs de tipo date
        const issueDate = invoiceData.issue_date 
          ? new Date(invoiceData.issue_date).toISOString().split('T')[0]
          : '';
          
        const dueDate = invoiceData.due_date
          ? new Date(invoiceData.due_date).toISOString().split('T')[0]
          : '';

        reset({
          number: invoiceData.number,
          client_id: invoiceData.client_id,
          jump_id: invoiceData.jump_id || '',
          amount: invoiceData.amount.toString(),
          tax_percent: invoiceData.tax_percent.toString(),
          status: invoiceData.status,
          issue_date: issueDate,
          due_date: dueDate,
          notes: invoiceData.notes || '',
        });
      } catch (err) {
        console.error('Error al cargar la factura:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar la factura');
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar las funciones de carga de datos
    fetchClients();
    fetchJumps();
    fetchInvoice();
  }, [id, isEditing, reset]);

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Formatear datos para enviar al servidor
      const invoiceData = {
        ...data,
        amount: parseFloat(data.amount),
        tax_percent: parseFloat(data.tax_percent),
        tax_amount: calculateTotal() - parseFloat(data.amount), // Calcular el importe del impuesto
        total: calculateTotal(),
      };
      
      // Enviar los datos a la API usando el endpoint correcto
      const url = isEditing 
        ? `http://localhost:3001/api/invoices/${id}` 
        : 'http://localhost:3001/api/invoices';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos al servidor:', invoiceData);
      console.log('URL:', url, 'Método:', method);
      
      // Realizar la llamada a la API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 
          `Error al guardar la factura: ${response.status} ${response.statusText}`
        );
      }
      
      // Obtener la respuesta y mostrar en console para debug
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Redirigir a la lista de facturas
      navigate('/invoices');
    } catch (err) {
      console.error('Error al guardar la factura:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar la factura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!id) return;
    
    if (window.confirm('¿Estás seguro de marcar esta factura como pagada?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Actualizar el estado de la factura a 'paid' (pagada)
        const url = `http://localhost:3001/api/invoices/${id}/status`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'paid' }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || 
            `Error al marcar la factura como pagada: ${response.status} ${response.statusText}`
          );
        }
        
        // Invalidar consultas para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        
        // Redireccionar a la lista de facturas
        navigate('/invoices');
      } catch (err) {
        console.error('Error al marcar la factura como pagada:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al actualizar la factura');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? `Factura ${invoice?.number}` : 'Nueva Factura'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/invoices')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Detalles de la Factura' : 'Crear Factura'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos de la factura...</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="number">Número de Factura</Label>
                  <Input 
                    id="number" 
                    {...register('number')}
                    placeholder="F-2023-XXX"
                  />
                  {errors.number && (
                    <p className="text-sm text-red-500">{errors.number.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select 
                    id="client_id" 
                    {...register('client_id')}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map(client => (
                      <SelectOption key={client.id} value={client.id}>
                        {client.name}
                      </SelectOption>
                    ))}
                  </Select>
                  {errors.client_id && (
                    <p className="text-sm text-red-500">{errors.client_id.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jump_id" optional>Jump Relacionado</Label>
                  <Select 
                    id="jump_id" 
                    {...register('jump_id')}
                  >
                    <option value="">Ninguno</option>
                    {jumps.map(jump => (
                      <SelectOption key={jump.id} value={jump.id}>
                        {jump.name}
                      </SelectOption>
                    ))}
                  </Select>
                  {errors.jump_id && (
                    <p className="text-sm text-red-500">{errors.jump_id.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Importe (sin IVA)</Label>
                  <Input 
                    id="amount" 
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('amount')}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tax_percent">IVA (%)</Label>
                  <Input 
                    id="tax_percent" 
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    {...register('tax_percent')}
                    placeholder="21"
                  />
                  {errors.tax_percent && (
                    <p className="text-sm text-red-500">{errors.tax_percent.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Importe Total (con IVA)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center">
                    <span>{formatCurrency(calculateTotal(), 'EUR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Fecha de Emisión</Label>
                  <Input 
                    id="issue_date" 
                    type="date"
                    {...register('issue_date')}
                  />
                  {errors.issue_date && (
                    <p className="text-sm text-red-500">{errors.issue_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                  <Input 
                    id="due_date" 
                    type="date"
                    {...register('due_date')}
                  />
                  {errors.due_date && (
                    <p className="text-sm text-red-500">{errors.due_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    id="status" 
                    {...register('status')}
                  >
                    <SelectOption value="draft">Borrador</SelectOption>
                    <SelectOption value="sent">Enviada</SelectOption>
                    <SelectOption value="paid">Pagada</SelectOption>
                    <SelectOption value="overdue">Vencida</SelectOption>
                    <SelectOption value="cancelled">Cancelada</SelectOption>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" optional>Notas</Label>
                <textarea 
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('notes')}
                  placeholder="Notas adicionales para esta factura"
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>
            </form>
          </>
        )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-between">
            <div>
              {isEditing && invoice?.status !== 'paid' && (
                <Button
                  variant="secondary"
                  onClick={handleMarkAsPaid}
                >
                  Marcar como Pagada
                </Button>
              )}
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/invoices')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="invoice-form"
                isLoading={isLoading}
              >
                {isEditing ? 'Actualizar Factura' : 'Crear Factura'}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default InvoiceDetail;

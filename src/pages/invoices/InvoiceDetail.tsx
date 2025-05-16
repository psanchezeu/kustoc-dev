import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { downloadInvoicePdf } from '../../api/invoicesApi';
import { FileText, Printer } from 'lucide-react';

// Esquema para los items de factura
const invoiceItemSchema = z.object({
  item_type: z.enum(['product', 'service', 'subscription', 'hour']),
  description: z.string().min(1, { message: 'La descripción es obligatoria' }),
  quantity: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) > 0,
    { message: 'La cantidad debe ser un número positivo' }
  ),
  unit_price: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) >= 0,
    { message: 'El precio unitario debe ser un número positivo o cero' }
  )
});

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
  // Agregamos los campos adicionales requeridos por el servidor
  payment_status: z.enum(['pendiente', 'pagado', 'cancelado']).default('pendiente'),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
  // No necesitamos incluir los items en el schema principal porque los manejaremos por separado
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type InvoiceItemData = z.infer<typeof invoiceItemSchema>;

/**
 * Página de detalle de Factura para crear o editar
 */
const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [jumps, setJumps] = useState<{ id: string; name: string }[]>([]);
  // Estado para los ítems de factura
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemData[]>([
    {
      item_type: 'service',
      description: 'Servicios profesionales',
      quantity: '1',
      unit_price: '0'
    }
  ]);
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
    resolver: zodResolver(invoiceSchema) as any, // Usamos type assertion para evitar errores de compatibilidad
    defaultValues: {
      number: '',
      client_id: '',
      jump_id: '',
      amount: '',
      payment_status: 'pendiente',
      payment_method: '',
      payment_reference: '',
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

        // Adaptando los campos del backend a lo que espera el formulario
        // Calculando el importe sin IVA a partir del total y el porcentaje de IVA
        let amountWithoutTax = 0;
        if (invoiceData.total && invoiceData.tax) {
          // Fórmula: importe sin IVA = total / (1 + (porcentaje IVA / 100))
          amountWithoutTax = invoiceData.total / (1 + (invoiceData.tax / 100));
        }

        reset({
          number: invoiceData.invoice_id || '',
          client_id: invoiceData.client_id || '',
          jump_id: invoiceData.project_id || '',
          // Convertimos a string para que coincida con lo que espera el esquema de validación
          amount: amountWithoutTax.toFixed(2),
          tax_percent: invoiceData.tax ? invoiceData.tax.toFixed(2) : '0',
          status: invoiceData.status || 'pending',
          issue_date: issueDate,
          due_date: dueDate,
          notes: invoiceData.notes || '',
        });
        
        console.log('Importe sin IVA calculado:', amountWithoutTax.toFixed(2), 
                    'IVA:', invoiceData.tax, 
                    'Total original:', invoiceData.total);
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
      // Obtener la información del cliente para completar los datos de facturación
      const clientResponse = await fetch(`/api/clients/${data.client_id}`);
      if (!clientResponse.ok) {
        throw new Error('Error al obtener datos del cliente');
      }
      const clientData = await clientResponse.json();
      
      // Formatear datos para enviar al servidor
      const taxAmount = calculateTotal() - parseFloat(data.amount);
      
      // Formatear los items de factura (asegurarse de que son números)
      const formattedItems = invoiceItems.map(item => ({
        item_type: item.item_type,
        description: item.description,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }));
      
      // Construir un objeto que coincida exactamente con la estructura de la tabla en la base de datos
      const invoiceData = {
        // Campos de la tabla 'invoices' en el servidor
        invoice_id: isEditing ? id : `INV-${Date.now()}`,
        client_id: data.client_id,
        project_id: data.jump_id || null,
        issue_date: data.issue_date,
        due_date: data.due_date, // Añadimos el campo due_date
        tax: taxAmount,
        total: calculateTotal(),
        billing_name: clientData.name || clientData.company || 'Cliente sin nombre',
        billing_tax_id: clientData.tax_id || 'Pendiente',
        billing_address: clientData.address || '',
        billing_email: clientData.email || '',
        payment_method: data.payment_method || '',
        payment_status: data.payment_status || 'pendiente',
        payment_reference: data.payment_reference || '',
        status: data.status,
        // Datos adicionales que no se guardan en la tabla 'invoices' pero son necesarios
        number: data.number,
        // Items de factura (requerido por el servidor)
        items: formattedItems,
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
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/invoices/${id}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al marcar factura como pagada: ${response.statusText}`);
      }
      
      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      
      // Actualizar el formulario
      reset({
        ...updatedInvoice,
        status: 'paid',
      });
      
      // Actualizar la caché de consulta
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Mostrar mensaje de éxito usando algún sistema de notificaciones
      console.log('Factura marcada como pagada con éxito');
    } catch (err) {
      console.error('Error al marcar como pagada:', err);
      setError(err instanceof Error ? err.message : 'Error al marcar factura como pagada');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!id || id === 'new') return;
    
    try {
      setIsPdfLoading(true);
      await downloadInvoicePdf(id);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError(err instanceof Error ? err.message : 'Error al generar el PDF de la factura');
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? `Factura ${invoice?.invoice_id}` : 'Nueva Factura'}
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
                <Label htmlFor="notes">Notas</Label>
                <textarea 
                  id="notes" 
                  className="w-full h-24 px-3 py-2 border rounded-md" 
                  {...register('notes')}
                  placeholder="Notas o comentarios adicionales"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_status">Estado de Pago</Label>
                <Select id="payment_status" {...register('payment_status')}>
                  <SelectOption value="pendiente">Pendiente</SelectOption>
                  <SelectOption value="pagado">Pagado</SelectOption>
                  <SelectOption value="cancelado">Cancelado</SelectOption>
                </Select>
                {errors.payment_status && (
                  <p className="text-sm text-red-500">{errors.payment_status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select id="payment_method" {...register('payment_method')}>
                  <SelectOption value="">Seleccionar método</SelectOption>
                  <SelectOption value="transferencia">Transferencia bancaria</SelectOption>
                  <SelectOption value="tarjeta">Tarjeta de crédito/débito</SelectOption>
                  <SelectOption value="efectivo">Efectivo</SelectOption>
                  <SelectOption value="paypal">PayPal</SelectOption>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_reference">Referencia de Pago</Label>
                <Input 
                  id="payment_reference" 
                  {...register('payment_reference')}
                  placeholder="Número de transferencia, recibo, etc."
                />
              </div>
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
              
              {/* Sección de Ítems de Factura */}
              <div className="space-y-4 mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold">Conceptos de Factura</h3>
                <p className="text-sm text-gray-500">Añade los productos o servicios incluidos en esta factura.</p>
                
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md">
                    <div>
                      <Label htmlFor={`item-type-${index}`}>Tipo</Label>
                      <Select
                        id={`item-type-${index}`}
                        value={item.item_type}
                        onChange={(e) => {
                          const newItems = [...invoiceItems];
                          newItems[index].item_type = e.target.value as any;
                          setInvoiceItems(newItems);
                        }}
                      >
                        <SelectOption value="product">Producto</SelectOption>
                        <SelectOption value="service">Servicio</SelectOption>
                        <SelectOption value="subscription">Suscripción</SelectOption>
                        <SelectOption value="hour">Horas</SelectOption>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`item-desc-${index}`}>Descripción</Label>
                      <Input
                        id={`item-desc-${index}`}
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...invoiceItems];
                          newItems[index].description = e.target.value;
                          setInvoiceItems(newItems);
                        }}
                        placeholder="Descripción del concepto"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`item-qty-${index}`}>Cantidad</Label>
                      <Input
                        id={`item-qty-${index}`}
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceItems];
                          newItems[index].quantity = e.target.value;
                          setInvoiceItems(newItems);
                        }}
                        type="number"
                        min="1"
                        step="1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`item-price-${index}`}>Precio Unitario</Label>
                      <Input
                        id={`item-price-${index}`}
                        value={item.unit_price}
                        onChange={(e) => {
                          const newItems = [...invoiceItems];
                          newItems[index].unit_price = e.target.value;
                          setInvoiceItems(newItems);
                          
                          // Actualizar el monto total cuando cambia el precio
                          const amount = newItems.reduce(
                            (total, item) => total + (parseFloat(item.unit_price) * parseInt(item.quantity || '0')), 
                            0
                          );
                          
                          // Actualizar el campo amount en el formulario
                          reset({ 
                            ...watch(), 
                            amount: amount.toString() 
                          });
                        }}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => {
                          const newItems = [...invoiceItems];
                          newItems.splice(index, 1);
                          setInvoiceItems(newItems);
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInvoiceItems([
                      ...invoiceItems,
                      {
                        item_type: 'service',
                        description: '',
                        quantity: '1',
                        unit_price: '0'
                      }
                    ]);
                  }}
                >
                  Añadir Concepto
                </Button>
              </div>
            </form>
          </>
        )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              {isEditing && invoice?.status !== 'paid' && (
                <Button
                  variant="secondary"
                  onClick={handleMarkAsPaid}
                >
                  Marcar como Pagada
                </Button>
              )}
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handlePrintInvoice}
                  disabled={isPdfLoading}
                >
                  {isPdfLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir PDF
                    </>
                  )}
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

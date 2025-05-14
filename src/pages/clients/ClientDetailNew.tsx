import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getClientById } from '../../api/clientsApi';
import { SERVER_CONFIG } from '../../config';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { cn } from '../../lib/utils';

// Esquema de validación para el formulario de cliente
const clientSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  company: z.string().min(1, { message: 'La empresa es obligatoria' }),
  sector: z.string().min(1, { message: 'El sector es obligatorio' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url({ message: 'URL inválida' }).optional().or(z.literal('')),
  tax_id: z.string().min(1, { message: 'El ID fiscal es obligatorio' }),
  secondary_contact: z.string().optional(),
  secondary_email: z.string().email({ message: 'Email secundario inválido' }).optional().or(z.literal('')),
  contact_notes: z.string().optional(),
  status: z.string().min(1, { message: 'El estado es obligatorio' })
});

type ClientFormData = z.infer<typeof clientSchema>;

/**
 * Componente para mostrar y editar detalles de un cliente
 */
export default function ClientDetailNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Determine si es un nuevo cliente
  const isNewClient = id === 'new';
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configurar React Hook Form con validación Zod
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      company: '',
      sector: 'Talleres Mecánicos',
      email: '',
      phone: '',
      address: '',
      website: '',
      tax_id: '',
      secondary_contact: '',
      secondary_email: '',
      contact_notes: '',
      status: 'Prospecto'
    }
  });
  
  // Cargar datos del cliente si no es nuevo
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id!),
    enabled: !isNewClient && !!id
  });
  
  // Actualizar valores del formulario cuando se carguen los datos del cliente
  useEffect(() => {
    if (client && !isNewClient) {
      reset({
        name: client.name,
        company: client.company,
        sector: client.sector,
        email: client.email,
        phone: client.phone || '',
        address: client.address || '',
        website: client.website || '',
        tax_id: client.tax_id,
        secondary_contact: client.secondary_contact || '',
        secondary_email: client.secondary_email || '',
        contact_notes: client.contact_notes || '',
        status: client.status
      });
    }
  }, [client, reset, isNewClient]);
  
  // Manejar submit del formulario
  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Enviando datos:', data);
      
      let apiUrl = `${SERVER_CONFIG.BASE_URL}/api/clients`;
      let method = 'POST';
      
      // Si estamos editando un cliente existente, cambiamos el endpoint y el método
      if (!isNewClient && id) {
        apiUrl = `${SERVER_CONFIG.BASE_URL}/api/clients/${id}`;
        method = 'PUT';
        console.log('Actualizando cliente existente, URL:', apiUrl);
      } else {
        console.log('Creando nuevo cliente, URL:', apiUrl);
      }
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Respuesta status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error respuesta:', response.status, errorText);
        setError(`Error al guardar: ${response.status} ${errorText}`);
        return;
      }
      
      const responseData = await response.json();
      console.log('Cliente guardado:', responseData);
      
      // Actualizar caché
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (!isNewClient && id) {
        queryClient.invalidateQueries({ queryKey: ['client', id] });
      }
      
      alert(isNewClient ? 'Cliente creado correctamente' : 'Cliente actualizado correctamente');
      
      // Redirigir a la lista de clientes
      setTimeout(() => {
        navigate('/clients');
      }, 500);
      
    } catch (err) {
      console.error('Error en submit:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingClient && !isNewClient) {
    return <div className="p-8 text-center">Cargando datos del cliente...</div>;
  }
  
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNewClient ? 'Nuevo Cliente' : `Cliente: ${client?.name}`}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/clients')}
        >
          Volver a Lista
        </Button>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="contact" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="contact">Datos de Contacto</TabsTrigger>
                <TabsTrigger value="billing">Datos de Facturación</TabsTrigger>
              </TabsList>
              
              {/* Pestaña de Datos de Contacto */}
              <TabsContent value="contact" className="p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.name ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Empresa
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.company ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('company')}
                      />
                      {errors.company && (
                        <p className="mt-1 text-xs text-destructive">{errors.company.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Sector
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.sector ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('sector')}
                      >
                        <option value="Talleres Mecánicos">Talleres Mecánicos</option>
                        <option value="Clínicas">Clínicas</option>
                        <option value="Asesorías">Asesorías</option>
                        <option value="Restaurantes">Restaurantes</option>
                        <option value="Otros">Otros</option>
                      </select>
                      {errors.sector && (
                        <p className="mt-1 text-xs text-destructive">{errors.sector.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Estado
                      </label>
                      <select
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.status ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('status')}
                      >
                        <option value="Prospecto">Prospecto</option>
                        <option value="Cliente Activo">Cliente Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="En Negociación">En Negociación</option>
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-xs text-destructive">{errors.status.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.email ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.phone ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Contacto Secundario
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.secondary_contact ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('secondary_contact')}
                      />
                      {errors.secondary_contact && (
                        <p className="mt-1 text-xs text-destructive">{errors.secondary_contact.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Email Secundario
                      </label>
                      <input
                        type="email"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.secondary_email ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('secondary_email')}
                      />
                      {errors.secondary_email && (
                        <p className="mt-1 text-xs text-destructive">{errors.secondary_email.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Notas
                      </label>
                      <textarea
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.contact_notes ? 'border-destructive' : 'border-input'
                        }`}
                        rows={2}
                        {...register('contact_notes')}
                      />
                      {errors.contact_notes && (
                        <p className="mt-1 text-xs text-destructive">{errors.contact_notes.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Pestaña de Datos de Facturación */}
              <TabsContent value="billing" className="p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        ID Fiscal
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.tax_id ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('tax_id')}
                      />
                      {errors.tax_id && (
                        <p className="mt-1 text-xs text-destructive">{errors.tax_id.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.address ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('address')}
                      />
                      {errors.address && (
                        <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Sitio Web
                      </label>
                      <input
                        type="url"
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          errors.website ? 'border-destructive' : 'border-input'
                        }`}
                        {...register('website')}
                      />
                      {errors.website && (
                        <p className="mt-1 text-xs text-destructive">{errors.website.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-6 space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/clients')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

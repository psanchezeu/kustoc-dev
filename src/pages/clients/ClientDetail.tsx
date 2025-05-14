import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getClientById, createClient, updateClient, getClientInteractions, createClientInteraction, Client, Interaction } from '../../api/clientsApi';
import { SERVER_CONFIG } from '../../config';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { formatDate } from '../../lib/utils';

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

// Esquema para el formulario de interacción
const interactionSchema = z.object({
  interaction_type: z.string().min(1, { message: 'El tipo de interacción es obligatorio' }),
  interaction_summary: z.string().min(1, { message: 'El resumen es obligatorio' })
});

type InteractionFormData = z.infer<typeof interactionSchema>;

/**
 * Componente para mostrar y editar detalles de un cliente
 */
const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewClient = id === 'new';
  
  // Estados para controlar la UI
  const [isEditing, setIsEditing] = useState(isNewClient || false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionFile, setInteractionFile] = useState<File | null>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState('');
  
  // Forzar modo edición para nuevos clientes - usar un ref para evitar cambios inesperados
  const initialSetupDone = React.useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez para clientes nuevos
    if (isNewClient && !initialSetupDone.current) {
      setIsEditing(true);
      initialSetupDone.current = true;
      console.log('Forzando modo edición para nuevo cliente');
    }
  }, [isNewClient]);

  // Obtener datos del cliente si no es nuevo
  const { 
    data: client,
    isLoading: isLoadingClient,
    error: clientError
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id || ''),
    enabled: !isNewClient && !!id
  });

  // Obtener interacciones del cliente si no es nuevo
  const {
    data: interactions = [],
    isLoading: isLoadingInteractions
  } = useQuery({
    queryKey: ['client-interactions', id],
    queryFn: () => getClientInteractions(id || ''),
    enabled: !isNewClient && !!id
  });

  // Formulario para clientes
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting: isSubmittingClient }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: isNewClient ? {
      sector: 'Otros',
      status: 'Prospecto'
    } : {}
  });
  
  // Cargar datos del cliente en el formulario cuando está disponible
  useEffect(() => {
    if (client && !isNewClient) {
      // Usar defaultValues seguras con comprobación de nulos/undefined
      reset({
        name: client.name || '',
        company: client.company || '',
        sector: client.sector || 'Otros',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        website: client.website || '',
        tax_id: client.tax_id || '',
        secondary_contact: client.secondary_contact || '',
        secondary_email: client.secondary_email || '',
        contact_notes: client.contact_notes || '',
        status: client.status || 'Prospecto'
      });
    }
  }, [client, isNewClient, reset]);

  // Formulario para interacciones
  const {
    register: registerInteraction,
    handleSubmit: handleSubmitInteraction,
    reset: resetInteraction,
    formState: { errors: interactionErrors, isSubmitting: isSubmittingInteraction }
  } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      interaction_type: 'Otro'
    }
  });

  // Mutación para crear cliente
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    }
  });

  // Mutación para actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: (data: {id: string, clientData: Partial<Client>}) => 
      updateClient(data.id, data.clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsEditing(false);
    }
  });

  // Mutación para crear interacción
  const createInteractionMutation = useMutation({
    mutationFn: (data: InteractionFormData) => 
      createClientInteraction(id || '', { 
        ...data, 
        file: interactionFile || undefined 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-interactions', id] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      setShowInteractionForm(false);
      resetInteraction();
      setInteractionFile(null);
    }
  });

  // Observamos cuando cambia isEditing para asegurarnos de que el formulario es editable
  useEffect(() => {
    console.log('Estado de edición:', isEditing);
  }, [isEditing]);

  // Manejar submit del formulario de cliente
  const onSubmitClient = async (data: ClientFormData) => {
    try {
      console.log('Enviando datos del formulario:', data);
      console.log('Estado de edición:', isEditing, 'Es nuevo cliente:', isNewClient);
      
      if (isNewClient) {
        console.log('Creando nuevo cliente con datos:', data);
        createClientMutation.mutate(data);
      } else if (id) {
        console.log('Actualizando cliente existente:', id, 'con datos:', data);
        updateClientMutation.mutate({ id, clientData: data });
      }
    } catch (error) {
      console.error('Error al enviar formulario de cliente:', error);
    }
  };

  // Manejar submit del formulario de interacción
  const onSubmitInteraction = (data: InteractionFormData) => {
    createInteractionMutation.mutate(data);
  };

  // Manejar cambio en el archivo de interacción
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileErrorMessage('');
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFileErrorMessage('El archivo no debe superar 5MB');
        return;
      }
      
      setInteractionFile(file);
    } else {
      setInteractionFile(null);
    }
  };

  // Renderizar estado de carga
  if (isLoadingClient && !isNewClient) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Renderizar error
  if (clientError && !isNewClient) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-destructive">
            <p>Error al cargar los datos del cliente.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/clients')}
            >
              Volver a Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNewClient ? 'Nuevo Cliente' : `Cliente: ${client?.name}`}
        </h1>
        <div className="flex space-x-2">
          {!isNewClient && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/clients')}
          >
            Volver
          </Button>
        </div>
      </div>
      
      {/* Formulario de Cliente */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle>
            {isEditing ? 'Editar Información' : 'Información del Cliente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="clientForm" onSubmit={handleSubmit(onSubmitClient)}>
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.email ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={!isEditing}
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
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.phone ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={!isEditing}
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    ID Fiscal
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.tax_id ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={!isEditing}
                    {...register('tax_id')}
                  />
                  {errors.tax_id && (
                    <p className="mt-1 text-xs text-destructive">{errors.tax_id.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Dirección
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.address ? 'border-destructive' : 'border-input'
                    }`}
                    rows={2}
                    disabled={!isEditing}
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
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.website ? 'border-destructive' : 'border-input'
                    }`}
                    disabled={!isEditing}
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className="mt-1 text-xs text-destructive">{errors.website.message}</p>
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
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                    {...register('secondary_email')}
                  />
                  {errors.secondary_email && (
                    <p className="mt-1 text-xs text-destructive">{errors.secondary_email.message}</p>
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
                    disabled={!isEditing}
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
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Notas de Contacto
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors.contact_notes ? 'border-destructive' : 'border-input'
                    }`}
                    rows={2}
                    disabled={!isEditing}
                    {...register('contact_notes')}
                  />
                  {errors.contact_notes && (
                    <p className="mt-1 text-xs text-destructive">{errors.contact_notes.message}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {isEditing && (
            <>
              <Button 
                variant="outline"
                onClick={() => {
                  if (isNewClient) {
                    navigate('/clients');
                  } else {
                    setIsEditing(false);
                    reset();
                  }
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                form="clientForm"
                isLoading={isSubmittingClient || createClientMutation.isPending || updateClientMutation.isPending}
              >
                {isNewClient ? 'Crear Cliente' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      
      {/* Sección de Interacciones - Solo visible para clientes existentes */}
      {!isNewClient && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Historial de Interacciones</CardTitle>
              <Button 
                onClick={() => setShowInteractionForm(!showInteractionForm)}
                size="sm"
              >
                {showInteractionForm ? 'Cancelar' : 'Nueva Interacción'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Formulario de nueva interacción */}
            {showInteractionForm && (
              <form 
                className="mb-6 p-4 border rounded-md"
                onSubmit={handleSubmitInteraction(onSubmitInteraction)}
              >
                <h3 className="text-lg font-medium mb-4">Nueva Interacción</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Tipo de Interacción
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        interactionErrors.interaction_type ? 'border-destructive' : 'border-input'
                      }`}
                      {...registerInteraction('interaction_type')}
                    >
                      <option value="Llamada">Llamada</option>
                      <option value="Correo">Correo</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {interactionErrors.interaction_type && (
                      <p className="mt-1 text-xs text-destructive">
                        {interactionErrors.interaction_type.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Archivo (Opcional)
                    </label>
                    <input
                      type="file"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      onChange={handleFileChange}
                    />
                    {fileErrorMessage && (
                      <p className="mt-1 text-xs text-destructive">{fileErrorMessage}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Resumen
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        interactionErrors.interaction_summary ? 'border-destructive' : 'border-input'
                      }`}
                      rows={3}
                      {...registerInteraction('interaction_summary')}
                    />
                    {interactionErrors.interaction_summary && (
                      <p className="mt-1 text-xs text-destructive">
                        {interactionErrors.interaction_summary.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    type="submit"
                    isLoading={isSubmittingInteraction || createInteractionMutation.isPending}
                  >
                    Guardar Interacción
                  </Button>
                </div>
              </form>
            )}
            
            {/* Lista de interacciones */}
            {isLoadingInteractions ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No hay interacciones registradas para este cliente.
              </div>
            ) : (
              <div className="space-y-4">
                {interactions.map((interaction: Interaction) => (
                  <div key={interaction.interaction_id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          interaction.interaction_type === 'Llamada' 
                            ? 'bg-blue-100 text-blue-800' 
                            : interaction.interaction_type === 'Correo'
                            ? 'bg-purple-100 text-purple-800'
                            : interaction.interaction_type === 'Reunión'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {interaction.interaction_type}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(interaction.interaction_date)}
                        </p>
                      </div>
                      
                      {interaction.interaction_files && (
                        <a 
                          href={`${SERVER_CONFIG.BASE_URL}/uploads/${interaction.interaction_files}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Ver archivo adjunto
                        </a>
                      )}
                    </div>
                    
                    <p className="mt-3 text-sm">
                      {interaction.interaction_summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientDetail;

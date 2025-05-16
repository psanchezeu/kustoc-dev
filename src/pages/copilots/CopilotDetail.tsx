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
import { Copilot } from '../../types';

// Esquema de validación con Zod
const copilotSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  email: z.string().email({ message: 'El email debe ser válido' }),
  bio: z.string().optional(),
  specialty: z.string().min(1, { message: 'Debes ingresar al menos una especialidad' }),
  availability: z.enum(['available', 'busy', 'inactive']),
  role: z.string().min(1, { message: 'El rol es obligatorio' }),
  hourly_rate: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) > 0,
    { message: 'La tarifa debe ser un número positivo' }
  ),
});

type CopilotFormData = z.infer<typeof copilotSchema>;

/**
 * Página de detalle de Copiloto para crear o editar
 */
const CopilotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Verificar si estamos en modo edición (el ID existe y no es 'new')
  const isEditing = id !== undefined && id !== 'new';

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CopilotFormData>({
    resolver: zodResolver(copilotSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      specialty: '',
      availability: 'available',
      role: 'developer',
      hourly_rate: '',
    },
  });

  useEffect(() => {
    // Si estamos editando, cargar los datos del copiloto existente
    if (isEditing) {
      setIsLoading(true);
      setError(null);
      
      fetch(`http://localhost:3001/api/copilots/${id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al cargar el copiloto');
          }
          return response.json();
        })
        .then(data => {
          // Parsear el specialty si viene como string JSON
          let specialtyArray = [];
          try {
            if (typeof data.specialty === 'string') {
              specialtyArray = JSON.parse(data.specialty);
            } else if (Array.isArray(data.specialty)) {
              specialtyArray = data.specialty;
            }
          } catch (e) {
            console.error('Error al parsear specialty:', e);
            specialtyArray = [];
          }
          
          reset({
            name: data.name,
            email: data.email,
            bio: data.bio || '',
            specialty: Array.isArray(specialtyArray) ? specialtyArray.join(', ') : '',
            availability: data.availability || 'available',
            role: data.role || 'developer',
            hourly_rate: data.hourly_rate?.toString() || '0',
          });
        })
        .catch(err => {
          console.error('Error al cargar datos del copiloto:', err);
          setError(err.message || 'Error al cargar los datos del copiloto');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: CopilotFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Procesar los datos antes de enviarlos
      const processedData = {
        ...data,
        specialty: data.specialty.split(',').map(s => s.trim()).filter(Boolean),
        hourly_rate: Number(data.hourly_rate),
        // Asegurar que availability tenga un valor válido
        availability: data.availability || 'available'
      };
      
      // Enviar los datos a la API usando el endpoint correcto
      const url = isEditing ? `http://localhost:3001/api/copilots/${id}` : 'http://localhost:3001/api/copilots';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos al servidor:', processedData);
      console.log('URL:', url, 'Método:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });
      
      // Imprimir la respuesta para depuración
      console.log('Status:', response.status, response.statusText);
      // Intentar leer la respuesta como texto primero para depuración
      const responseText = await response.text();
      console.log('Respuesta del servidor:', responseText);
      
      // Si no es OK, construir un objeto de error más descriptivo
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${response.statusText}. Respuesta: ${responseText}`);
        }
      }
      
      // Si llegamos aquí, la respuesta fue exitosa - continuar con la operación
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['copilots'] });
      
      // Redirigir a la lista de copilotos después de guardar
      navigate('/copilots');
    } catch (err) {
      console.error('Error al guardar el copiloto:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar el copiloto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Copiloto' : 'Nuevo Copiloto'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/copilots')}>
          Volver
        </Button>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Información del Copiloto' : 'Registrar Nuevo Copiloto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos del copiloto...</div>
          ) : (
            <form id="copilot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    {...register('name')}
                    placeholder="Nombre completo"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...register('email')}
                    placeholder="Email de contacto"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" optional>Biografía</Label>
                <textarea 
                  id="bio"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('bio')}
                  placeholder="Breve biografía profesional"
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidades</Label>
                  <Input 
                    id="specialty" 
                    {...register('specialty')}
                    placeholder="frontend, ux/ui, react (separados por comas)"
                  />
                  {errors.specialty && (
                    <p className="text-sm text-red-500">{errors.specialty.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarifa por Hora (€)</Label>
                  <Input 
                    id="hourly_rate" 
                    type="number"
                    min="0"
                    step="5"
                    {...register('hourly_rate')}
                    placeholder="Tarifa en Euros"
                  />
                  {errors.hourly_rate && (
                    <p className="text-sm text-red-500">{errors.hourly_rate.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="availability">Estado</Label>
                  <Select 
                    id="availability" 
                    {...register('availability')}
                  >
                    <SelectOption value="available">Disponible</SelectOption>
                    <SelectOption value="busy">Ocupado</SelectOption>
                    <SelectOption value="inactive">Inactivo</SelectOption>
                  </Select>
                  {errors.availability && (
                    <p className="text-sm text-red-500">{errors.availability.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    id="role"
                    {...register('role')}
                  >
                    <SelectOption value="developer">Desarrollador</SelectOption>
                    <SelectOption value="designer">Diseñador</SelectOption>
                    <SelectOption value="project-manager">Project Manager</SelectOption>
                    <SelectOption value="analyst">Analista</SelectOption>
                    <SelectOption value="qa">QA Tester</SelectOption>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/copilots')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="copilot-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar Copiloto' : 'Crear Copiloto'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CopilotDetail;

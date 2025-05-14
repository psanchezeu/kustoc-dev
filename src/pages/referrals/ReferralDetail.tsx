import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectOption } from '../../components/ui/Select';
import { Referral } from '../../types';
import { formatDate } from '../../lib/utils';

// Esquema de validación con Zod
const referralSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'El email debe ser válido' }).optional(),
  status: z.enum(['pending', 'registered', 'converted']),
  client_id: z.string().optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

/**
 * Página de detalle de Referido para crear o editar
 */
const ReferralDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const isEditing = id !== 'new';
  const [referral, setReferral] = useState<Referral | null>(null);
  const [referralLink, setReferralLink] = useState('');

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      name: '',
      email: '',
      status: 'pending',
      client_id: '',
    },
  });

  const currentStatus = watch('status');

  useEffect(() => {
    // Cargar la lista de clientes (simulado para el MVP)
    const mockClients = [
      { id: 'CLI001', name: 'Juan Pérez (Taller Pérez S.L.)' },
      { id: 'CLI002', name: 'Ana Martínez (Clínica DentalCare)' },
      { id: 'CLI003', name: 'Carlos Rodríguez (Asesoría Fiscal CR)' },
      { id: 'CLI004', name: 'Laura Gómez (Restaurante La Buena Mesa)' },
    ];
    setClients(mockClients);

    // Si estamos editando, cargar los datos del referido existente
    if (isEditing) {
      setIsLoading(true);
      // En una implementación real, llamaríamos a la API
      // Para el MVP, simulamos la carga de datos
      setTimeout(() => {
        const mockReferral: Referral = {
          referral_id: id!,
          code: 'ELENA20',
          email: 'elena@ejemplo.com',
          name: 'Elena Martínez',
          status: 'registered',
          created_at: '2023-07-15T14:45:00Z',
        };

        setReferral(mockReferral);
        setReferralLink(`https://kustoc.com/referral/${mockReferral.code}`);

        reset({
          name: mockReferral.name || '',
          email: mockReferral.email || '',
          status: mockReferral.status,
          client_id: mockReferral.client_id || '',
        });
        
        setIsLoading(false);
      }, 800);
    } else {
      // Para una nueva referencia, generamos un código único
      const newCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setReferralLink(`https://kustoc.com/referral/${newCode}`);
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ReferralFormData) => {
    setIsLoading(true);
    
    try {
      // En una implementación real, enviaríamos los datos a la API
      // Para el MVP, simulamos una respuesta exitosa después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos del formulario:', data);
      
      // Redirigir a la lista de referidos después de guardar
      navigate('/referrals');
    } catch (error) {
      console.error('Error al guardar el referido:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
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
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Enlace de Referido' : 'Nuevo Enlace de Referido'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/referrals')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Detalles del Enlace de Referido' : 'Crear Enlace de Referido'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos del referido...</div>
          ) : (
            <div className="space-y-6">
              {(isEditing || referralLink) && (
                <div className="p-4 border rounded-md bg-muted">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Enlace de Referido</h3>
                      <div className="flex items-center space-x-2">
                        <code className="bg-background px-3 py-2 rounded text-sm font-mono w-full overflow-x-auto">
                          {referralLink}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyReferralLink}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                    
                    {isEditing && referral && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="block text-muted-foreground">Código:</span>
                          <span>{referral.code}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Fecha de Creación:</span>
                          <span>{formatDate(referral.created_at)}</span>
                        </div>
                        {referral.converted_at && (
                          <div>
                            <span className="block text-muted-foreground">Fecha de Conversión:</span>
                            <span>{formatDate(referral.converted_at)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <form id="referral-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" optional>Nombre</Label>
                    <Input 
                      id="name" 
                      {...register('name')}
                      placeholder="Nombre de la persona referida"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" optional>Email</Label>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select 
                      id="status" 
                      {...register('status')}
                    >
                      <SelectOption value="pending">Pendiente</SelectOption>
                      <SelectOption value="registered">Registrado</SelectOption>
                      <SelectOption value="converted">Convertido</SelectOption>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status.message}</p>
                    )}
                  </div>
                  
                  {currentStatus === 'converted' && (
                    <div className="space-y-2">
                      <Label htmlFor="client_id">Cliente Convertido</Label>
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
                  )}
                </div>
              </form>
            </div>
          )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/referrals')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="referral-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar Referido' : 'Crear Referido'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ReferralDetail;

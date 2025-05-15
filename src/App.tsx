import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/clients/Clients';
import ClientDetailNew from './pages/clients/ClientDetailNew';
import Jumps from './pages/jumps/Jumps';
import JumpDetailNew from './pages/jumps/JumpDetailNew';
import Invoices from './pages/invoices/Invoices';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import ApiKeys from './pages/api-keys/ApiKeys';
import ApiKeyDetail from './pages/api-keys/ApiKeyDetail';
import Referrals from './pages/referrals/Referrals';
import ReferralDetail from './pages/referrals/ReferralDetail';
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import Copilots from './pages/copilots/Copilots';
import CopilotDetail from './pages/copilots/CopilotDetail';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            
            {/* Clientes */}
            <Route path="clients">
              <Route index element={<Clients />} />
              <Route path="new" element={<ClientDetailNew />} />
              <Route path=":id" element={<ClientDetailNew />} />
            </Route>
            
            {/* Jumps */}
            <Route path="jumps">
              <Route index element={<Jumps />} />
              <Route path="new" element={<JumpDetailNew />} />
              <Route path=":id" element={<JumpDetailNew />} />
            </Route>
            
            {/* Facturas */}
            <Route path="invoices">
              <Route index element={<Invoices />} />
              <Route path="new" element={<InvoiceDetail />} />
              <Route path=":id" element={<InvoiceDetail />} />
            </Route>
            
            {/* Claves API */}
            <Route path="api-keys">
              <Route index element={<ApiKeys />} />
              <Route path="new" element={<ApiKeyDetail />} />
              <Route path=":id" element={<ApiKeyDetail />} />
            </Route>
            
            {/* Enlaces de Referidos */}
            <Route path="referrals">
              <Route index element={<Referrals />} />
              <Route path="new" element={<ReferralDetail />} />
              <Route path=":id" element={<ReferralDetail />} />
            </Route>
            
            {/* Proyectos */}
            <Route path="projects">
              <Route index element={<Projects />} />
              <Route path="new" element={<ProjectDetail />} />
              <Route path=":id" element={<ProjectDetail />} />
            </Route>
            
            {/* Copilotos */}
            <Route path="copilots">
              <Route index element={<Copilots />} />
              <Route path="new" element={<CopilotDetail />} />
              <Route path=":id" element={<CopilotDetail />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

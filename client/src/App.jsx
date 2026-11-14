import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadDetail from './pages/LeadDetail.jsx';

function ProtectedRoute({ children }) {
  const token = useStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const darkMode = useStore(s => s.darkMode);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a24', color: '#f8fafc', border: '1px solid #2a2a3a' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a24' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a24' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Pockets from './pages/Pockets';
import Categories from './pages/Categories';
import Admin from './pages/Admin';
import { ModalProvider } from './context/ModalContext';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <HashRouter>
          <Routes>
            {/* ─── Public ─── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ─── Protected (with Layout) ─── */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/pockets" element={<Pockets />} />
              <Route path="/categories" element={<Categories />} />
              
              {/* ─── Admin Only ─── */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* ─── Fallback ─── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;

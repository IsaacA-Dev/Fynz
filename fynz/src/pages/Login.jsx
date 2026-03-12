import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.registered) {
            setSuccess('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
            // Limpiar el estado para que no aparezca el mensaje si refresca
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center gradient-primary p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">💰 Fynz</h1>
                    <p className="text-white/70">Tu calculadora inteligente de gastos</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

                    {success && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm animate-slide-up">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 gradient-primary text-white font-semibold
                rounded-xl shadow-lg shadow-fynz-500/30
                hover:shadow-xl hover:shadow-fynz-500/40
                hover:-translate-y-0.5
                active:translate-y-0
                transition-all duration-200 text-sm
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Ingresando...
                                </span>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-fynz-500 font-semibold hover:text-fynz-600 transition-colors">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

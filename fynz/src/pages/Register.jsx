import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await register(form.email, form.username, form.password);
            navigate('/login', { state: { registered: true } });
        } catch (err) {
            // Render a veces corta la conexión o da error de CORS incluso si creó el usuario.
            // Si es 'Failed to fetch', asumimos que el usuario pudo haberse creado y vamos a login.
            if (err.message === 'Failed to fetch') {
                navigate('/login', { state: { registered: true } });
            } else {
                setError(err.message || 'Error al registrarse');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">💰 Fynz</h1>
                    <p className="text-white/70">Crea tu cuenta y toma el control</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Cuenta</h2>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="reg-username" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Nombre de usuario
                            </label>
                            <input
                                id="reg-username"
                                type="text"
                                required
                                minLength={3}
                                maxLength={20}
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="isaac"
                            />
                        </div>

                        <div>
                            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="reg-email"
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
                            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                required
                                minLength={8}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>

                        <div>
                            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-600 mb-1.5">
                                Confirmar contraseña
                            </label>
                            <input
                                id="reg-confirm"
                                type="password"
                                required
                                value={form.confirm}
                                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="Repite tu contraseña"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 gradient-primary text-white font-semibold
                rounded-xl shadow-lg shadow-fynz-500/30
                hover:shadow-xl hover:shadow-fynz-500/40
                hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200 text-sm
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creando cuenta...
                                </span>
                            ) : (
                                'Crear cuenta'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-fynz-500 font-semibold hover:text-fynz-600 transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

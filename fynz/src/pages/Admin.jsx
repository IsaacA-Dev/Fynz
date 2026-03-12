import { useState, useEffect } from 'react';
import { admin } from '../api/client';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await admin.users.list();
            setUsers(res.data);
            setError(null);
        } catch (err) {
            setError('Error al cargar usuarios');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        setActionLoading(userId);
        try {
            await admin.users.updateRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Error al actualizar rol');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) return;

        setActionLoading(userId);
        try {
            await admin.users.remove(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Error al eliminar usuario');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-fynz-100 border-t-fynz-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        🛡️ Panel de Administración
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de usuarios y permisos del sistema.</p>
                </div>
                <div className="bg-fynz-50 px-4 py-2 rounded-xl border border-fynz-100">
                    <span className="text-fynz-700 font-semibold text-lg">{users.length}</span>
                    <span className="text-fynz-600 text-sm ml-2">Usuarios registrados</span>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-fynz-100 text-fynz-600 flex items-center justify-center font-bold text-xs">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`
                                            px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                                            ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                disabled={actionLoading === u.id}
                                                onClick={() => handleUpdateRole(u.id, u.role)}
                                                className={`
                                                    p-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50
                                                    ${u.role === 'admin' 
                                                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                                                        : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'}
                                                `}
                                                title={u.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                                            >
                                                🛡️
                                            </button>
                                            <button
                                                disabled={actionLoading === u.id}
                                                onClick={() => handleDeleteUser(u.id, u.username)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                                title="Eliminar usuario"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-gray-400">No hay usuarios registrados en el sistema.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

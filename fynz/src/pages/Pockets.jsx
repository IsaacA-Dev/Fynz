import { useState, useEffect } from 'react';
import { pockets as pkApi } from '../api/client';

export default function Pockets() {
    const [pocketsList, setPocketsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', target_amount: '', color: '#667eea', icon: '💰' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    const icons = ['💰', '🏖️', '🛡️', '🚗', '🎓', '🏠', '💍', '📱', '🎮', '✈️', '🍕', '🏥', '👶', '🎁'];

    useEffect(() => {
        loadPockets();
    }, []);

    const loadPockets = async () => {
        try {
            const res = await pkApi.list();
            setPocketsList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', target_amount: '', color: '#667eea', icon: '💰' });
        setShowForm(true);
    };

    const openEdit = (pocket) => {
        setEditingId(pocket.id);
        setFormData({
            name: pocket.name,
            target_amount: pocket.target_amount?.toString() || '',
            color: pocket.color || '#667eea',
            icon: pocket.icon || '💰',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const body = {
                name: formData.name,
                icon: formData.icon,
                color: formData.color,
                ...(formData.target_amount && { target_amount: parseFloat(formData.target_amount) }),
            };
            if (editingId) {
                await pkApi.update(editingId, body);
                setMsg({ type: 'success', text: 'Bolsillo actualizado ✓' });
            } else {
                await pkApi.create(body);
                setMsg({ type: 'success', text: 'Bolsillo creado ✓' });
            }
            setShowForm(false);
            setEditingId(null);
            loadPockets();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar este bolsillo?')) return;

        try {
            await pkApi.remove(id);
            setMsg({ type: 'success', text: 'Bolsillo eliminado' });
            loadPockets();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        }
    };

    const fmt = (n) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-fynz-200 border-t-fynz-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">🏦 Bolsillos</h1>
                    <p className="text-gray-500 mt-1 text-sm">Organiza tu dinero por metas de ahorro</p>
                </div>
                <button
                    onClick={showForm ? () => setShowForm(false) : openCreate}
                    className="gradient-primary text-white px-5 py-2.5 rounded-xl
            font-semibold text-sm hover:shadow-lg hover:shadow-fynz-500/30
            hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-200 cursor-pointer flex items-center gap-2 self-start"
                >
                    {showForm ? '✕ Cerrar' : '＋ Nuevo bolsillo'}
                </button>
            </div>

            {/* ─── Messages ─── */}
            {msg && (
                <div
                    className={`px-4 py-3 rounded-xl text-sm animate-slide-up ${msg.type === 'success'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border border-red-200 text-red-600'
                        }`}
                >
                    {msg.text}
                </div>
            )}

            {/* ─── Form ─── */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-scale-in space-y-4"
                >
                    <h3 className="font-bold text-gray-800">
                        {editingId ? 'Editar bolsillo' : 'Crear bolsillo'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre *</label>
                            <input
                                type="text"
                                required
                                maxLength={50}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="Ej: Vacaciones"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Meta de ahorro</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.target_amount}
                                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="25000.00"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                                />
                                <span className="text-sm text-gray-500">{formData.color}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ícono</label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map((ico) => (
                                    <button
                                        key={ico}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: ico })}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${formData.icon === ico
                                                ? 'bg-fynz-100 ring-2 ring-fynz-500 scale-110'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                    >
                                        {ico}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm
              hover:shadow-lg hover:shadow-fynz-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 cursor-pointer"
                    >
                        {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear bolsillo'}
                    </button>
                </form>
            )}

            {/* ─── Pockets Grid ─── */}
            {pocketsList.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 animate-slide-up">
                    <p className="text-4xl mb-3">🏦</p>
                    <p className="text-gray-500 font-medium">No tienes bolsillos aún</p>
                    <p className="text-gray-400 text-sm mt-1">Crea uno para organizar tus ahorros</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                    {pocketsList.map((pocket) => {
                        const progress = pocket.progress || 0;
                        return (
                            <div
                                key={pocket.id}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100
                  hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: pocket.color + '15' }}
                                        >
                                            {pocket.icon || '💰'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{pocket.name}</p>
                                            <p className="text-xs text-gray-400">
                                                Meta: {pocket.target_amount ? fmt(pocket.target_amount) : 'Sin meta'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(pocket)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-fynz-500 active:text-fynz-600 hover:bg-fynz-50 active:bg-fynz-100 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                                            title="Editar"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pocket.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 active:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                                            title="Eliminar"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Amount */}
                                <p className="text-2xl font-bold mb-3" style={{ color: pocket.color || '#667eea' }}>
                                    {fmt(pocket.current_amount)}
                                </p>

                                {/* Progress */}
                                {pocket.target_amount > 0 && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-gray-400">Progreso</span>
                                            <span className="font-bold" style={{ color: pocket.color || '#667eea' }}>
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${Math.min(progress, 100)}%`,
                                                    backgroundColor: pocket.color || '#667eea',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

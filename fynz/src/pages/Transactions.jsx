import { useState, useEffect } from 'react';
import { transactions as txApi, categories as catApi, pockets as pkApi } from '../api/client';
import { useModal } from '../context/ModalContext';

export default function Transactions() {
    const [txList, setTxList] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
    const [categoriesList, setCategoriesList] = useState([]);
    const [pocketsList, setPocketsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', category_id: '', pocket_id: '' });
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: '', description: '', type: 'expense', category_id: '', pocket_id: '', date: '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const { confirm } = useModal();

    useEffect(() => {
        loadSupport();
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [filters, pagination.offset]);

    const loadSupport = async () => {
        try {
            const [catRes, pkRes] = await Promise.all([catApi.list(), pkApi.list()]);
            setCategoriesList(catRes.data);
            setPocketsList(pkRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const res = await txApi.list({
                ...filters,
                limit: pagination.limit,
                offset: pagination.offset,
            });
            setTxList(res.data);
            if (res.pagination) setPagination((p) => ({ ...p, total: res.pagination.total }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        const ok = await confirm({
            title: 'Guardar Transacción',
            message: '¿Estás seguro de que deseas registrar este movimiento?',
            type: 'info',
            confirmText: 'Registrar',
        });
        if (!ok) return;

        setSaving(true);
        setMsg(null);
        try {
            const body = {
                amount: parseFloat(formData.amount),
                type: formData.type,
                ...(formData.description && { description: formData.description }),
                ...(formData.category_id && { category_id: parseInt(formData.category_id) }),
                ...(formData.type === 'transfer' && formData.pocket_id && {
                    pocket_id: parseInt(formData.pocket_id),
                }),
                ...(formData.date && { date: new Date(formData.date).toISOString() }),
            };
            await txApi.create(body);
            setMsg({ type: 'success', text: 'Transacción registrada ✓' });
            setFormData({ amount: '', description: '', type: 'expense', category_id: '', pocket_id: '', date: '' });
            setShowForm(false);
            loadTransactions();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: 'Eliminar Transacción',
            message: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción es irreversible.',
            type: 'danger',
            confirmText: 'Eliminar',
        });
        if (!ok) return;

        try {
            await txApi.remove(id);
            loadTransactions();
            setMsg({ type: 'success', text: 'Transacción eliminada' });
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        }
    };

    const fmt = (n) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    const fmtDate = (d) =>
        new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

    const typeConfig = {
        income: { label: 'Ingreso', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '📈', sign: '+' },
        expense: { label: 'Gasto', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: '📉', sign: '-' },
        transfer: { label: 'Transferencia', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔄', sign: '-' },
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">💸 Transacciones</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {pagination.total} movimientos registrados
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="gradient-primary text-white px-5 py-2.5 rounded-xl
            font-semibold text-sm hover:shadow-lg hover:shadow-fynz-500/30
            hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-200 cursor-pointer flex items-center gap-2 self-start"
                >
                    {showForm ? '✕ Cerrar' : '＋ Nueva transacción'}
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
                    onSubmit={handleCreate}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-scale-in space-y-4"
                >
                    <h3 className="font-bold text-gray-800">Registrar movimiento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo *</label>
                            <div className="flex gap-2">
                                {['income', 'expense', 'transfer'].map((t) => {
                                    const cfg = typeConfig[t];
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t })}
                                            className={`flex-1 py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold border-2 transition-all cursor-pointer ${formData.type === t
                                                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="hidden sm:inline">{cfg.icon} </span>{cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Monto *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Descripción</label>
                            <input
                                type="text"
                                maxLength={200}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="Ej: Pizza con amigos"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Categoría</label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm cursor-pointer"
                            >
                                <option value="">Sin categoría</option>
                                {categoriesList.map((c) => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Pocket (only for transfers) */}
                        {formData.type === 'transfer' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Bolsillo destino *</label>
                                <select
                                    required
                                    value={formData.pocket_id}
                                    onChange={(e) => setFormData({ ...formData, pocket_id: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                    focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                    outline-none transition-all text-sm cursor-pointer"
                                >
                                    <option value="">Selecciona bolsillo</option>
                                    {pocketsList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Fecha (opcional)</label>
                            <input
                                type="datetime-local"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                            />
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
                        {saving ? 'Guardando...' : 'Guardar transacción'}
                    </button>
                </form>
            )}

            {/* ─── Filters ─── */}
            <div className="flex flex-wrap gap-3 animate-slide-up">
                <select
                    value={filters.type}
                    onChange={(e) => {
                        setFilters({ ...filters, type: e.target.value });
                        setPagination((p) => ({ ...p, offset: 0 }));
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm bg-white
            focus:border-fynz-500 outline-none transition-all cursor-pointer"
                >
                    <option value="">Todos los tipos</option>
                    <option value="income">📈 Ingresos</option>
                    <option value="expense">📉 Gastos</option>
                    <option value="transfer">🔄 Transferencias</option>
                </select>

                <select
                    value={filters.category_id}
                    onChange={(e) => {
                        setFilters({ ...filters, category_id: e.target.value });
                        setPagination((p) => ({ ...p, offset: 0 }));
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm bg-white
            focus:border-fynz-500 outline-none transition-all cursor-pointer"
                >
                    <option value="">Todas las categorías</option>
                    {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            {/* ─── List ─── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-fynz-200 border-t-fynz-500 rounded-full animate-spin" />
                    </div>
                ) : txList.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">💸</p>
                        <p className="text-gray-400 text-sm">No hay transacciones</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {txList.map((tx) => {
                            const cfg = typeConfig[tx.type] || typeConfig.expense;
                            const cat = categoriesList.find((c) => c.id === tx.category_id);
                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-gray-50/50 transition-colors group"
                                >
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${cfg.bg} flex items-center justify-center text-base sm:text-lg shrink-0`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {tx.description || 'Sin descripción'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-xs text-gray-400">{fmtDate(tx.date || tx.created_at)}</span>
                                            {cat && (
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                    style={{ backgroundColor: cat.color + '15', color: cat.color }}
                                                >
                                                    {cat.icon} {cat.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${cfg.color} whitespace-nowrap`}>
                                        {cfg.sign}{fmt(tx.amount)}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(tx.id)}
                                        className="sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-lg
                      text-gray-400 hover:text-red-500 active:text-red-600 hover:bg-red-50 active:bg-red-100
                      transition-all duration-200 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                                        title="Eliminar"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 animate-slide-up pb-2">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setPagination((p) => ({ ...p, offset: p.offset - p.limit }))}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium
              hover:border-fynz-500 hover:text-fynz-500 active:bg-fynz-50 disabled:opacity-40
              transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
                    >
                        ← Anterior
                    </button>
                    <span className="text-sm text-gray-500 px-2 sm:px-3">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setPagination((p) => ({ ...p, offset: p.offset + p.limit }))}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium
              hover:border-fynz-500 hover:text-fynz-500 active:bg-fynz-50 disabled:opacity-40
              transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}

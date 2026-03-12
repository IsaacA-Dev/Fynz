import { categories as catApi } from '../api/client';
import { useModal } from '../context/ModalContext';

export default function Categories() {
    const [categoriesList, setCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: '', color: '#667eea' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const { confirm } = useModal();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await catApi.list();
            setCategoriesList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({ name: '', icon: '', color: '#667eea' });
        setShowForm(true);
    };

    const openEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({ name: cat.name, icon: cat.icon || '', color: cat.color || '#667eea' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const ok = await confirm({
            title: editingId ? 'Actualizar Categoría' : 'Crear Categoría',
            message: editingId 
                ? '¿Confirmas los cambios en esta categoría?' 
                : '¿Deseas crear esta nueva categoría para tus gastos?',
            type: 'info',
            confirmText: editingId ? 'Actualizar' : 'Crear',
        });
        if (!ok) return;

        setSaving(true);
        setMsg(null);
        try {
            const body = {
                name: formData.name,
                ...(formData.icon && { icon: formData.icon }),
                ...(formData.color && { color: formData.color }),
            };
            if (editingId) {
                await catApi.update(editingId, body);
                setMsg({ type: 'success', text: 'Categoría actualizada ✓' });
            } else {
                await catApi.create(body);
                setMsg({ type: 'success', text: 'Categoría creada ✓' });
            }
            setShowForm(false);
            setEditingId(null);
            loadCategories();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: 'Eliminar Categoría',
            message: '¿Estás seguro de que deseas eliminar esta categoría? Se desvinculará de tus transacciones.',
            type: 'danger',
            confirmText: 'Eliminar',
        });
        if (!ok) return;

        try {
            await catApi.remove(id);
            setMsg({ type: 'success', text: 'Categoría eliminada' });
            loadCategories();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        }
    };

    const systemCats = categoriesList.filter((c) => c.is_default === true || c.is_default === 1);
    const customCats = categoriesList.filter((c) => c.is_default === false || c.is_default === 0);

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
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">🏷️ Categorías</h1>
                    <p className="text-gray-500 mt-1 text-sm">Clasifica tus transacciones</p>
                </div>
                <button
                    onClick={showForm ? () => setShowForm(false) : openCreate}
                    className="gradient-primary text-white px-5 py-2.5 rounded-xl
            font-semibold text-sm hover:shadow-lg hover:shadow-fynz-500/30
            hover:-translate-y-0.5 active:translate-y-0
            transition-all duration-200 cursor-pointer flex items-center gap-2 self-start"
                >
                    {showForm ? '✕ Cerrar' : '＋ Nueva categoría'}
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
                        {editingId ? 'Editar categoría' : 'Crear categoría'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                placeholder="Ej: Suscripciones"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ícono (emoji)</label>
                            <input
                                type="text"
                                maxLength={10}
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200
                  focus:border-fynz-500 focus:ring-4 focus:ring-fynz-100
                  outline-none transition-all text-sm"
                                placeholder="📺"
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
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm
              hover:shadow-lg hover:shadow-fynz-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 cursor-pointer"
                    >
                        {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear categoría'}
                    </button>
                </form>
            )}

            {/* ─── System Categories ─── */}
            {systemCats.length > 0 && (
                <div className="animate-slide-up">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Del sistema ({systemCats.length})
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {systemCats.map((cat) => (
                            <div
                                key={cat.id}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100
                  flex flex-col items-center text-center gap-2"
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                    style={{ backgroundColor: cat.color + '15' }}
                                >
                                    {cat.icon || '📁'}
                                </div>
                                <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                                <div className="w-4 h-1 rounded-full" style={{ backgroundColor: cat.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Custom Categories ─── */}
            <div className="animate-slide-up">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Personalizadas ({customCats.length})
                </h2>
                {customCats.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-sm">No tienes categorías personalizadas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {customCats.map((cat) => (
                            <div
                                key={cat.id}
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100
                  flex flex-col items-center text-center gap-2 group relative"
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                    style={{ backgroundColor: cat.color + '15' }}
                                >
                                    {cat.icon || '📁'}
                                </div>
                                <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                                <div className="w-4 h-1 rounded-full" style={{ backgroundColor: cat.color }} />

                                {/* Actions */}
                                <div className="absolute top-1.5 right-1.5 flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(cat)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-fynz-500 active:text-fynz-600 hover:bg-fynz-50 active:bg-fynz-100 transition-all cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 active:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

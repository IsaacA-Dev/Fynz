import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transactions, pockets as pocketsApi } from '../api/client';

export default function Dashboard() {
  const { user, refreshProfile } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [pocketsList, setPocketsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sumRes, txRes, pkRes] = await Promise.all([
        transactions.summary(),
        transactions.list({ limit: 5 }),
        pocketsApi.list(),
      ]);
      setSummary(sumRes.data);
      setRecentTx(txRes.data);
      setPocketsList(pkRes.data);
      refreshProfile();
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

  const typeConfig = {
    income: { label: 'Ingreso', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '📈', sign: '+' },
    expense: { label: 'Gasto', color: 'text-red-500', bg: 'bg-red-50', icon: '📉', sign: '-' },
    transfer: { label: 'Transferencia', color: 'text-blue-500', bg: 'bg-blue-50', icon: '🔄', sign: '-' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-fynz-200 border-t-fynz-500 animate-spin" />
          <p className="text-fynz-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
          Hola, <span className="text-gradient">{user?.username || 'Usuario'}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen de tus finanzas</p>
      </div>

      {/* ─── Balance Card ─── */}
      <div className="gradient-primary rounded-2xl p-5 lg:p-8 text-white shadow-xl shadow-fynz-500/20 animate-slide-up">
        <p className="text-white/70 text-sm font-medium">Balance General</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 tracking-tight">{fmt(summary?.balance)}</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 sm:mt-6">
          <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <p className="text-white/60 text-[10px] sm:text-xs">Ingresos</p>
            <p className="text-sm sm:text-lg font-bold mt-0.5 truncate">{fmt(summary?.income)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <p className="text-white/60 text-[10px] sm:text-xs">Gastos</p>
            <p className="text-sm sm:text-lg font-bold mt-0.5 truncate">{fmt(summary?.expense)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 text-center">
            <p className="text-white/60 text-[10px] sm:text-xs">Transferido</p>
            <p className="text-sm sm:text-lg font-bold mt-0.5 truncate">{fmt(summary?.transfer)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Gastos por Categoría ─── */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base lg:text-lg font-bold text-gray-800">Gastos por Categoría</h2>
            <span className="text-xs text-gray-400">Top categorías</span>
          </div>
          {summary?.expenses_by_category?.length > 0 ? (
            <div className="space-y-3">
              {summary.expenses_by_category.map((cat, i) => {
                const max = summary.expenses_by_category[0]?.total || 1;
                const pct = Math.round((cat.total / max) * 100);
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.category_icon || '📁'}</span>
                        <span className="text-sm font-medium text-gray-700">
                          {cat.category_name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{fmt(cat.total)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.category_color || '#667eea',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              No hay gastos registrados aún
            </p>
          )}
        </div>

        {/* ─── Transacciones Recientes ─── */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base lg:text-lg font-bold text-gray-800">Movimientos Recientes</h2>
            <Link
              to="/transactions"
              className="text-xs text-fynz-500 font-semibold hover:text-fynz-600 transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          {recentTx.length > 0 ? (
            <div className="space-y-2">
              {recentTx.map((tx) => {
                const cfg = typeConfig[tx.type] || typeConfig.expense;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-lg shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.description || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-gray-400">{fmtDate(tx.date || tx.created_at)}</p>
                    </div>
                    <span className={`text-sm font-bold ${cfg.color} whitespace-nowrap`}>
                      {cfg.sign}{fmt(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              Sin movimientos aún
            </p>
          )}
        </div>
      </div>

      {/* ─── Bolsillos ─── */}
      {pocketsList.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Mis Bolsillos</h2>
            <Link
              to="/pockets"
              className="text-xs text-fynz-500 font-semibold hover:text-fynz-600 transition-colors"
            >
              Administrar →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pocketsList.slice(0, 3).map((pocket) => {
              const progress = pocket.progress || 0;
              return (
                <div
                  key={pocket.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{pocket.icon || '💰'}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{pocket.name}</p>
                      <p className="text-xs text-gray-400">Meta: {fmt(pocket.target_amount)}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{fmt(pocket.current_amount)}</span>
                      <span className="font-semibold" style={{ color: pocket.color || '#667eea' }}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: pocket.color || '#667eea',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
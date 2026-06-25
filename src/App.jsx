import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [peticiones, setPeticiones] = useState([]);
  const [nuevaPeticion, setNuevaPeticion] = useState('');
  const [categoria, setCategoria] = useState('Espiritual');
  const [esAnonima, setEsAnonima] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  // --- NUEVOS ESTADOS DE LA FASE 4 (FILTROS Y BUSQUEDA) ---
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  // --- EFECTOS Y SUSCRIPCIÓN EN TIEMPO REAL ---
  useEffect(() => {
    // 1. Carga inicial de datos
    cargarPeticiones();

    // 2. Suscripción al Canal en Tiempo Real de Supabase
    const canalRealtime = supabase
      .channel('cambios-en-altares')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'peticiones' },
        (payload) => {
          console.log('Cambio detectado en la nube en tiempo real:', payload);
          // Recarga la lista automáticamente para todos los usuarios conectados
          cargarPeticiones();
        }
      )
      .subscribe();

    // Limpieza del canal cuando el usuario cierra la app
    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  // --- FUNCIONES ASÍNCRONAS ---

  // Leer desde Supabase
  const cargarPeticiones = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('peticiones')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      setPeticiones(data || []);
    } catch (err) {
      console.error("Error cargando peticiones:", err.message);
    } finally {
      setCargando(false);
    }
  };

  // Guardar en Supabase
  const guardarNuevaPeticion = async (e) => {
    e.preventDefault();
    if (!nuevaPeticion.trim()) return;

    try {
      const { error } = await supabase
        .from('peticiones')
        .insert([
          {
            texto: nuevaPeticion,
            categoria: categoria,
            es_anonima: esAnonima,
            nombre_usuario: esAnonima ? 'Anónimo' : 'Hermano USB',
            contador_oraciones: 0
          }
        ])
        .select();

      if (error) throw error;
      setNuevaPeticion('');
      setEsAnonima(false);
    } catch (err) {
      console.error("Error guardando petición:", err.message);
    }
  };

  // Reaccionar / Interceder ("Amén")
  const registrarIntercesion = async (peticionId, contadorActual) => {
    try {
      const { error } = await supabase
        .from('peticiones')
        .update({ contador_oraciones: (contadorActual || 0) + 1 })
        .eq('id', peticionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error al registrar oración:", err.message);
    }
  };

  // --- LÓGICA DE FILTRADO EN MEMORIA ---
  const peticionesFiltradas = peticiones.filter((peticion) => {
    const coincideBusqueda = peticion.texto.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaActiva === 'Todas' || peticion.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Encabezado */}
      <header className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>🙏</span> ACUSBprays
            </h1>
            <p className="text-cyan-100 text-xs sm:text-sm font-medium mt-0.5">
              Red de Intercesión Universitaria • USB
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm animate-pulse">
            🟢 Conectado en Tiempo Real
          </div>
        </div>
      </header>

      {/* Barra de Filtros y Búsqueda Global */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Input de Búsqueda */}
          <div className="w-full md:w-72 relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar peticiones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
            />
          </div>

          {/* Botones de Filtro */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {['Todas', 'Estudios', 'Salud', 'Familia', 'Espiritual'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  categoriaActiva === cat
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'Todas' ? '🌍 Todas' : cat === 'Estudios' ? '📚 Estudios' : cat === 'Salud' ? '🏥 Salud' : cat === 'Familia' ? '🏠 Familia' : '🌱 Espiritual'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Formulario Lateral */}
        <section className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>✍️</span> Levantar Petición
            </h2>
            
            <form onSubmit={guardarNuevaPeticion} className="space-y-4">
              <div>
                <textarea
                  value={nuevaPeticion}
                  onChange={(e) => setNuevaPeticion(e.target.value)}
                  placeholder="¿Por qué nos unimos a orar hoy? Describe tu motivo..."
                  rows="4"
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                >
                  <option value="Estudios">📚 Estudios / Exámenes</option>
                  <option value="Salud">🏥 Salud / Bienestar</option>
                  <option value="Familia">🏠 Familia / Hogar</option>
                  <option value="Espiritual">🌱 Crecimiento Espiritual</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">🕵️ ¿Publicar en Anónimo?</span>
                <input
                  type="checkbox"
                  checked={esAnonima}
                  onChange={(e) => setEsAnonima(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                🚀 Enviar al Altar
              </button>
            </form>
          </div>
        </section>

        {/* Listado de Clamor */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">🔥 Clamor Activo</span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold">
              {peticionesFiltradas.length} visibles
            </span>
          </h2>

          {cargando && peticiones.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 text-slate-400 text-xs">
              🔄 Sincronizando con el Altar Celestial...
            </div>
          ) : peticionesFiltradas.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <span className="text-xl block mb-2">🕊️</span> No se encontraron peticiones coincidentes.
            </div>
          ) : (
            <div className="space-y-4">
              {peticionesFiltradas.map((peticion) => (
                <article 
                  key={peticion.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 animate-fadeIn"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        👤 {peticion.nombre_usuario}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        peticion.categoria === 'Estudios' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        peticion.categoria === 'Salud' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        peticion.categoria === 'Familia' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {peticion.categoria}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {peticion.texto}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ⏱️ {peticion.creado_en ? new Date(peticion.creado_en).toLocaleDateString() : 'Reciente'}
                    </span>
                    <button
                      onClick={() => registrarIntercesion(peticion.id, peticion.contador_oraciones)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-700 text-[11px] font-bold rounded-xl transition-colors group"
                    >
                      <span className="group-hover:scale-125 transition-transform block">🛐</span>
                      Amén, me uno en oración
                      <span className="bg-cyan-700 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-0.5 font-black">
                        {peticion.contador_oraciones || 0}
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
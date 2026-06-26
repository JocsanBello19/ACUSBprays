import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [peticiones, setPeticiones] = useState([]);
  const [nuevaPeticion, setNuevaPeticion] = useState('');
  const [categoria, setCategoria] = useState('Espiritual');
  const [esAnonima, setEsAnonima] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

  // --- LOGICA DE BASE DE DATOS ---
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
      console.error("Error cargando:", err.message);
    } finally {
      setCargando(false);
    }
  };

  const guardarNuevaPeticion = async (e) => {
    e.preventDefault();
    if (!nuevaPeticion.trim()) return;

    try {
      const { error } = await supabase.from('peticiones').insert([{
        texto: nuevaPeticion,
        categoria: categoria,
        es_anonima: esAnonima,
        nombre_usuario: esAnonima ? 'Anónimo' : 'Hermano USB',
        contador_oraciones: 0
      }]);

      if (error) throw error;
      setNuevaPeticion('');
      setEsAnonima(false);
    } catch (err) {
      console.error("Error guardando:", err.message);
    }
  };

  const registrarIntercesion = async (peticionId, contadorActual) => {
    try {
      const { error } = await supabase
        .from('peticiones')
        .update({ contador_oraciones: (contadorActual || 0) + 1 })
        .eq('id', peticionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error al orar:", err.message);
    }
  };

  // --- EFECTOS EN TIEMPO REAL ---
  useEffect(() => {
    cargarPeticiones();
    const canalRealtime = supabase
      .channel('cambios-en-altares')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peticiones' }, () => {
        cargarPeticiones();
      })
      .subscribe();

    return () => supabase.removeChannel(canalRealtime);
  }, []);

  // --- RENDIMIENTO TOP: Filtro Memorizado ---
  const peticionesFiltradas = useMemo(() => {
    return peticiones.filter((peticion) => {
      const textoSeguro = peticion.texto ? peticion.texto.toLowerCase() : '';
      const busquedaSegura = busqueda ? busqueda.toLowerCase() : '';
      const categoriaSegura = peticion.categoria || '';
      return textoSeguro.includes(busquedaSegura) && 
             (categoriaActiva === 'Todas' || categoriaSegura === categoriaActiva);
    });
  }, [peticiones, busqueda, categoriaActiva]);

  // --- DICCIONARIO DE COLORES POR CATEGORÍA ---
  // Mantenemos colores suaves para las etiquetas para no saturar el diseño
  const colorCategoria = {
    Estudios: 'bg-blue-100/60 text-blue-800 border-blue-200',
    Salud: 'bg-rose-100/60 text-rose-800 border-rose-200',
    Familia: 'bg-purple-100/60 text-purple-800 border-purple-200',
    Espiritual: 'bg-emerald-100/60 text-emerald-800 border-emerald-200'
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#3E2723] font-sans selection:bg-[#F4D03F]/40 selection:text-[#3E2723]">
      
      {/* ENCABEZADO ACUSB (Marrón Profundo y Dorado) */}
      <header className="bg-gradient-to-r from-[#2e1d1a] via-[#3E2723] to-[#2e1d1a] text-white shadow-xl shadow-[#3E2723]/20 border-b border-[#F4D03F]/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
            {/* Espacio para el logo, usando un emoji dorado como placeholder */}
            <div className="bg-[#F4D03F] text-[#3E2723] p-2.5 rounded-full shadow-lg shadow-[#F4D03F]/20 animate-pulse">
              🐟
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center sm:justify-start drop-shadow-md">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F4D03F] to-[#f9e79f]">
                  ACUSBprays
                </span>
              </h1>
              <p className="text-[#f9e79f]/80 text-[11px] sm:text-xs font-medium mt-0.5 tracking-wider uppercase">
                Red de Intercesión • Univ. Simón Bolívar
              </p>
            </div>
          </div>
          <div className="bg-white/5 hover:bg-white/10 transition-colors cursor-default border border-[#F4D03F]/20 px-4 py-2 rounded-full text-[11px] font-bold backdrop-blur-md shadow-inner flex items-center gap-2 text-[#f9e79f]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Conexión Celestial Activa
          </div>
        </div>
      </header>

      {/* BARRA DE BÚSQUEDA Y FILTROS FLOTANTE */}
      <section className="bg-white/90 backdrop-blur-xl border-b border-[#e7e7e7] shadow-sm relative z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="w-full md:w-80 relative group">
            <span className="absolute left-4 top-2.5 sm:top-3 text-gray-400 text-sm transition-transform group-hover:scale-110">🔍</span>
            <input
              type="text"
              placeholder="Buscar peticiones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F4D03F]/60 focus:border-[#F4D03F] focus:bg-white transition-all shadow-inner text-gray-700"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none px-1">
            {['Todas', 'Estudios', 'Salud', 'Familia', 'Espiritual'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold rounded-full transition-all duration-300 transform active:scale-95 whitespace-nowrap ${
                  categoriaActiva === cat
                    ? 'bg-[#F4D03F] text-[#3E2723] shadow-md shadow-[#F4D03F]/40 scale-105 border border-[#d4ac0d]'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-[#3E2723] hover:border-[#F4D03F]/50 hover:-translate-y-0.5'
                }`}
              >
                {cat === 'Todas' ? '🌍 Todas' : cat === 'Estudios' ? '📚 Estudios' : cat === 'Salud' ? '🏥 Salud' : cat === 'Familia' ? '🏠 Familia' : '🌱 Espiritual'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
        
        {/* PANEL LATERAL: LEVANTAR PETICIÓN */}
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 lg:sticky top-32 transition-all hover:shadow-2xl hover:shadow-[#F4D03F]/10">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#3E2723] mb-6 flex items-center gap-3">
              <span className="p-2.5 bg-[#fef9e7] text-[#d4ac0d] rounded-xl">✍️</span> 
              Elevar Petición
            </h2>
            
            <form onSubmit={guardarNuevaPeticion} className="space-y-5">
              <div className="group">
                <textarea
                  value={nuevaPeticion}
                  onChange={(e) => setNuevaPeticion(e.target.value)}
                  placeholder="¿Cuál es tu necesidad hoy? Escríbela aquí con confianza..."
                  rows="4"
                  className="w-full p-4 text-sm bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4D03F]/50 focus:border-[#F4D03F] focus:bg-white transition-all resize-none group-hover:border-[#F4D03F]/40 shadow-inner text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 pl-1">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-3.5 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F4D03F]/50 focus:bg-white transition-all cursor-pointer hover:border-[#F4D03F]/40 text-gray-700"
                >
                  <option value="Estudios">📚 Estudios / Exámenes</option>
                  <option value="Salud">🏥 Salud / Bienestar</option>
                  <option value="Familia">🏠 Familia / Hogar</option>
                  <option value="Espiritual">🌱 Crecimiento Espiritual</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-gray-50/80 p-4 rounded-xl border border-gray-100 hover:bg-[#fef9e7] transition-colors cursor-pointer group" onClick={() => setEsAnonima(!esAnonima)}>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700 group-hover:text-[#3E2723]">Modo Anónimo</span>
                  <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Ocultar mi nombre real al publicar</span>
                </div>
                <input
                  type="checkbox"
                  checked={esAnonima}
                  readOnly
                  className="w-5 h-5 text-[#d4ac0d] focus:ring-[#F4D03F] border-gray-300 rounded-md cursor-pointer accent-[#d4ac0d]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-[#F4D03F] to-[#f1c40f] hover:from-[#f1c40f] hover:to-[#d4ac0d] text-[#3E2723] font-black text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg shadow-[#F4D03F]/30 hover:shadow-[#F4D03F]/50 hover:-translate-y-1 active:scale-95 active:shadow-inner flex items-center justify-center gap-2 border border-[#d4ac0d]/50"
              >
                <span>🚀</span> Enviar al Altar
              </button>
            </form>
          </div>
        </aside>

        {/* LISTADO DE PETICIONES */}
        <section className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200/80 gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#3E2723] flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🔥</span> Clamor Activo
            </h2>
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm w-max">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4ac0d] animate-pulse"></span>
              <span className="text-xs font-bold text-gray-600">
                {peticionesFiltradas.length} {peticionesFiltradas.length === 1 ? 'petición' : 'peticiones'}
              </span>
            </div>
          </div>

          {cargando && peticiones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 border-4 border-[#fef9e7] border-t-[#d4ac0d] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 text-sm font-medium">Sincronizando el altar celestial...</p>
            </div>
          ) : peticionesFiltradas.length === 0 ? (
            <div className="bg-white py-20 sm:py-32 px-8 text-center rounded-3xl border border-dashed border-gray-300 shadow-sm flex flex-col items-center">
              <span className="text-5xl sm:text-6xl block mb-4 opacity-40">🕊️</span>
              <h3 className="text-gray-600 font-bold text-lg sm:text-xl mb-2">El altar está en silencio</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">No hay peticiones que coincidan con estos filtros. ¡Sé el primero en levantar una oración hoy!</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6">
              {peticionesFiltradas.map((peticion) => (
                <article 
                  key={peticion.id} 
                  className="group bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-5 relative overflow-hidden"
                >
                  {/* Decoración de borde izquierdo dorado corporativo */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 bg-[#F4D03F]"></div>

                  <div className="pl-2 sm:pl-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-base sm:text-lg border border-gray-200 shadow-inner">
                          {peticion.es_anonima ? '🕵️' : '👤'}
                        </div>
                        <span className="text-sm sm:text-base font-bold text-[#3E2723]">
                          {peticion.nombre_usuario}
                        </span>
                      </div>
                      <span className={`text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider border ${colorCategoria[peticion.categoria] || colorCategoria.Espiritual}`}>
                        {peticion.categoria}
                      </span>
                    </div>
                    
                    <p className="text-sm sm:text-base font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {peticion.texto}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 pt-5 pl-2 sm:pl-3 gap-4">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                      <span>⏱️</span> {peticion.creado_en ? new Date(peticion.creado_en).toLocaleDateString() : 'Hace un momento'}
                    </span>
                    
                    <button
                      onClick={() => registrarIntercesion(peticion.id, peticion.contador_oraciones)}
                      className="flex items-center justify-center sm:justify-start gap-2.5 px-5 py-2.5 bg-gray-50 hover:bg-[#fef9e7] border border-gray-200 hover:border-[#F4D03F] text-gray-600 hover:text-[#3E2723] text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 group/btn shadow-sm hover:shadow-md hover:shadow-[#F4D03F]/20 w-full sm:w-auto"
                    >
                      <span className="group-hover/btn:scale-125 group-active/btn:scale-90 transition-transform block text-base">🛐</span>
                      Me uno en oración
                      <span className="bg-gray-200 group-hover/btn:bg-[#d4ac0d] group-hover/btn:text-white text-gray-700 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full transition-colors font-black">
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
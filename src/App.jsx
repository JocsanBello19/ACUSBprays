import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

// Función auxiliar para ignorar mayúsculas y acentos
const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function App() {
  const [peticiones, setPeticiones] = useState([]);
  const [nombreAutor, setNombreAutor] = useState('');
  const [nuevaPeticion, setNuevaPeticion] = useState('');
  const [categoria, setCategoria] = useState('Espiritual');
  const [esAnonima, setEsAnonima] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');

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
        nombre_usuario: esAnonima ? 'Anónimo' : (nombreAutor.trim() || 'Hermano USB'),
        contador_oraciones: 0,
        respondida: false
      }]);

      if (error) throw error;
      setNuevaPeticion('');
      setNombreAutor('');
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

  const marcarComoRespondida = async (peticionId) => {
    try {
      const { error } = await supabase
        .from('peticiones')
        .update({ respondida: true })
        .eq('id', peticionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error al marcar como respondida:", err.message);
    }
  };

  // NUEVA FUNCIÓN: Guarda el asignado en Supabase
  const actualizarAsignado = async (peticionId, nuevoAsignado) => {
    try {
      const { error } = await supabase
        .from('peticiones')
        .update({ asignado_a: nuevoAsignado })
        .eq('id', peticionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error al asignar:", err.message);
    }
  };

  // NUEVA FUNCIÓN: Actualiza el texto en pantalla mientras escribes
  const handleCambioAsignacion = (id, valor) => {
    setPeticiones(peticiones.map(p => p.id === id ? { ...p, asignado_a: valor } : p));
  };

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

  const peticionesFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarTexto(busqueda);

    return peticiones.filter((peticion) => {
      const textoNormalizado = normalizarTexto(peticion.texto);
      const nombreNormalizado = normalizarTexto(peticion.nombre_usuario);
      const categoriaSegura = peticion.categoria || '';
      
      const pasaBusqueda = textoNormalizado.includes(busquedaNormalizada) || 
                           nombreNormalizado.includes(busquedaNormalizada);

      if (categoriaActiva === 'Testimonios') {
        return pasaBusqueda && peticion.respondida === true;
      }

      return pasaBusqueda && 
             (categoriaActiva === 'Todas' || categoriaSegura === categoriaActiva);
    });
  }, [peticiones, busqueda, categoriaActiva]);

  const colorCategoria = {
    Estudios: 'bg-blue-50/90 text-blue-800 border-blue-200/60 shadow-[0_2px_10px_rgba(59,130,246,0.15)]',
    Salud: 'bg-rose-50/90 text-rose-800 border-rose-200/60 shadow-[0_2px_10px_rgba(244,63,94,0.15)]',
    Familia: 'bg-purple-50/90 text-purple-800 border-purple-200/60 shadow-[0_2px_10px_rgba(168,85,247,0.15)]',
    Espiritual: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/60 shadow-[0_2px_10px_rgba(16,185,129,0.15)]'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F5EE] via-[#F3EFE4] to-[#EAE5D8] text-[#3E2723] font-sans selection:bg-[#F4D03F]/40 selection:text-[#3E2723] flex flex-col justify-between">
      
      <div>
        {/* ENCABEZADO PREMIUM */}
        <header className="bg-gradient-to-r from-[#F4D03F] via-[#ecd059] to-[#e5c138] text-[#3E2723] shadow-[0_10px_30px_rgba(244,208,63,0.2)] border-b border-[#d4ac0d]/50 sticky top-0 z-50 transition-all">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-5">
            <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
              
              <div className="w-16 h-16 bg-black rounded-full overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-2 border-[#3E2723]/90 flex-shrink-0 flex items-center justify-center p-1.5 transition-transform hover:scale-105 hover:rotate-3 duration-500">
                <img 
                  src="/logo.png" 
                  alt="Logo ACUSB" 
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </div>

              <div className="flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter flex items-center justify-center sm:justify-start drop-shadow-sm">
                  ACUSBprays
                </h1>
                <p className="text-[#3E2723] text-[10px] sm:text-[11px] font-black mt-1 tracking-widest uppercase drop-shadow-sm">
                  Red de Intercesión • Agrupación Cristiana de la Universidad Simón Bolívar
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#3E2723] to-[#2a1a17] border border-[#F4D03F]/40 px-5 py-2.5 rounded-full text-[11px] font-black shadow-[0_8px_20px_rgba(62,39,35,0.4)] flex items-center gap-3 text-[#F4D03F] hover:shadow-[0_12px_25px_rgba(62,39,35,0.5)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </span>
              Conexión Activa
            </div>
          </div>
        </header>

        {/* BARRA DE CATEGORÍAS CENTRADA Y BUSCADOR SÓLIDO */}
        <section className="bg-gradient-to-b from-white/90 to-white/60 backdrop-blur-xl border-b border-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative z-40">
          <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col gap-5 items-center justify-center">
            
            {/* Buscador más nítido y prominente */}
            <div className="w-full max-w-xl relative group">
              <span className="absolute left-5 top-3.5 sm:top-4 text-gray-400 text-base transition-colors duration-300 group-focus-within:text-[#d4ac0d]">🔍</span>
              <input
                type="text"
                placeholder="Buscar en el altar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-12 pr-5 py-3 sm:py-3.5 text-sm sm:text-base bg-white border-2 border-gray-200/80 rounded-full focus:outline-none focus:ring-4 focus:ring-[#F4D03F]/20 focus:border-[#F4D03F]/60 transition-all duration-300 text-gray-800 shadow-[0_4px_15px_rgba(0,0,0,0.03)] placeholder-gray-400 font-semibold"
              />
            </div>

            {/* Categorías en una sola línea y centradas */}
            <div className="flex flex-row flex-nowrap overflow-x-auto w-full justify-start sm:justify-center gap-3 px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {['Todas', 'Testimonios', 'Estudios', 'Salud', 'Familia', 'Espiritual'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-black rounded-full transition-all duration-500 whitespace-nowrap border flex-shrink-0 ${
                    categoriaActiva === cat
                      ? 'bg-gradient-to-r from-[#3E2723] to-[#2a1a17] text-[#F4D03F] border-[#3E2723] shadow-[0_8px_20px_rgba(62,39,35,0.3)] scale-105'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#F4D03F]/50 hover:bg-gray-50 hover:text-[#3E2723] hover:shadow-md'
                  }`}
                >
                  {cat === 'Todas' ? '🌍 Todas' : cat === 'Testimonios' ? '✨ Testimonios' : cat === 'Estudios' ? '📚 Estudios' : cat === 'Salud' ? '🏥 Salud' : cat === 'Familia' ? '🏠 Familia' : '🌱 Espiritual'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          
          {/* FORMULARIO PREMIUM DEGRADADO */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-gradient-to-br from-white/95 via-white/80 to-white/60 backdrop-blur-xl p-7 sm:p-9 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white lg:sticky top-24 transition-all">
              <h2 className="text-xl sm:text-2xl font-black text-[#3E2723] mb-7 flex items-center gap-3 tracking-tight">
                <span className="p-3 bg-gradient-to-br from-[#fcf7e3] to-[#f4ecd8] text-[#d4ac0d] rounded-2xl shadow-[0_4px_15px_rgba(241,196,15,0.15)] border border-[#f1c40f]/30">✍️</span> 
                Elevar Petición
              </h2>
              
              <form onSubmit={guardarNuevaPeticion} className="space-y-6">
                
                {/* CAMPO DE NOMBRE */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 pl-1">
                    Tu Nombre
                  </label>
                  <input
                    type="text"
                    value={nombreAutor}
                    onChange={(e) => setNombreAutor(e.target.value)}
                    disabled={esAnonima}
                    placeholder={esAnonima ? "Modo anónimo activo" : "Ej. Juan Pérez"}
                    className={`w-full py-3.5 px-5 text-sm sm:text-base font-bold border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 shadow-inner ${
                      esAnonima 
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-white/60 border-gray-100 focus:ring-[#F4D03F]/20 focus:border-[#F4D03F]/60 text-gray-700 focus:bg-white'
                    }`}
                  />
                </div>

                <div className="relative group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 pl-1">
                    Tu Clamor
                  </label>
                  <textarea
                    value={nuevaPeticion}
                    onChange={(e) => setNuevaPeticion(e.target.value)}
                    placeholder="¿Cuál es tu petición de oración hoy? Escríbela con confianza para interceder juntos"
                    rows="4"
                    className="w-full p-5 text-sm sm:text-base bg-white/60 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F4D03F]/20 focus:border-[#F4D03F]/60 focus:bg-white transition-all duration-300 resize-none text-gray-800 font-medium placeholder-gray-400 shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2.5 pl-1">
                    Categoría del Clamor
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full py-4 px-3 sm:px-4 text-sm sm:text-base font-bold bg-white/60 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F4D03F]/20 focus:border-[#F4D03F]/60 transition-all duration-300 text-gray-700 cursor-pointer shadow-inner appearance-none focus:bg-white"
                  >
                    <option value="Estudios">📚 Estudios / Exámenes</option>
                    <option value="Salud">🏥 Salud / Bienestar</option>
                    <option value="Familia">🏠 Familia / Hogar</option>
                    <option value="Espiritual">🌱 Crecimiento Espiritual</option>
                  </select>
                </div>

                {/* MODO ANÓNIMO */}
                <div 
                  className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 py-5 px-5 rounded-2xl border-2 border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#F4D03F]/40 hover:shadow-md transition-all duration-300 group" 
                  onClick={() => setEsAnonima(!esAnonima)}
                >
                  <div className="flex flex-col pl-1">
                    <span className="text-sm sm:text-base font-black text-[#3E2723] group-hover:text-[#d4ac0d] transition-colors">Modo Anónimo</span>
                    <span className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">Ocultar mi nombre real</span>
                  </div>
                  <div className={`w-14 h-7 rounded-full transition-colors duration-300 flex items-center px-1 ${esAnonima ? 'bg-[#3E2723]' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${esAnonima ? 'translate-x-7' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                {/* BOTÓN ENVIAR */}
                <button
                  type="submit"
                  className="w-full py-5 sm:py-6 bg-gradient-to-r from-[#3E2723] via-[#4a2e29] to-[#3E2723] hover:from-[#2a1a17] hover:to-[#3a221f] text-[#F4D03F] border border-[#d4ac0d]/30 font-black text-base sm:text-lg rounded-2xl transition-all duration-500 shadow-[0_12px_25px_rgba(62,39,35,0.25)] hover:shadow-[0_20px_35px_rgba(62,39,35,0.4)] hover:-translate-y-1.5 active:scale-[0.98] active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden relative group/submit"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/submit:opacity-100 transition-opacity duration-700 -translate-x-full group-hover/submit:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="text-xl drop-shadow-md group-hover/submit:scale-110 transition-transform">🚀</span> 
                  <span className="tracking-wide">Enviar al Altar</span>
                </button>
              </form>
            </div>
          </aside>

          {/* LISTA DE PETICIONES */}
          <section className="lg:col-span-8 space-y-7 order-1 lg:order-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-5 border-b border-gray-300/60 gap-4">
              <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] flex items-center gap-3 tracking-tighter">
                <span className="drop-shadow-lg text-4xl">{categoriaActiva === 'Testimonios' ? '✨' : '🔥'}</span> 
                {categoriaActiva === 'Testimonios' ? 'Testimonios' : 'Clamor Activo'}
              </h2>
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-white/90 to-white/60 backdrop-blur-md px-5 py-3 rounded-full shadow-sm border border-white mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${categoriaActiva === 'Testimonios' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-[#d4ac0d] shadow-[0_0_8px_rgba(212,172,13,0.8)]'} animate-pulse`}></span>
                <span className="text-[11px] font-black text-[#3E2723] uppercase tracking-[0.15em]">
                  {peticionesFiltradas.length} {peticionesFiltradas.length === 1 ? 'Petición' : 'Peticiones'}
                </span>
              </div>
            </div>

            {cargando && peticiones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-white">
                <div className="w-14 h-14 border-4 border-gray-100 border-t-[#d4ac0d] rounded-full animate-spin mb-5 shadow-lg"></div>
                <p className="text-gray-500 text-xs font-black tracking-[0.2em] uppercase">Conectando al altar...</p>
              </div>
            ) : peticionesFiltradas.length === 0 ? (
              <div className="bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-md py-40 px-8 text-center rounded-[2.5rem] border-2 border-dashed border-gray-300/70 shadow-sm">
                <span className="text-7xl block mb-6 opacity-20 grayscale drop-shadow-xl">{categoriaActiva === 'Testimonios' ? '✨' : '🕊️'}</span>
                <h3 className="text-[#3E2723] font-black text-2xl mb-2 tracking-tight">
                  {categoriaActiva === 'Testimonios' ? 'Aún no hay testimonios' : 'El altar está en silencio'}
                </h3>
                <p className="text-gray-500 font-medium">
                  {categoriaActiva === 'Testimonios' ? 'Las oraciones contestadas aparecerán aquí.' : 'Sé el primero en levantar una oración hoy en esta categoría.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-7">
                {peticionesFiltradas.map((peticion) => (
                  <article 
                    key={peticion.id} 
                    className={`bg-gradient-to-br from-white/95 via-white/80 to-white/90 backdrop-blur-xl p-6 sm:p-9 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border transition-all duration-500 flex flex-col gap-5 relative overflow-hidden group ${
                      peticion.respondida 
                        ? 'border-emerald-200/50 shadow-[0_8px_30px_rgba(16,185,129,0.06)]' 
                        : 'border-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1'
                    }`}
                  >
                    {/* Barra lateral indicadora */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-opacity duration-500 ${
                      peticion.respondida 
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-100' 
                        : 'bg-gradient-to-b from-[#F4D03F] to-[#d4ac0d] opacity-0 group-hover:opacity-100'
                    }`}></div>

                    <div className="pl-2">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-transform duration-500 ${
                            peticion.respondida 
                              ? 'bg-emerald-50 border-emerald-100' 
                              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 group-hover:scale-110'
                          }`}>
                            {peticion.es_anonima ? '🕵️' : '🙏'}
                          </div>
                          
                          <span className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 ${
                            peticion.respondida ? 'text-emerald-600' : 'text-[#3E2723]'
                          }`}>
                            {peticion.nombre_usuario} {peticion.respondida && <span title="¡Oración Respondida!">✅</span>}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {peticion.respondida && (
                            <span className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                              <span>✨</span> Testimonio
                            </span>
                          )}
                          <span className={`text-[10px] font-black px-4 py-2.5 rounded-xl uppercase tracking-widest border backdrop-blur-sm ${
                            peticion.respondida 
                              ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200' 
                              : (colorCategoria[peticion.categoria] || colorCategoria.Espiritual)
                          }`}>
                            {peticion.categoria}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm sm:text-base font-semibold whitespace-pre-wrap leading-loose ${peticion.respondida ? 'text-gray-600' : 'text-gray-600'}`}>
                        {peticion.texto}
                      </p>

                      {/* CAMPO DE ASIGNACIÓN PARA LA REUNIÓN */}
                      <div className={`mt-5 bg-gradient-to-r from-[#FFFCF5] to-white border rounded-xl p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-[0_2px_15px_rgba(244,208,63,0.05)] relative overflow-hidden group/asignar transition-all duration-300 ${
                        peticion.respondida 
                          ? 'border-emerald-100' 
                          : 'border-[#F4D03F]/30 hover:border-[#F4D03F]/60 hover:shadow-[0_4px_20px_rgba(244,208,63,0.15)]'
                      }`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${
                          peticion.respondida ? 'bg-emerald-300' : 'bg-[#F4D03F]/40 group-focus-within/asignar:bg-[#F4D03F]'
                        }`}></div>
                        
                        <div className="flex items-center gap-2.5">
                           <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-sm shadow-inner transition-colors ${
                             peticion.respondida 
                               ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' 
                               : 'bg-gradient-to-br from-[#FFF9E6] to-[#FFF2C8] border border-[#F4D03F]/50 text-[#3E2723]'
                           }`}>
                              📝
                           </span>
                           <span className={`text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${
                             peticion.respondida ? 'text-emerald-600' : 'text-[#795548]'
                           }`}>
                              Asignado a:
                           </span>
                        </div>
                        
                        <input
                          type="text"
                          placeholder={peticion.respondida ? "Intercesión finalizada" : "Escribe quién orará por esto en la reunión"}
                          value={peticion.asignado_a || ''}
                          onChange={(e) => handleCambioAsignacion(peticion.id, e.target.value)}
                          onBlur={(e) => actualizarAsignado(peticion.id, e.target.value)}
                          disabled={peticion.respondida}
                          className={`w-full flex-1 bg-transparent border-b-2 border-dashed px-2 py-1.5 text-sm sm:text-base font-bold focus:outline-none transition-all duration-300 ${
                            peticion.respondida 
                              ? 'border-transparent text-emerald-700 cursor-not-allowed bg-emerald-50/30 rounded-md placeholder-emerald-400/70' 
                              : 'border-[#F4D03F]/40 focus:border-[#d4ac0d] text-[#3E2723] hover:border-[#F4D03F]/70 focus:bg-[#FFFDF5] rounded-t-md placeholder-[#a68c87]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200/60 pt-6 pl-2 gap-5 mt-2">
                      <span className="text-[11px] text-gray-400 font-black uppercase tracking-[0.15em] flex items-center gap-2">
                        <svg className={`w-4 h-4 ${peticion.respondida ? 'text-emerald-500' : 'text-[#d4ac0d]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {peticion.creado_en ? new Date(peticion.creado_en).toLocaleDateString() : 'Hoy'}
                      </span>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => !peticion.respondida && registrarIntercesion(peticion.id, peticion.contador_oraciones)}
                          disabled={peticion.respondida}
                          className={`flex items-center justify-center sm:justify-start gap-3.5 px-5 py-3.5 border text-sm font-black rounded-2xl transition-all duration-500 w-full sm:w-auto shadow-sm group/btn ${
                            peticion.respondida 
                              ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-white to-gray-50 hover:from-[#F4D03F] hover:to-[#e5c138] border-gray-200 hover:border-[#d4ac0d] text-[#3E2723] active:scale-95 hover:shadow-[0_8px_20px_rgba(244,208,63,0.3)]'
                          }`}
                        >
                          <span className={`text-xl transition-transform duration-300 ${!peticion.respondida && 'group-hover/btn:scale-110'}`}>🛐</span>
                          Me uno en oración
                          <span className={`text-xs px-3.5 py-1 rounded-full font-black shadow-inner ${
                            peticion.respondida ? 'bg-gray-300 text-gray-500' : 'bg-[#3E2723] text-[#F4D03F]'
                          }`}>
                            {peticion.contador_oraciones || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => !peticion.respondida && marcarComoRespondida(peticion.id)}
                          disabled={peticion.respondida}
                          className={`flex items-center justify-center sm:justify-start gap-2.5 px-5 py-3.5 border text-sm font-black rounded-2xl transition-all duration-500 w-full sm:w-auto shadow-sm group/resp ${
                            peticion.respondida
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default shadow-inner'
                              : 'bg-white hover:bg-emerald-50 border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-700 active:scale-95 hover:shadow-[0_8px_20px_rgba(16,185,129,0.2)]'
                          }`}
                        >
                          <span className={`text-xl transition-transform duration-300 ${!peticion.respondida && 'group-hover/resp:scale-110'}`}>
                            {peticion.respondida ? '🙌' : '✨'}
                          </span>
                          {peticion.respondida ? '¡Dios respondió!' : 'Ya Dios respondió'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* FOOTER ULTRAPREMIUM */}
      <footer className="w-full py-10 mt-14 bg-gradient-to-t from-white/60 to-white/20 border-t border-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">
            Desarrollado por <span className="text-[#3E2723] font-black bg-gradient-to-r from-[#3E2723] to-[#795548] bg-clip-text text-transparent">Jocsan Bello</span>
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-semibold tracking-wide">
            © {new Date().getFullYear()} ACUSBprays. Todos unidos en oración ante el Trono de Gracia.
          </p>
        </div>
      </footer>
    </div>
  );
}
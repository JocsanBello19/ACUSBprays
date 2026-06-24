import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [peticiones, setPeticiones] = useState([]);
  const [nuevaPeticion, setNuevaPeticion] = useState('');
  const [categoria, setCategoria] = useState('Espiritual');
  const [esAnonima, setEsAnonima] = useState(false);
  const [cargando, setCargando] = useState(true);

  // --- EFECTOS (Carga inicial) ---
  useEffect(() => {
    cargarPeticiones();
  }, []);

  // --- FUNCIONES ASÍNCRONAS (CONEXIÓN SUPABASE) ---

  // 1. Cargar peticiones desde la nube
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

  // 2. Guardar una nueva petición en la base de datos
  const guardarNuevaPeticion = async (e) => {
    e.preventDefault(); // Previene que la página se recargue al enviar el formulario
    if (!nuevaPeticion.trim()) return;

    try {
      const { error } = await supabase
        .from('peticiones')
        .insert([
          {
            texto: nuevaPeticion,
            categoria: categoria,
            es_anonima: esAnonima,
            nombre_usuario: esAnonima ? 'Anónimo' : 'Hermano USB'
          }
        ]);

      if (error) throw error;

      // Limpiar formulario tras el éxito
      setNuevaPeticion('');
      setEsAnonima(false);
      
      // Recargar la lista en tiempo real
      await cargarPeticiones();
    } catch (err) {
      console.error("Error guardando petición:", err.message);
    }
  };

  // 3. Incrementar contador ("¡He orado por esto!")
  const registrarIntercesion = async (peticionId, contadorActual) => {
    try {
      const { error } = await supabase
        .from('peticiones')
        .update({ contador_oraciones: contadorActual + 1 })
        .eq('id', peticionId);

      if (error) throw error;
      
      // Recargar datos para actualizar los contadores en la interfaz
      await cargarPeticiones();
    } catch (err) {
      console.error("Error al registrar oración:", err.message);
    }
  };

  // --- DISEÑO DE LA INTERFAZ (UI) ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Encabezado Principal */}
      <header className="bg-gradient-to-r应用 from-cyan-600 to-blue-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>🙏</span> ACUSBprays
            </h1>
            <p className="text-cyan-100 text-xs sm:text-sm font-medium mt-0.5">
              Red de Intercesión Universitaria • USB
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            👥 Comunidad de Apoyo y Fe
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Formulario */}
        <section className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>✍️</span> Levantar Petición
            </h2>
            
            <form onSubmit={guardarNuevaPeticion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  ¿Cuál es tu necesidad?
                </label>
                <textarea
                  value={nuevaPeticion}
                  onChange={(e) => setNuevaPeticion(e.target.value)}
                  placeholder="Describe detalladamente tu motivo de oración..."
                  rows="4"
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
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
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                🚀 Enviar al Altar
              </button>
            </form>
          </div>
        </section>

        {/* COLUMNA DERECHA: Listado de Peticiones */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">🔥 Clamor en Vivo</span>
            <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold">
              {peticiones.length} activos
            </span>
          </h2>

          {cargando ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 text-slate-400 text-sm font-medium">
              🔄 Conectando con Supabase y cargando peticiones...
            </div>
          ) : peticiones.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              <span className="text-2xl block mb-2">🕊️</span> No hay peticiones activas en este momento. ¡Sé el primero en levantar una oración!
            </div>
          ) : (
            <div className="space-y-4">
              {peticiones.map((peticion) => (
                <article 
                  key={peticion.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">
                        👤 {peticion.nombre_usuario}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        peticion.categoria === 'Estudios' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        peticion.categoria === 'Salud' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        peticion.categoria === 'Familia' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {peticion.categoria}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {peticion.texto}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-xs text-slate-400 font-medium">
                      ⏱️ {new Date(peticion.creado_en).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => registrarIntercesion(peticion.id, peticion.contador_oraciones)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-700 text-xs font-bold rounded-xl transition-colors group"
                    >
                      <span className="group-hover:scale-125 transition-transform block">🛐</span>
                      Amén, he orado por esto 
                      <span className="bg-cyan-700 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                        {peticion.contador_oraciones}
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
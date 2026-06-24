import React, { useState } from 'react';

// Simulación de datos iniciales de la ACUSB
const PETICIONES_INICIALES = [
  {
    id: 1,
    usuario: 'Anónimo',
    categoria: 'Estudios',
    texto:
      'Por los parciales de la semana 8 en la USB, mucha ansiedad en la comunidad.',
    votos: 14,
    orado: false,
  },
  {
    id: 2,
    usuario: 'María G.',
    categoria: 'Salud',
    texto: 'Recuperación de mi abuela tras su operación de esta mañana.',
    votos: 8,
    orado: true,
  },
  {
    id: 3,
    usuario: 'Juan Pérez',
    categoria: 'Familia',
    texto: 'Restauración y paz en los hogares de todo el equipo de líderes.',
    votos: 22,
    orado: false,
  },
];

export default function AcusbPrayerApp() {
  const [peticiones, setPeticiones] = useState(PETICIONES_INICIALES);
  const [nuevaPeticion, setNuevaPeticion] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Estudios');
  const [anonimo, setAnonimo] = useState(false);
  const [filtro, setFiltro] = useState('Todas');

  const manejarCrearPeticion = (e) => {
    e.preventDefault();
    if (!nuevaPeticion.trim()) return;

    const nueva = {
      id: Date.now(),
      usuario: anonimo ? 'Anónimo' : 'Usuario ACUSB',
      categoria: categoriaSel,
      texto: nuevaPeticion,
      votos: 0,
      orado: false,
    };

    setPeticiones([nueva, ...peticiones]);
    setNuevaPeticion('');
    setAnonimo(false);
  };

  const alternarOracion = (id) => {
    setPeticiones(
      peticiones.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            orado: !p.orado,
            votos: p.orado ? p.votos - 1 : p.votos + 1,
          };
        }
        return p;
      })
    );
  };

  const peticionesFiltradas =
    filtro === 'Todas'
      ? peticiones
      : peticiones.filter((p) => p.categoria === filtro);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C251C] font-sans antialiased pb-12">
      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-50 bg-[#EED167] border-b-4 border-[#2C251C] px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Silueta simplificada del pez ACUSB */}
          <div className="w-10 h-10 bg-[#2C251C] rounded-full flex items-center justify-center text-[#EED167] font-bold text-xs">
            🐟
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none text-[#2C251C]">
              ACUSB Prays
            </h1>
            <span className="text-xs font-bold text-[#2C251C]/80">
              Intercesión Universitaria
            </span>
          </div>
        </div>
        <div className="bg-[#2C251C] text-[#EED167] px-3 py-1 rounded-full text-xs font-bold">
          🔥 Racha: 5 Días
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        {/* SECCIÓN CREATIVA: AGREGAR PETICIÓN */}
        <section className="bg-white rounded-2xl border-2 border-[#2C251C] p-4 shadow-[4px_4px_0px_0px_rgba(44,37,28,1)] mb-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            📝 Levantar una Petición
          </h2>
          <form onSubmit={manejarCrearPeticion} className="space-y-3">
            <textarea
              value={nuevaPeticion}
              onChange={(e) => setNuevaPeticion(e.target.value)}
              placeholder="¿Por qué nos unimos a orar hoy?..."
              className="w-full h-24 p-3 bg-[#FAF8F5] rounded-xl border border-[#2C251C]/30 focus:outline-none focus:border-[#2C251C] resize-none text-sm text-[#2C251C]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <select
                value={categoriaSel}
                onChange={(e) => setCategoriaSel(e.target.value)}
                className="bg-[#FAF8F5] border border-[#2C251C] rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
              >
                <option value="Estudios">Estudios / USB</option>
                <option value="Salud">Salud</option>
                <option value="Familia">Familia</option>
                <option value="Espiritual">Crecimiento Espiritual</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonimo}
                  onChange={(e) => setAnonimo(e.target.checked)}
                  className="rounded text-[#2C251C] focus:ring-0 accent-[#2C251C]"
                />
                Anónimo
              </label>

              <button
                type="submit"
                className="bg-[#EED167] text-[#2C251C] font-black text-xs px-4 py-2 rounded-xl border-2 border-[#2C251C] active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(44,37,28,1)] transition-transform"
              >
                Publicar
              </button>
            </div>
          </form>
        </section>

        {/* FILTROS RÁPIDOS */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {['Todas', 'Estudios', 'Salud', 'Familia', 'Espiritual'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                  filtro === cat
                    ? 'bg-[#2C251C] text-[#EED167] border-[#2C251C]'
                    : 'bg-white text-[#2C251C] border-[#2C251C]/20 hover:border-[#2C251C]'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* LISTADO DE PETICIONES */}
        <section className="space-y-4">
          <h3 className="font-black text-sm uppercase tracking-wider text-[#2C251C]/60 px-1">
            Peticiones de la Semana ({peticionesFiltradas.length})
          </h3>

          {peticionesFiltradas.map((peticion) => (
            <article
              key={peticion.id}
              className={`p-4 rounded-2xl border-2 border-[#2C251C] bg-white transition-all shadow-[3px_3px_0px_0px_rgba(44,37,28,1)] ${
                peticion.orado ? 'opacity-75 bg-[#FAF8F5]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2C251C]/50">
                  Por:{' '}
                  <span className="text-[#2C251C] font-black">
                    {peticion.usuario}
                  </span>
                </span>
                <span className="bg-[#EED167]/40 text-[#2C251C] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border border-[#2C251C]/20">
                  {peticion.categoria}
                </span>
              </div>

              <p className="text-sm font-medium leading-relaxed text-[#2C251C] mb-4">
                {peticion.texto}
              </p>

              <div className="flex items-center justify-between border-t border-[#2C251C]/10 pt-3">
                <span className="text-xs font-bold text-[#2C251C]/70">
                  🙏 {peticion.votos} hermanos orando
                </span>

                <button
                  onClick={() => alternarOracion(peticion.id)}
                  className={`text-xs font-black px-4 py-2 rounded-xl border-2 border-[#2C251C] flex items-center gap-1.5 transition-all ${
                    peticion.orado
                      ? 'bg-emerald-500 text-white border-transparent shadow-none translate-y-0.5'
                      : 'bg-[#EED167] text-[#2C251C] shadow-[2px_2px_0px_0px_rgba(44,37,28,1)] hover:-translate-y-0.5'
                  }`}
                >
                  {peticion.orado ? '✓ Orado Hoy' : 'Interceder'}
                </button>
              </div>
            </article>
          ))}

          {peticionesFiltradas.length === 0 && (
            <div className="text-center py-12 text-sm text-[#2C251C]/50 font-medium">
              No hay peticiones registradas en este apartado aún.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

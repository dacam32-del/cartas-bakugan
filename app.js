(function () {
  const clp = n => n == null ? "–" : "$" + Number(n).toLocaleString("es-CL", { maximumFractionDigits: 0 });
  const usd = n => n == null ? "" : "US$" + Number(n).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const trim = s => String(s ?? "").trim();

  const SERIES = [
    "Battle Brawlers", "New Vestroia", "Gundalian Invaders", "Mechtanium Surge",
    "Battle Planet", "Armored Alliance", "Geogan Rising", "Evolutions", "Legends"
  ];
  const ATRIBUTOS = ["Pyrus", "Aquos", "Ventus", "Subterra", "Haos", "Darkus", "Aurelus"];
  const TIPOS = ["Ability", "Gate", "Character", "Evo", "Normal", "Command", "Special", "Bakugan", "Action", "Baku-Gear", "Flip"];
  const MATERIALES = ["Metalizada", "Estándar (no metalizada)", "Foil holo (no metalizada)"];

  const WA = "56956592453";
  const WA_ICO = `<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.5.7 4.8 1.9 6.8L3 29l6.8-2.1c1.9 1 4 1.6 6.2 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.2c-2 0-3.9-.6-5.5-1.6l-.4-.2-4 1.2 1.3-3.9-.3-.4a10.4 10.4 0 1 1 8.9 4.9zm5.7-7.8c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.5 8.5 0 0 1-4.2-3.7c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5 5.9 5.9 0 0 0 1.2 3.1c.2.2 2 3.1 4.9 4.3 1.8.8 2.5.8 3.4.7.6-.1 1.8-.7 2-1.4s.3-1.3.2-1.4-.3-.2-.6-.3z"/></svg>`;

  const grid = document.getElementById("grid");
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const empty = document.getElementById("empty");
  const vacio = document.getElementById("vacio");
  const attrBox = document.getElementById("atributos");
  const selSerie = document.getElementById("serie");
  const selTipo = document.getElementById("tipo");
  const selRareza = document.getElementById("rareza");
  const selIdioma = document.getElementById("idioma");
  const selAnio = document.getElementById("anio");
  const selMaterial = document.getElementById("material");

  let data = { cartas: [] };
  let attrSel = "";

  const qty = c => c.cantidad ?? 1;
  const precioSug = c => {
    if (c.precio_min_clp != null && c.precio_max_clp != null) {
      return Math.round((Number(c.precio_min_clp) + Number(c.precio_max_clp)) / 2);
    }
    return c.precio_sugerido_clp ?? null;
  };
  const precioSort = c => precioSug(c) || c.precio_mercado_clp || 0;
  const textoSug = c => {
    if (c.precio_min_clp != null && c.precio_max_clp != null) return `${clp(c.precio_min_clp)} – ${clp(c.precio_max_clp)}`;
    return clp(c.precio_sugerido_clp);
  };
  const waURL = c => `https://wa.me/${WA}?text=` + encodeURIComponent(
    `Hola, me interesa la carta Bakugan ${c.nombre}${c.codigo ? " (" + c.codigo + ")" : ""} (${[c.serie, c.set, c.atributo, c.tipo, c.idioma].filter(Boolean).join(", ")}) a ${textoSug(c)} CLP`
  );

  function unique(field, extras = []) {
    const s = new Set(extras.map(trim).filter(Boolean));
    data.cartas.forEach(c => { const v = trim(c[field]); if (v) s.add(v); });
    return [...s];
  }

  function fillSelect(el, label, values, numeric = false) {
    const cur = el.value;
    const opts = values.slice().sort(numeric
      ? (a, b) => Number(b) - Number(a)
      : (a, b) => String(a).localeCompare(String(b), "es"));
    el.innerHTML = [`<option value="">${label}: todos</option>`]
      .concat(opts.map(v => `<option value="${esc(v)}">${esc(v)}</option>`)).join("");
    if (opts.map(String).includes(cur)) el.value = cur;
  }

  function buildFilters() {
    const seriesInData = unique("serie");
    const series = [...SERIES, ...seriesInData.filter(s => !SERIES.includes(s))];
    const sets = unique("set").filter(s => !series.includes(s));
    const serieValues = series.concat(sets);
    fillSelect(selSerie, "Serie / set", serieValues);
    const tipos = [...TIPOS, ...unique("tipo").filter(t => !TIPOS.includes(t))];
    fillSelect(selTipo, "Tipo", tipos);
    fillSelect(selRareza, "Rareza", unique("rareza"));
    fillSelect(selIdioma, "Idioma", unique("idioma"));
    fillSelect(selAnio, "Año", unique("anio"), true);
    const mats = [...MATERIALES, ...unique("material_tipo").filter(m => !MATERIALES.includes(m))];
    fillSelect(selMaterial, "Material", mats);

    const counts = new Map();
    data.cartas.forEach(c => {
      const k = trim(c.atributo);
      if (!k) return;
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    const attrs = [...ATRIBUTOS, ...[...counts.keys()].filter(a => !ATRIBUTOS.includes(a))];
    attrBox.innerHTML = [`<button type="button" class="chip" data-attr="" aria-pressed="${attrSel === ""}">Todos <span>${data.cartas.length}</span></button>`]
      .concat(attrs.map(a => `<button type="button" class="chip attr-${esc(a)}" data-attr="${esc(a)}" aria-pressed="${attrSel === a}">${esc(a)} <span>${counts.get(a) || 0}</span></button>`)).join("");
  }

  const sorters = {
    "precio-desc": (a, b) => precioSort(b) - precioSort(a),
    "precio-asc": (a, b) => precioSort(a) - precioSort(b),
    "anio-desc": (a, b) => (b.anio || 0) - (a.anio || 0),
    "anio-asc": (a, b) => (a.anio || 0) - (b.anio || 0),
    "nombre-asc": (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"),
    "serie-asc": (a, b) => String(a.serie || "").localeCompare(String(b.serie || ""), "es")
      || String(a.set || "").localeCompare(String(b.set || ""), "es")
      || String(a.numero || "").localeCompare(String(b.numero || ""), "es", { numeric: true })
  };

  function matchSerie(c, v) {
    if (!v) return true;
    return trim(c.serie) === v || trim(c.set) === v;
  }

  function cardHTML(c) {
    const imgs = (c.imagenes && c.imagenes.length ? c.imagenes : (c.imagen ? [c.imagen] : [])).filter(Boolean);
    const img = imgs.length
      ? `<img src="${esc(imgs[0])}" alt="${esc(c.nombre)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'noimg',textContent:'Sin imagen'}))">`
      : `<span class="noimg">Sin imagen</span>`;
    const thumbs = imgs.length > 1
      ? `<div class="thumbs">${imgs.slice(1).map(src => `<img src="${esc(src)}" alt="" loading="lazy">`).join("")}</div>`
      : "";
    const attr = trim(c.atributo);
    const id = c.codigo || c.id || c.nombre;
    return `<article class="card" data-id="${esc(id)}" data-atributo="${esc(attr)}">
      <div class="card-img">${img}</div>
      <div class="card-body">
        <h2>${esc(c.nombre)}</h2>
        ${c.nombre_en && c.nombre_en !== c.nombre ? `<p class="en">${esc(c.nombre_en)}</p>` : ""}
        <div class="tags">
          ${attr ? `<span class="tag attr ${esc(attr)}">${esc(attr)}</span>` : ""}
          ${c.tipo ? `<span class="tag tipo">${esc(c.tipo)}</span>` : ""}
          ${c.idioma ? `<span class="tag idioma">${esc(c.idioma)}</span>` : ""}
          ${c.estado ? `<span class="tag estado">Estado: ${esc(c.estado)}</span>` : ""}
          ${c.rareza ? `<span class="tag rareza">${esc(c.rareza)}</span>` : ""}
          ${c.material_tipo ? `<span class="tag material">${esc(c.material_tipo)}</span>` : ""}
          <span class="tag stock">Stock: ${qty(c)}</span>
        </div>
        <dl>
          ${c.codigo ? `<dt>Código</dt><dd>${esc(c.codigo)}</dd>` : ""}
          ${c.serie ? `<dt>Serie</dt><dd>${esc(c.serie)}</dd>` : ""}
          ${c.set ? `<dt>Set</dt><dd>${esc(c.set)}${c.codigo_set ? " (" + esc(c.codigo_set) + ")" : ""}</dd>` : ""}
          ${c.numero ? `<dt>Número</dt><dd>${esc(c.numero)}</dd>` : ""}
          ${c.anio ? `<dt>Año</dt><dd>${esc(c.anio)}</dd>` : ""}
          ${c.tipo ? `<dt>Tipo</dt><dd>${esc(c.tipo)}</dd>` : ""}
          ${attr ? `<dt>Atributo</dt><dd>${esc(attr)}</dd>` : ""}
          ${c.hsp != null && c.hsp !== "" ? `<dt>HSP</dt><dd>${esc(c.hsp)}</dd>` : ""}
          ${c.energy != null && c.energy !== "" ? `<dt>Energía</dt><dd>${esc(c.energy)}</dd>` : ""}
          ${c.b_power != null && c.b_power !== "" ? `<dt>B-Power</dt><dd>${esc(c.b_power)}</dd>` : ""}
          ${c.damage != null && c.damage !== "" ? `<dt>Daño</dt><dd>${esc(c.damage)}</dd>` : ""}
          ${c.bakucores ? `<dt>BakuCores</dt><dd>${esc(c.bakucores)}</dd>` : ""}
          ${c.bonos ? `<dt>Bonos</dt><dd>${esc(c.bonos)}</dd>` : ""}
          ${c.material || c.material_tipo ? `<dt>Material</dt><dd>${esc(c.material || c.material_tipo)}</dd>` : ""}
          ${c.idioma ? `<dt>Idioma</dt><dd>${esc(c.idioma)}</dd>` : ""}
          <dt>Stock</dt><dd><strong>${qty(c)}</strong></dd>
        </dl>
        ${thumbs}
        ${c.efecto ? `<p class="nota">${esc(c.efecto)}</p>` : ""}
        ${c.nota ? `<p class="nota">${esc(c.nota)}</p>` : ""}
        <div class="precios">
          <div class="precio"><small>Mercado</small><strong>${clp(c.precio_mercado_clp)}</strong>${c.precio_mercado_usd != null ? `<div class="usd">${usd(c.precio_mercado_usd)}${c.dolar_clp ? ` · dólar ${clp(c.dolar_clp)}` : ""}</div>` : ""}</div>
          <div class="precio sug"><small>Sugerido</small><strong>${textoSug(c)}</strong>${qty(c) > 1 && precioSug(c) ? `<div class="usd">×${qty(c)} = ${clp(precioSug(c) * qty(c))}</div>` : ""}</div>
        </div>
        <a class="wa-btn wa-card" href="${esc(waURL(c))}" target="_blank" rel="noopener">${WA_ICO}<span>Comprar por WhatsApp</span></a>
        ${c.fuente ? `<a class="fuente" href="${esc(c.fuente)}" target="_blank" rel="noopener">Ver referencia ↗</a>` : ""}
      </div>
    </article>`;
  }

  function render() {
    const q = norm(search.value.trim());
    const list = data.cartas
      .filter(c => matchSerie(c, selSerie.value))
      .filter(c => !selTipo.value || trim(c.tipo) === selTipo.value)
      .filter(c => !selRareza.value || trim(c.rareza) === selRareza.value)
      .filter(c => !selIdioma.value || trim(c.idioma) === selIdioma.value)
      .filter(c => !selAnio.value || String(c.anio || "") === selAnio.value)
      .filter(c => !selMaterial.value || trim(c.material_tipo) === selMaterial.value)
      .filter(c => !attrSel || trim(c.atributo) === attrSel)
      .filter(c => !q || norm([c.nombre, c.nombre_en, c.codigo, c.serie, c.set, c.codigo_set, c.numero, c.anio, c.tipo, c.atributo, c.rareza, c.idioma, c.estado, c.efecto, c.nota, c.hsp, c.bonos, c.material, c.material_tipo, c.codigo_set, c.energy, c.b_power, c.damage, c.bakucores].join(" ")).includes(q))
      .sort(sorters[sort.value] || sorters["precio-desc"]);
    const catalogEmpty = data.cartas.length === 0;
    vacio.hidden = !catalogEmpty;
    grid.innerHTML = catalogEmpty ? "" : list.map(cardHTML).join("");
    empty.hidden = catalogEmpty || list.length > 0;
    stats(list, catalogEmpty);
  }

  function stats(cs, catalogEmpty) {
    const filtrado = cs.length !== data.cartas.length;
    document.getElementById("stat-count").textContent = catalogEmpty ? "0" : cs.reduce((s, c) => s + qty(c), 0);
    document.getElementById("stat-distinct").textContent = catalogEmpty
      ? "0 distintas"
      : (filtrado ? `${cs.length} de ${data.cartas.length} distintas (filtro)` : `${cs.length} distintas`);
    const mercado = cs.reduce((s, c) => s + (c.precio_mercado_clp || 0) * qty(c), 0);
    const sugerido = cs.reduce((s, c) => {
      const p = precioSug(c);
      return s + (p || 0) * qty(c);
    }, 0);
    document.getElementById("stat-market").textContent = catalogEmpty ? clp(0) : clp(mercado || null);
    document.getElementById("stat-suggested").textContent = catalogEmpty ? clp(0) : clp(sugerido || null);
    const f = data.actualizado ? new Date(data.actualizado + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "";
    document.getElementById("footer-info").textContent = `Actualizado: ${f}${data.dolar_clp ? ` · Dólar: ${clp(data.dolar_clp)} CLP` : ""}`;
  }

  fetch("cartas.json?v=" + Date.now(), { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => { data = d; if (!Array.isArray(data.cartas)) data.cartas = []; buildFilters(); render(); })
    .catch(() => { vacio.hidden = true; empty.hidden = false; empty.textContent = "No se pudo cargar cartas.json."; });

  search.addEventListener("input", render);
  sort.addEventListener("change", render);
  [selSerie, selTipo, selRareza, selIdioma, selAnio, selMaterial].forEach(el => el.addEventListener("change", render));
  attrBox.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    attrSel = b.dataset.attr || "";
    attrBox.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    render();
  });
})();

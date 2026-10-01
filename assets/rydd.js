// RYDD v5 luxury · menú a pantalla completa, aparición lenta, manifiesto que se ilumina,
// fotos con paralaje, carro que se estaciona en su posición, mapa de la sede y calculadora.
(function () {
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var captura = new URLSearchParams(location.search).get("captura");   // solo para tomar pantallazos
  if (captura !== null) document.documentElement.classList.add("captura");
  var lim = function (v) { return Math.max(0, Math.min(1, v)); };
  var suave = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var tareas = [];   // todo lo que reacciona al scroll, en un solo requestAnimationFrame
  var pendiente = false;
  function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(function () { pendiente = false; tareas.forEach(function (f) { f(); }); }); } }
  window.addEventListener("scroll", alScroll, { passive: true });
  window.addEventListener("resize", alScroll);

  // menú a pantalla completa
  var boton = document.querySelector(".boton-menu");
  if (boton) {
    boton.addEventListener("click", function () {
      var abierto = document.body.classList.toggle("menu-abierto");
      boton.setAttribute("aria-expanded", abierto);
      boton.querySelector("b").textContent = abierto ? "Cerrar" : "Menú";
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-abierto")) boton.click(); });
  }

  // cabecera sólida al bajar
  var cab = document.querySelector(".cab");
  tareas.push(function () { if (cab) cab.classList.toggle("solida", window.scrollY > 60); });

  // aparición lenta
  var vistos = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && captura === null) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) { return h.classList.contains("rv"); });
        el.style.transitionDelay = Math.max(0, hermanos.indexOf(el)) * 90 + "ms";
        el.classList.add("vis"); io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    vistos.forEach(function (el) { io.observe(el); });
  } else vistos.forEach(function (el) { el.classList.add("vis"); });

  // manifiesto: las palabras se iluminan a medida que bajas
  var man = document.querySelector("[data-manifiesto]");
  if (man) {
    var pals = man.querySelectorAll(".pal");
    tareas.push(function () {
      var r = man.getBoundingClientRect(), vh = innerHeight;
      var p = reducir ? 1 : lim((vh * .85 - r.top) / (r.height * .75));
      var n = Math.round(p * pals.length);
      pals.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    });
  }

  // paralaje lento en fotos
  var paral = document.querySelectorAll("[data-paralaje]");
  if (!reducir) tareas.push(function () {
    paral.forEach(function (el) {
      var caja = el.parentElement.getBoundingClientRect(), f = +el.dataset.paralaje;
      if (caja.bottom < 0 || caja.top > innerHeight) return;
      var centro = (caja.top + caja.height / 2 - innerHeight / 2);
      el.style.transform = "translate3d(0," + (-centro * f).toFixed(1) + "px,0)";
    });
  });

  // tu posición: el carro baja, se dibuja la bahía y la tapa de carga se ilumina
  var viaje = document.querySelector("[data-viaje]");
  if (viaje) {
    var carro = viaje.querySelector("[data-carro]"), estado = viaje.querySelector("[data-estado]"), geo = {};
    var bahias = Array.prototype.map.call(viaje.querySelectorAll(".bahia"), function (b) { var l = b.getTotalLength(); b.style.strokeDasharray = l; return [b, l]; });
    var medir = function () {
      var vw = innerWidth, vh = innerHeight, movil = vw < 900;
      var w = movil ? vw * 1.6 : Math.min(vh * .8, vw * .42), h = w * 1970 / 1100;
      carro.style.setProperty("--carro-w", w + "px");
      geo.t0 = (movil ? 70 : 90) - .118 * h;
      geo.t1 = Math.min(geo.t0, vh - (movil ? 130 : 240) - .866 * h);
      geo.vh = vh;
    };
    medir(); window.addEventListener("resize", medir);
    tareas.push(function () {
      var r = viaje.getBoundingClientRect(), recorrido = r.height - geo.vh;
      var p = captura ? +captura : (reducir ? 1 : lim(-r.top / (recorrido || 1)));
      carro.style.transform = "translate3d(0," + (geo.t0 + (geo.t1 - geo.t0) * suave(lim(p / .65))) + "px,0)";
      carro.style.setProperty("--barrido", (100 - lim(p / .75) * 100) + "%");
      var bh = suave(lim(p / .6));
      bahias.forEach(function (b, i) { var t = i < 2 ? bh : suave(lim((p - .5) / .15)); b[0].style.strokeDashoffset = b[1] * (1 - t); });
      var listo = p > .68;
      viaje.classList.toggle("avanza", p > .08);
      viaje.classList.toggle("listo", listo);
      estado.textContent = listo ? "Posición lista · CCS2" : (p > .08 ? "Llegando a tu posición" : "Desliza");
    });
  }

  // mapa de la sede (página de Envigado)
  var mapa = document.querySelector("[data-mapa] .mapa");
  if (mapa) {
    var fp = mapa.querySelector("[data-mp]"), fc = mapa.querySelector("[data-mc]"), bahiasM = mapa.querySelectorAll(".bahia-m");
    var elegir = function (b) { bahiasM.forEach(function (o) { o.classList.remove("activa"); }); b.classList.add("activa"); fp.textContent = b.dataset.p; fc.textContent = b.dataset.eq; };
    bahiasM.forEach(function (b) { b.addEventListener("pointerenter", function () { elegir(b); }); b.addEventListener("click", function () { elegir(b); }); });
    if ("IntersectionObserver" in window && captura === null) {
      var om = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mapa.classList.add("on"); om.disconnect(); } }, { threshold: .3 });
      om.observe(mapa);
    } else mapa.classList.add("on");
  }

  // calculadora (página de tarifas)
  var calc = document.getElementById("calc");
  if (calc) {
    var precio = parseFloat(calc.dataset.precio) || 0, bateria = 60;
    var desde = document.getElementById("desde"), hasta = document.getElementById("hasta");
    var calcular = function () {
      var d = +desde.value, h = +hasta.value;
      if (h <= d) { h = Math.min(100, d + 5); hasta.value = h; }
      var kwh = bateria * (h - d) / 100;
      document.getElementById("v-desde").textContent = d + " %";
      document.getElementById("v-hasta").textContent = h + " %";
      document.getElementById("r-kwh").textContent = kwh.toFixed(1).replace(".", ",");
      if (precio) document.getElementById("r-pesos").textContent = "$ " + Math.round(kwh * precio).toLocaleString("es-CO");
    };
    calc.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        calc.querySelectorAll(".chip").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true"); bateria = +c.dataset.kwh; calcular();
      });
    });
    desde.addEventListener("input", calcular); hasta.addEventListener("input", calcular);
    calcular();
  }

  alScroll();
})();

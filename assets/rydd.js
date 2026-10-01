// RYDD · menú, aparición al hacer scroll, héroe con carro + manguera, medidor de potencia y calculadora.
(function () {
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var captura = new URLSearchParams(location.search).get("captura");   // solo para tomar pantallazos
  if (captura !== null) document.documentElement.classList.add("captura");
  var lim = function (v) { return Math.max(0, Math.min(1, v)); };
  var suave = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

  // menú en celular
  var hamb = document.querySelector(".hamb"), menu = document.querySelector(".menu");
  if (hamb && menu) hamb.addEventListener("click", function () {
    var abierto = menu.classList.toggle("abierto");
    hamb.setAttribute("aria-expanded", abierto);
  });

  // cabecera: se vuelve sólida al bajar
  var cab = document.querySelector(".cab");
  function cabSolida() { if (cab) cab.classList.toggle("solida", window.scrollY > 40); }
  window.addEventListener("scroll", cabSolida, { passive: true }); cabSolida();

  // aparición suave con escalonado
  var vistos = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) { return h.classList.contains("rv"); });
        el.style.transitionDelay = Math.max(0, hermanos.indexOf(el)) * 60 + "ms";
        el.classList.add("vis");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    vistos.forEach(function (el) { io.observe(el); });
  } else vistos.forEach(function (el) { el.classList.add("vis"); });

  // héroe: el carro (visto desde arriba) avanza, se dibuja el puesto de carga y la manguera se conecta
  var viaje = document.querySelector("[data-viaje]");
  if (viaje) {
    var carro = viaje.querySelector("[data-carro]"), estado = viaje.querySelector("[data-estado]"),
        pistola = viaje.querySelector(".pistola"), guia = viaje.querySelector(".cable-base");
    var L = guia.getTotalLength(), geo = {}, pendiente = false;
    var capas = viaje.querySelectorAll(".cable-capa");
    capas.forEach(function (c) { c.style.strokeDasharray = L; });
    var bahias = Array.prototype.map.call(viaje.querySelectorAll(".bahia"), function (b) { var l = b.getTotalLength(); b.style.strokeDasharray = l; return [b, l]; });
    function medir() {
      var vw = window.innerWidth, vh = window.innerHeight, movil = vw < 900;
      var w = movil ? vw * 1.75 : Math.min(vh * .82, vw * .45), h = w * 1970 / 1100;
      carro.style.setProperty("--carro-w", w + "px");
      geo.t0 = (movil ? 70 : 100) - .118 * h;
      geo.t1 = Math.min(geo.t0, vh - 80 - .866 * h);
      geo.vh = vh; pintar();
    }
    function pintar() {
      pendiente = false;
      var r = viaje.getBoundingClientRect(), recorrido = r.height - geo.vh;
      var p = captura ? +captura : (reducir ? 1 : lim(-r.top / (recorrido || 1)));
      carro.style.transform = "translate3d(0," + (geo.t0 + (geo.t1 - geo.t0) * suave(lim(p / .6))) + "px,0)";
      var bh = suave(lim(p / .55));
      bahias.forEach(function (b, i) { var t = i < 2 ? bh : suave(lim((p - .45) / .15)); b[0].style.strokeDashoffset = b[1] * (1 - t); });
      var c = suave(lim((p - .5) / .4));
      capas.forEach(function (k) { k.style.strokeDashoffset = L * (1 - c); });
      var a = guia.getPointAtLength(Math.max(0, L * c - 1)), b = guia.getPointAtLength(Math.max(1, L * c));
      pistola.setAttribute("transform", "translate(" + b.x + " " + b.y + ") rotate(" + Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + ")");
      viaje.classList.toggle("avanza", p > .1);
      viaje.classList.toggle("cargando", p > .42);
      var listo = p > .62;
      viaje.classList.toggle("listo", listo);
      estado.textContent = listo ? "Posición lista · CCS2" : (p > .1 ? "Llegando a tu posición" : "Desliza");
    }
    window.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }, { passive: true });
    window.addEventListener("resize", medir);
    medir();
  }

  // medidor de potencia: el arco se llena y el número cuenta hasta el valor final
  var med = document.querySelector("[data-medidor]");
  if (med && "IntersectionObserver" in window) {
    var arco = med.querySelector(".arco"), num = med.querySelector("[data-num]"), fin = +num.dataset.fin, largo = 923.6;
    num.textContent = reducir ? fin : 0;
    if (reducir) arco.style.strokeDashoffset = 0;
    var om = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return; om.disconnect();
      arco.style.strokeDashoffset = 0;
      if (reducir) return;
      var t0 = null;
      (function paso(t) { if (!t0) t0 = t; var q = Math.min(1, (t - t0) / 2200), e = 1 - Math.pow(1 - q, 3);
        num.textContent = Math.round(fin * e); if (q < 1) requestAnimationFrame(paso); })(performance.now());
    }, { threshold: .4 });
    om.observe(med);
  }

  // calculadora (página de tarifas)
  var calc = document.getElementById("calc");
  if (calc) {
    var precio = parseFloat(calc.dataset.precio) || 0, bateria = 60;
    var desde = document.getElementById("desde"), hasta = document.getElementById("hasta");
    function calcular() {
      var d = +desde.value, h = +hasta.value;
      if (h <= d) { h = Math.min(100, d + 5); hasta.value = h; }
      var kwh = bateria * (h - d) / 100;
      document.getElementById("v-desde").textContent = d + " %";
      document.getElementById("v-hasta").textContent = h + " %";
      document.getElementById("r-kwh").textContent = kwh.toFixed(1).replace(".", ",");
      if (precio) document.getElementById("r-pesos").textContent = "$ " + Math.round(kwh * precio).toLocaleString("es-CO");
    }
    calc.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        calc.querySelectorAll(".chip").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true"); bateria = +c.dataset.kwh; calcular();
      });
    });
    desde.addEventListener("input", calcular); hasta.addEventListener("input", calcular);
    calcular();
  }
})();

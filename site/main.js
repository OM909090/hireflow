// HireFlow landing page — progressive enhancement only.
// Every section is readable with JS disabled; this adds counters, tilt and ambience.

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── sticky header state ─────────────────────────────── */
  var header = document.getElementById("header");
  function onScroll() {
    if (header) header.classList.toggle("stuck", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── reveal on scroll ────────────────────────────────── */
  var targets = document.querySelectorAll(
    ".stat, .finding, .metric, .card, .shot, .pipe-node, .hero-badge"
  );

  function revealAll() {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("in");
    });
  }

  if (reduce || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add("reveal");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      io.observe(el);
    });
  }

  /* ── count-up numbers ────────────────────────────────── */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    if (reduce || isNaN(target)) return;
    var dur = 1100;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      // easeOutExpo
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  var nums = document.querySelectorAll("[data-count]");
  if (reduce || !("IntersectionObserver" in window)) {
    // leave the server-rendered values as-is
  } else {
    var nio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          nio.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    Array.prototype.forEach.call(nums, function (el) {
      // reset to 0 so the count reads as motion
      el.textContent = "0";
      nio.observe(el);
    });
  }

  /* ── 3D pointer tilt ─────────────────────────────────── */
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tiltables = document.querySelectorAll(".tilt");

    Array.prototype.forEach.call(tiltables, function (el) {
      var raf = null;
      var tx = 0, ty = 0;

      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * 7;
        ty = px * 9;

        if (raf === null) {
          raf = requestAnimationFrame(function () {
            el.style.transform =
              "perspective(900px) rotateX(" + tx.toFixed(2) + "deg) rotateY(" +
              ty.toFixed(2) + "deg) translateZ(0)";
            raf = null;
          });
        }
      });

      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "";
        setTimeout(function () {
          el.style.transition = "";
        }, 520);
      });
    });
  }

  /* ── ambient node network (the "evidence graph") ─────── */
  var canvas = document.getElementById("net");
  if (!canvas || reduce) return;

  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [];
  var LINK = 132;

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.round(Math.min(58, Math.max(20, (W * H) / 26000)));
    nodes = [];
    for (var i = 0; i < target; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.9 + Math.random() * 1.7,
      });
    }
  }

  function readAccent() {
    var v = getComputedStyle(document.documentElement)
      .getPropertyValue("--brand-2").trim();
    return v || "#f472b6";
  }

  var accent = readAccent();
  var visible = true;

  function draw() {
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);

    // links
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -20) a.x = W + 20;
      if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20;
      if (a.y > H + 20) a.y = -20;

      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          var o = (1 - Math.sqrt(d2) / LINK) * 0.34;
          ctx.strokeStyle = "rgba(236,72,153," + o.toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  }

  resize();
  draw();

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  });

  // stop animating when scrolled out of view or tab is hidden
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting && !document.hidden;
      if (visible) requestAnimationFrame(draw);
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    if (visible) requestAnimationFrame(draw);
  });
})();
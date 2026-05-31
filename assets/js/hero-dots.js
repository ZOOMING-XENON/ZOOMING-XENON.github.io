// 首页 hero 区灰色点阵 + 鼠标推开效果（方案 A：原生 Canvas 2D，无依赖）
(function () {
  "use strict";

  // ---- 可调参数 ----
  var CONFIG = {
    spacing: 20,        // 点与点的间距(px)
    dotRadius: 1.6,     // 点半径(px)
    dotColor: "150, 150, 150", // 灰色 RGB，配合页面浅色背景
    repelRadius: 110,   // 鼠标影响半径(px)
    repelForce: 0.35,   // 推开力度
    spring: 0.08,       // 弹回原位的弹力
    friction: 0.82,     // 阻尼(越小停得越快)
    heroMinHeight: "40vh" // hero 区最小高度，给点阵留出空间
  };

  function init() {
    var hero = document.querySelector(".intro-header");
    if (!hero) return;

    // 给 hero 容器定位 & 高度，作为 canvas 的承载层
    hero.style.position = "relative";
    hero.style.overflow = "hidden";
    if (CONFIG.heroMinHeight) hero.style.minHeight = CONFIG.heroMinHeight;

    // 让标题内容浮在点阵之上
    var inner = hero.querySelector(".container-md");
    if (inner) {
      inner.style.position = "relative";
      inner.style.zIndex = "1";
    }

    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none"; // 不拦截点击，鼠标位置走 window 监听
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function buildDots() {
      var w = hero.clientWidth;
      var h = hero.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (var y = CONFIG.spacing / 2; y < h; y += CONFIG.spacing) {
        for (var x = CONFIG.spacing / 2; x < w; x += CONFIG.spacing) {
          dots.push({ ox: x, oy: y, x: x, y: y, vx: 0, vy: 0 });
        }
      }
    }

    function draw() {
      var w = hero.clientWidth;
      var h = hero.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];

        if (!prefersReduced) {
          var dx = d.x - mouse.x;
          var dy = d.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONFIG.repelRadius && dist > 0) {
            var f = (1 - dist / CONFIG.repelRadius) * CONFIG.repelForce;
            d.vx += (dx / dist) * f * CONFIG.repelRadius;
            d.vy += (dy / dist) * f * CONFIG.repelRadius;
          }

          // 弹回原位 + 阻尼
          d.vx += (d.ox - d.x) * CONFIG.spring;
          d.vy += (d.oy - d.y) * CONFIG.spring;
          d.vx *= CONFIG.friction;
          d.vy *= CONFIG.friction;
          d.x += d.vx;
          d.y += d.vy;
        }

        // 离原位越远越淡，制造层次
        var off = Math.abs(d.x - d.ox) + Math.abs(d.y - d.oy);
        var alpha = Math.max(0.25, 0.7 - off / 200);

        ctx.beginPath();
        ctx.arc(d.x, d.y, CONFIG.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + CONFIG.dotColor + ", " + alpha + ")";
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    window.addEventListener("mouseout", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildDots, 150);
    });

    buildDots();
    requestAnimationFrame(draw);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

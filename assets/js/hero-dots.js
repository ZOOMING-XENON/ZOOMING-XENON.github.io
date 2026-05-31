// 首页 hero 区：照片封面 + 白色遮罩点阵，鼠标擦开露出照片、移开后缓慢淡回
// 路线 1：双层 Canvas（底层照片 <img> + 顶层 遮罩/点阵 canvas），原生实现无依赖
(function () {
  "use strict";

  // ---- 可调参数 ----
  var CONFIG = {
    // 背景照片
    bgImage: "/assets/img/home_background.JPG",
    bgPosition: "center", // 照片焦点：center / top / "50% 35%" 等

    // 点阵
    spacing: 20,                 // 点间距(px)
    dotRadius: 1.6,              // 点半径(px)
    dotColor: "150, 150, 150",   // 点颜色 RGB
    repelRadius: 110,            // 鼠标推开点的半径(px)
    repelForce: 0.35,            // 推开力度
    spring: 0.08,                // 点弹回原位的弹力
    friction: 0.32,              // 阻尼

    // 遮罩 / 揭示
    maskColor: "255, 255, 255",  // 遮罩底色 RGB（纯白）
    revealRadius: 120,           // 照片露出的半径(px)
    revealFeather: 0.55,         // 边缘虚化比例(0~1，越大越柔)
    fadeBackSeconds: 3,          // 鼠标移开后照片淡回所需秒数

    heroMinHeight: "40vh"        // hero 区最小高度
  };

  function init() {
    var hero = document.querySelector(".intro-header");
    if (!hero) return;

    hero.style.position = "relative";
    hero.style.overflow = "hidden";
    if (CONFIG.heroMinHeight) hero.style.minHeight = CONFIG.heroMinHeight;

    // 底层：背景照片
    var img = document.createElement("img");
    img.src = CONFIG.bgImage;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.objectPosition = CONFIG.bgPosition;
    img.style.zIndex = "0";
    img.style.pointerEvents = "none";
    hero.insertBefore(img, hero.firstChild);

    // 让标题内容浮在最上层
    var inner = hero.querySelector(".container-md");
    if (inner) {
      inner.style.position = "relative";
      inner.style.zIndex = "2";
    }

    // 顶层：遮罩 + 点阵 canvas
    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "1";
    canvas.style.pointerEvents = "none";
    hero.insertBefore(canvas, img.nextSibling);

    var ctx = canvas.getContext("2d");
    // 离屏画布：单独绘制"遮罩 + 擦洞"，再贴回主画布，避免擦除影响点阵
    var maskCanvas = document.createElement("canvas");
    var maskCtx = maskCanvas.getContext("2d");

    var dpr = window.devicePixelRatio || 1;
    var dots = [];
    var reveals = [];           // 擦除点：{x, y, strength}
    var mouse = { x: -9999, y: -9999, active: false };
    var lastTime = performance.now();
    var prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      var w = hero.clientWidth;
      var h = hero.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      maskCanvas.width = w * dpr;
      maskCanvas.height = h * dpr;
      maskCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (var y = CONFIG.spacing / 2; y < h; y += CONFIG.spacing) {
        for (var x = CONFIG.spacing / 2; x < w; x += CONFIG.spacing) {
          dots.push({ ox: x, oy: y, x: x, y: y, vx: 0, vy: 0 });
        }
      }
    }

    function drawMask(w, h) {
      // 1) 整块白色遮罩盖住照片
      maskCtx.globalCompositeOperation = "source-over";
      maskCtx.clearRect(0, 0, w, h);
      maskCtx.fillStyle = "rgb(" + CONFIG.maskColor + ")";
      maskCtx.fillRect(0, 0, w, h);

      // 2) 在擦除点处挖洞（destination-out + 径向渐变柔边）露出照片
      maskCtx.globalCompositeOperation = "destination-out";
      for (var i = 0; i < reveals.length; i++) {
        var r = reveals[i];
        if (r.strength <= 0.01) continue;
        var rad = CONFIG.revealRadius;
        var grad = maskCtx.createRadialGradient(r.x, r.y, rad * (1 - CONFIG.revealFeather), r.x, r.y, rad);
        grad.addColorStop(0, "rgba(0,0,0," + r.strength + ")");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        maskCtx.fillStyle = grad;
        maskCtx.beginPath();
        maskCtx.arc(r.x, r.y, rad, 0, Math.PI * 2);
        maskCtx.fill();
      }
      maskCtx.globalCompositeOperation = "source-over";
    }

    function frame(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.05); // 秒，限制突跳
      lastTime = now;

      var w = hero.clientWidth;
      var h = hero.clientHeight;

      // 鼠标活跃时，在鼠标处记录/刷新一个擦除点
      if (mouse.active && !prefersReduced) {
        reveals.push({ x: mouse.x, y: mouse.y, strength: 1 });
        // 控制擦除点数量，避免无限增长
        if (reveals.length > 600) reveals.splice(0, reveals.length - 600);
      }

      // 擦除点随时间衰减（淡回）
      var decay = dt / CONFIG.fadeBackSeconds;
      for (var i = reveals.length - 1; i >= 0; i--) {
        reveals[i].strength -= decay;
        if (reveals[i].strength <= 0) reveals.splice(i, 1);
      }

      // 绘制遮罩层并贴回主画布
      drawMask(w, h);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(maskCanvas, 0, 0, w, h);

      // 绘制点阵（在遮罩之上，鼠标处推开）
      for (var j = 0; j < dots.length; j++) {
        var d = dots[j];

        if (!prefersReduced) {
          var dx = d.x - mouse.x;
          var dy = d.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (mouse.active && dist < CONFIG.repelRadius && dist > 0) {
            var f = (1 - dist / CONFIG.repelRadius) * CONFIG.repelForce;
            d.vx += (dx / dist) * f * CONFIG.repelRadius;
            d.vy += (dy / dist) * f * CONFIG.repelRadius;
          }

          d.vx += (d.ox - d.x) * CONFIG.spring;
          d.vy += (d.oy - d.y) * CONFIG.spring;
          d.vx *= CONFIG.friction;
          d.vy *= CONFIG.friction;
          d.x += d.vx;
          d.y += d.vy;
        }

        var off = Math.abs(d.x - d.ox) + Math.abs(d.y - d.oy);
        var alpha = Math.max(0.25, 0.7 - off / 200);

        ctx.beginPath();
        ctx.arc(d.x, d.y, CONFIG.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + CONFIG.dotColor + ", " + alpha + ")";
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }

    window.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      mouse.x = x;
      mouse.y = y;
      mouse.active = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    });
    window.addEventListener("mouseout", function () {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

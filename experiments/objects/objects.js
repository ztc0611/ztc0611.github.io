(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------ selecting an object */

  var COPY = {
    aweigh: {
      name: "Aweigh",
      role: "iOS and watchOS app, awaiting App Review",
      body: [
        "A rider first app for the largest ferry system in the US, with live departures presented as a split flap board. Schedules, vessel locations, capacity, cameras, and alerts are organized around the trip a rider is trying to make."
      ],
      link: { href: "../../aweigh/", text: "Read the Aweigh case study" }
    },
    pixellate: {
      name: "Pixellate Camera",
      role: "iOS app, on the App Store since 2025",
      body: [
        "A live camera that shoots like the 1998 Game Boy Camera: four colors, heavy dither, full metadata, and GPS. Every viewfinder frame in the shipping app runs through a three pass engine that mixes error diffusion with a Bayer matrix, so faces stay readable while textures go coarse.",
        "Turn the dial on the object to mix a sample photo toward a four color version drawn here in the browser."
      ],
      link: { href: "../../portfolio.html#apps", text: "See it in the work list" }
    },
    printing: {
      name: "Printing the Dream",
      role: "Hardware and software, open source, 2026",
      body: [
        "Imports any image into Tomodachi Life on Switch 1 or 2 without modifying the console. A desktop converter reduces a picture to the game's palette, picks the cheapest brush and paint bucket passes, and minimizes cursor travel. A Pi Pico then redraws it by impersonating a wired controller over USB.",
        "The button on the object runs a small sketch of that idea, one color pass at a time."
      ],
      link: { href: "../../portfolio.html#apps", text: "See it in the work list" }
    }
  };

  var list = document.getElementById("objects");
  var objects = Array.prototype.slice.call(list.querySelectorAll(".object"));
  var plates = Array.prototype.slice.call(list.querySelectorAll(".plate"));
  var stage = document.getElementById("bench");
  var card = document.getElementById("readout");
  var cardName = document.getElementById("card-name");
  var cardRole = document.getElementById("card-role");
  var cardBody = document.getElementById("card-body");
  var cardLink = document.getElementById("card-link");
  var current = "aweigh";
  var cardTimer = null;

  function moveLight(el) {
    var stageBox = stage.getBoundingClientRect();
    var box = el.getBoundingClientRect();
    var center = box.left + box.width / 2 - stageBox.left;
    stage.style.setProperty("--light-x", (center / stageBox.width) * 100 + "%");
  }

  function fillCard(copy) {
    cardName.textContent = copy.name;
    cardRole.textContent = copy.role;
    cardBody.innerHTML = "";
    copy.body.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      cardBody.appendChild(p);
    });
    cardLink.textContent = copy.link.text;
    cardLink.setAttribute("href", copy.link.href);
  }

  function select(id, reveal) {
    var copy = COPY[id];
    if (!copy) return;

    objects.forEach(function (obj) {
      var on = obj.dataset.object === id;
      obj.classList.toggle("is-selected", on);
      var plate = obj.querySelector(".plate");
      if (plate) plate.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) {
        moveLight(obj);
        if (reveal !== false) keepInView(obj);
      }
    });

    if (id === current) return;
    current = id;
    window.clearTimeout(cardTimer);

    if (reduceMotion.matches) {
      fillCard(copy);
      card.classList.remove("is-swapping");
      return;
    }
    card.classList.add("is-swapping");
    cardTimer = window.setTimeout(function () {
      fillCard(copy);
      card.classList.remove("is-swapping");
    }, 170);
  }

  /* The shelf becomes a swipeable row on narrow screens. Scroll the row
     itself rather than calling scrollIntoView, which would drag the page. */
  function keepInView(obj) {
    if (list.scrollWidth <= list.clientWidth + 1) return;
    var target = obj.offsetLeft - (list.clientWidth - obj.offsetWidth) / 2;
    if (Math.abs(target - list.scrollLeft) < 8) return;
    list.scrollTo({
      left: target,
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
  }

  list.addEventListener("click", function (event) {
    var obj = event.target.closest(".object");
    if (obj) select(obj.dataset.object);
  });

  list.addEventListener("focusin", function (event) {
    var obj = event.target.closest(".object");
    if (obj) select(obj.dataset.object, false);
  });

  list.addEventListener("keydown", function (event) {
    var index = plates.indexOf(document.activeElement);
    if (index === -1) return;
    var step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    var next = plates[(index + step + plates.length) % plates.length];
    next.focus();
    select(next.dataset.select);
  });

  window.addEventListener("resize", function () {
    var selected = list.querySelector(".object.is-selected");
    if (selected) moveLight(selected);
  });

  /* ------------------------------------------- the photo dial (canvas) */

  var photoCanvas = document.getElementById("photo");
  var mix = document.getElementById("mix");
  var mixValue = document.getElementById("mix-value");
  var pctx = photoCanvas.getContext("2d", { willReadFrequently: true });
  var W = photoCanvas.width;
  var H = photoCanvas.height;

  var PALETTE = [
    [15, 23, 48],
    [51, 64, 110],
    [124, 138, 184],
    [230, 234, 246]
  ];
  var BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  var small = document.createElement("canvas");
  var sctx = small.getContext("2d", { willReadFrequently: true });
  var photo = new Image();
  var photoReady = false;
  var canReadPixels = true;
  var pending = null;

  photo.onload = function () {
    photoReady = true;
    render(Number(mix.value));
  };
  photo.onerror = function () {
    pctx.fillStyle = "#1a2140";
    pctx.fillRect(0, 0, W, H);
  };
  photo.src = "sample-photo.jpg";

  function drawOriginal() {
    pctx.filter = "none";
    pctx.globalAlpha = 1;
    pctx.drawImage(photo, 0, 0, W, H);
  }

  function render(value) {
    if (!photoReady) return;
    var t = value / 100;
    drawOriginal();
    if (t <= 0.001) return;

    var cell = Math.max(1, Math.round(1 + t * 11));
    var w = Math.max(8, Math.round(W / cell));
    var h = Math.max(6, Math.round(H / cell));
    small.width = w;
    small.height = h;
    sctx.imageSmoothingEnabled = true;
    sctx.clearRect(0, 0, w, h);
    sctx.drawImage(photo, 0, 0, w, h);

    if (canReadPixels) {
      try {
        quantize(w, h, t);
      } catch (err) {
        /* Opened straight from disk: reading the pixels of a local image
           taints the canvas, so fall back to a filter-only version. */
        canReadPixels = false;
      }
    }

    pctx.imageSmoothingEnabled = false;
    pctx.globalAlpha = t;
    if (!canReadPixels) pctx.filter = "grayscale(1) contrast(190%) brightness(105%)";
    pctx.drawImage(small, 0, 0, w, h, 0, 0, W, H);
    pctx.filter = "none";
    pctx.globalAlpha = 1;
    pctx.imageSmoothingEnabled = true;
  }

  function quantize(w, h, t) {
    var data = sctx.getImageData(0, 0, w, h);
    var px = data.data;
    var levels = PALETTE.length - 1;
    var spread = (255 / levels) * (0.35 + 0.65 * t);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        var noise = (BAYER[y & 3][x & 3] / 16 - 0.46875) * spread;
        var step = Math.round(((lum + noise) / 255) * levels);
        if (step < 0) step = 0;
        if (step > levels) step = levels;
        var tone = PALETTE[step];
        px[i] = tone[0];
        px[i + 1] = tone[1];
        px[i + 2] = tone[2];
      }
    }
    sctx.putImageData(data, 0, 0);
  }

  mix.addEventListener("input", function () {
    select("pixellate", false);
    mixValue.textContent = mix.value + "%";
    if (pending) return;
    pending = window.requestAnimationFrame(function () {
      pending = null;
      render(Number(mix.value));
    });
  });

  /* ------------------------------------------------ the print sketch */

  var HALF = [
    "..........",
    "........11",
    "......1122",
    ".....11222",
    "....112222",
    "...1122222",
    "...1222222",
    "...1224422",
    "...1225522",
    "...1222222",
    "...1222222",
    "...1122222",
    "....122222",
    "....112222",
    "...12.12.2",
    "...12.12.2",
    "...12.12.2",
    "......12.2",
    ".........2",
    ".........."
  ];

  var INK = {
    "1": "#5a2e52",
    "2": "#c0567e",
    "4": "#f2ede4",
    "5": "#241a2e"
  };

  var PASSES = [
    { key: "1", label: "Pass 1 of 4, outline" },
    { key: "2", label: "Pass 2 of 4, fill" },
    { key: "4", label: "Pass 3 of 4, eyes" },
    { key: "5", label: "Pass 4 of 4, pupils" }
  ];

  var grid = HALF.map(function (row) {
    return row + row.split("").reverse().join("");
  });
  var SIZE = grid.length;

  var drawCanvas = document.getElementById("draw");
  var dctx = drawCanvas.getContext("2d");
  var CELL = drawCanvas.width / SIZE;
  var printButton = document.getElementById("print");
  var printLabel = printButton.querySelector(".print-label");
  var passLabel = document.getElementById("pass-label");
  var led = document.getElementById("led");
  var passIndex = 0;
  var timer = null;

  function clearScreen() {
    dctx.fillStyle = "#141826";
    dctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    dctx.strokeStyle = "rgba(120, 138, 190, 0.14)";
    dctx.lineWidth = 1;
    for (var i = 1; i < SIZE; i++) {
      var p = Math.round(i * CELL) + 0.5;
      dctx.beginPath();
      dctx.moveTo(p, 0);
      dctx.lineTo(p, drawCanvas.height);
      dctx.moveTo(0, p);
      dctx.lineTo(drawCanvas.width, p);
      dctx.stroke();
    }
  }

  function cellsFor(key) {
    var cells = [];
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        if (grid[y][x] === key) cells.push([x, y]);
      }
    }
    return cells;
  }

  function paint(x, y, key) {
    dctx.fillStyle = INK[key];
    dctx.fillRect(Math.round(x * CELL), Math.round(y * CELL), Math.ceil(CELL), Math.ceil(CELL));
  }

  function cursor(x, y) {
    dctx.strokeStyle = "rgba(233, 166, 60, 0.95)";
    dctx.lineWidth = 2;
    dctx.strokeRect(Math.round(x * CELL) - 1, Math.round(y * CELL) - 1, CELL + 2, CELL + 2);
  }

  function repaintThrough(index) {
    clearScreen();
    for (var p = 0; p <= index; p++) {
      var key = PASSES[p].key;
      cellsFor(key).forEach(function (c) { paint(c[0], c[1], key); });
    }
  }

  function runPass() {
    var pass = PASSES[passIndex];
    var cells = cellsFor(pass.key);
    passLabel.textContent = pass.label;

    if (reduceMotion.matches) {
      repaintThrough(passIndex);
      finishPass();
      return;
    }

    printButton.disabled = true;
    led.classList.add("is-on");
    var i = 0;
    timer = window.setInterval(function () {
      if (i > 0) repaintThrough(passIndex - 1);
      for (var k = 0; k <= i && k < cells.length; k++) {
        paint(cells[k][0], cells[k][1], pass.key);
      }
      if (i < cells.length) cursor(cells[i][0], cells[i][1]);
      i++;
      if (i > cells.length) {
        window.clearInterval(timer);
        timer = null;
        repaintThrough(passIndex);
        led.classList.remove("is-on");
        printButton.disabled = false;
        finishPass();
      }
    }, Math.max(8, Math.round(700 / Math.max(cells.length, 1))));
  }

  function finishPass() {
    passIndex++;
    if (passIndex >= PASSES.length) {
      passLabel.textContent = "Done, 4 passes";
      printLabel.textContent = "Clear";
    } else {
      printLabel.textContent = "Print";
    }
  }

  printButton.addEventListener("click", function () {
    if (timer) return;
    if (passIndex >= PASSES.length) {
      passIndex = 0;
      clearScreen();
      passLabel.textContent = "Ready, 4 passes";
      printLabel.textContent = "Print";
      return;
    }
    runPass();
  });

  clearScreen();
  select("aweigh");
})();

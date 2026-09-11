(function () {
  "use strict";

  var A = "../../assets/";

  var SLIDES = [
    {
      id: "printing",
      name: "Printing the Dream",
      what: "photograph of the rig, mid draw",
      src: A + "portfolio/PrintingTheDream.webp",
      ar: 1280 / 876,
      film: false,
      alt: "A Nintendo Switch displaying octopus artwork in Tomodachi Life, connected over USB to a Raspberry Pi Pico with a small screen showing the drawing macro."
    },
    {
      id: "aweigh",
      name: "Aweigh",
      what: "screen from the iPhone app",
      src: A + "aweigh/ios-ferry-map.webp",
      ar: 1260 / 2736,
      film: true,
      alt: "The Aweigh map on iPhone, two ferries crossing Colvos Passage with a detail card for the M/V Kitsap underway from Southworth to Vashon Island."
    },
    {
      id: "pixellate",
      name: "Pixellate Camera",
      what: "app screens, cropped square",
      src: A + "portfolio/Pixellate.webp",
      ar: 1,
      film: false,
      alt: "Several iPhones running Pixellate Camera, each rendering its viewfinder in only four colors with dithering: an interstate, a curious cat, an arid tree, a campfire."
    },
    {
      id: "sanjuan",
      name: "May light, San Juan Islands",
      what: "photograph",
      src: "assets/san-juan-may-2600.jpg",
      thumb: "assets/san-juan-may-thumb.jpg",
      ar: 4 / 3,
      film: false,
      alt: "Late afternoon light over water and forested islands in the San Juans, seen from a bluff."
    }
  ];

  var mountWrap = document.querySelector(".mount-wrap");
  var strip = document.querySelector(".strip");
  var surface = document.querySelector(".panel-surface");
  var inspectBtn = document.getElementById("inspect-toggle");
  var magBtns = Array.prototype.slice.call(document.querySelectorAll(".ctl-mag"));

  if (!mountWrap || !strip) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mag = 2.6;
  var active = 0;
  var inspectMode = false;   // touch and keyboard mode: the loupe stays put until moved
  var windows = [];
  var loupe = document.createElement("div");
  loupe.className = "loupe";
  loupe.setAttribute("aria-hidden", "true");

  /* ------------------------------------------------------------- build DOM */

  SLIDES.forEach(function (s, i) {
    var mount = document.createElement("div");
    mount.className = "mount" + (s.film ? " mount--film" : "");
    mount.style.setProperty("--ar", String(s.ar));
    mount.id = "slide-" + s.id;
    mount.setAttribute("role", "tabpanel");
    mount.setAttribute("aria-labelledby", "chip-" + s.id);
    if (i !== 0) mount.hidden = true;

    var win = document.createElement("div");
    win.className = "window";
    win.tabIndex = 0;
    win.setAttribute("role", "group");
    win.setAttribute("aria-label", "Loupe over the " + s.name + " slide");
    win.setAttribute("aria-describedby", "loupe-how");

    var img = document.createElement("img");
    img.dataset.src = s.src;
    if (i === 0) img.src = s.src;
    img.alt = s.alt;
    img.decoding = "async";
    if (i !== 0) img.loading = "lazy";
    win.appendChild(img);

    var label = document.createElement("p");
    label.className = "mount-label";
    label.innerHTML = '<span class="lbl-name"></span><span class="lbl-what"></span>';
    label.querySelector(".lbl-name").textContent = s.name;
    label.querySelector(".lbl-what").textContent = s.what;

    mount.appendChild(win);
    mount.appendChild(label);
    mountWrap.appendChild(mount);

    windows.push({ slide: s, mount: mount, win: win, img: img, x: null, y: null });

    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.id = "chip-" + s.id;
    chip.setAttribute("role", "tab");
    chip.setAttribute("aria-controls", "slide-" + s.id);
    chip.setAttribute("aria-selected", i === 0 ? "true" : "false");
    chip.tabIndex = i === 0 ? 0 : -1;
    var ci = document.createElement("img");
    ci.className = "chip-img";
    ci.src = s.thumb || s.src;
    ci.alt = "";
    ci.loading = "lazy";
    ci.decoding = "async";
    var cn = document.createElement("span");
    cn.className = "chip-name";
    cn.textContent = s.name;
    chip.appendChild(ci);
    chip.appendChild(cn);
    chip.addEventListener("click", function () { select(i, true); });
    strip.appendChild(chip);
  });

  var chips = Array.prototype.slice.call(strip.querySelectorAll(".chip"));

  /* --------------------------------------------------------- slide select */

  function select(i, moveFocus) {
    if (i === active) return;
    var prev = windows[active];
    var next = windows[i];

    hideLoupe();
    prev.mount.hidden = true;
    prev.win.classList.remove("is-inspecting");

    if (!next.img.getAttribute("src")) {
      next.img.src = next.img.dataset.src;
      if (!next.img.complete) {
        surface.classList.add("is-warming");
        next.img.addEventListener("load", clearWarming, { once: true });
        next.img.addEventListener("error", clearWarming, { once: true });
      }
    }

    next.mount.hidden = false;
    if (inspectMode) next.win.classList.add("is-inspecting");
    active = i;

    chips.forEach(function (c, n) {
      c.setAttribute("aria-selected", n === i ? "true" : "false");
      c.tabIndex = n === i ? 0 : -1;
    });
    if (moveFocus === "chip") chips[i].focus();
  }

  function clearWarming() { surface.classList.remove("is-warming"); }

  strip.addEventListener("keydown", function (e) {
    var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (dir) {
      e.preventDefault();
      select((active + dir + chips.length) % chips.length, "chip");
    } else if (e.key === "Home") {
      e.preventDefault(); select(0, "chip");
    } else if (e.key === "End") {
      e.preventDefault(); select(chips.length - 1, "chip");
    }
  });

  /* ---------------------------------------------------------------- loupe */

  function current() { return windows[active]; }

  /* Where the image actually sits inside the window, given object-fit: cover. */
  function geometry(w) {
    var box = w.win.getBoundingClientRect();
    var nw = w.img.naturalWidth || 1;
    var nh = w.img.naturalHeight || 1;
    var scale = Math.max(box.width / nw, box.height / nh);
    return {
      box: box,
      w: nw * scale,
      h: nh * scale,
      ox: (box.width - nw * scale) / 2,
      oy: (box.height - nh * scale) / 2
    };
  }

  function place(x, y) {
    var w = current();
    var g = geometry(w);
    if (loupe.parentNode !== w.win) w.win.appendChild(loupe);

    /* the loupe is sized to the slide it sits on, so a 35mm strip does not
       disappear underneath it */
    var d = Math.max(104, Math.min(176,
      Math.round(Math.min(g.box.width, g.box.height) * 0.55)));
    loupe.style.setProperty("--loupe-d", d + "px");
    var r = d / 2;

    x = Math.max(0, Math.min(g.box.width, x));
    y = Math.max(0, Math.min(g.box.height, y));
    w.x = x; w.y = y;
    if (loupe.dataset.src !== w.slide.src) {
      loupe.style.backgroundImage = 'url("' + w.slide.src + '")';
      loupe.dataset.src = w.slide.src;
    }

    loupe.style.backgroundSize = (g.w * mag) + "px " + (g.h * mag) + "px";
    loupe.style.backgroundPosition =
      (g.ox * mag - (x * mag - r)) + "px " + (g.oy * mag - (y * mag - r)) + "px";
    loupe.style.transform = "translate3d(" + (x - r) + "px," + (y - r) + "px,0)";
    loupe.classList.add("is-on");
  }

  function hideLoupe() { loupe.classList.remove("is-on"); }

  function localPoint(w, e) {
    var box = w.win.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  mountWrap.addEventListener("pointermove", function (e) {
    var w = current();
    if (!w.win.contains(e.target)) return;
    if (e.pointerType === "touch" && !inspectMode) return;
    var p = localPoint(w, e);
    place(p.x, p.y);
  });

  mountWrap.addEventListener("pointerdown", function (e) {
    var w = current();
    if (!w.win.contains(e.target)) return;
    if (e.pointerType === "touch" && !inspectMode) return;
    var p = localPoint(w, e);
    place(p.x, p.y);
    if (e.pointerType === "touch") e.preventDefault();
  });

  mountWrap.addEventListener("pointerleave", function (e) {
    if (e.pointerType === "touch" || inspectMode) return;
    if (document.activeElement !== current().win) hideLoupe();
  });

  /* --------------------------------------------------------- keyboard use */

  mountWrap.addEventListener("focusin", function (e) {
    if (!e.target.classList.contains("window")) return;
    var w = current();
    if (typeof e.target.matches === "function" && !e.target.matches(":focus-visible")) return;
    var box = w.win.getBoundingClientRect();
    place(w.x == null ? box.width / 2 : w.x, w.y == null ? box.height / 2 : w.y);
  });

  mountWrap.addEventListener("focusout", function (e) {
    if (e.target.classList.contains("window") && !inspectMode) hideLoupe();
  });

  mountWrap.addEventListener("keydown", function (e) {
    if (!e.target.classList.contains("window")) return;
    var w = current();
    var box = w.win.getBoundingClientRect();
    var step = (e.shiftKey ? 0.015 : 0.06);
    var dx = 0, dy = 0;

    switch (e.key) {
      case "ArrowLeft":  dx = -1; break;
      case "ArrowRight": dx =  1; break;
      case "ArrowUp":    dy = -1; break;
      case "ArrowDown":  dy =  1; break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (loupe.classList.contains("is-on") && loupe.parentNode === w.win) hideLoupe();
        else place(w.x == null ? box.width / 2 : w.x, w.y == null ? box.height / 2 : w.y);
        return;
      case "Escape":
        hideLoupe();
        return;
      default:
        return;
    }

    e.preventDefault();
    var x = (w.x == null ? box.width / 2 : w.x) + dx * box.width * step;
    var y = (w.y == null ? box.height / 2 : w.y) + dy * box.height * step;
    place(x, y);
  });

  /* -------------------------------------------------------------- buttons */

  inspectBtn.addEventListener("click", function () {
    inspectMode = !inspectMode;
    inspectBtn.setAttribute("aria-pressed", String(inspectMode));
    var w = current();
    w.win.classList.toggle("is-inspecting", inspectMode);
    if (inspectMode) {
      var box = w.win.getBoundingClientRect();
      place(w.x == null ? box.width / 2 : w.x, w.y == null ? box.height / 2 : w.y);
    } else {
      hideLoupe();
    }
  });

  magBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      mag = parseFloat(b.dataset.mag);
      magBtns.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      var w = current();
      if (loupe.classList.contains("is-on") && w.x != null) place(w.x, w.y);
    });
  });

  window.addEventListener("resize", function () {
    var w = current();
    if (loupe.classList.contains("is-on") && w.x != null) place(w.x, w.y);
    else hideLoupe();
  });

  /* Prevent an image that has not decoded yet from magnifying into nothing. */
  windows[0].img.addEventListener("load", function () {
    var w = current();
    if (loupe.classList.contains("is-on") && w.x != null) place(w.x, w.y);
  });

  if (reduced.matches) loupe.style.transition = "none";
})();

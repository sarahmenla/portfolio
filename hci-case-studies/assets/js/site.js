document.documentElement.classList.remove("no-js");

/* ── Landing: word bubbles pop on the hovered screen ──── */
(() => {
  const shots = [...document.querySelectorAll(".splash__shot")];
  if (!shots.length) return;
  const setOn = (shot) => shots.forEach((s) => s.classList.toggle("is-on", s === shot));
  shots.forEach((shot) => {
    shot.addEventListener("pointerenter", () => setOn(shot));
    shot.addEventListener("pointerleave", () => shot.classList.remove("is-on"));
    shot.addEventListener("focus", () => setOn(shot));
    shot.addEventListener("blur", () => shot.classList.remove("is-on"));
  });
})();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ── Landing: stay on the opening, then glide down ───── */
(() => {
  const splash = $(".splash");
  const main = $("#main");
  if (!splash || !main) return;

  const pinOpening = () => {
    if (location.hash === "#main") {
      history.replaceState(null, "", location.pathname + location.search);
    }
    window.scrollTo(0, 0);
  };
  pinOpening();
  window.addEventListener("pageshow", pinOpening);

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const mainY = () => Math.max(0, main.getBoundingClientRect().top + window.scrollY - 88);

  let gliding = false;
  const glide = (to) => {
    if (gliding) return;
    const from = window.scrollY;
    const dist = to - from;
    if (Math.abs(dist) < 2) return;
    if (reduceMotion) {
      window.scrollTo(0, to);
      return;
    }
    gliding = true;
    const start = performance.now();
    const ms = Math.min(1200, Math.max(780, Math.abs(dist) * 0.85));
    document.documentElement.style.scrollBehavior = "auto";
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      window.scrollTo(0, from + dist * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else {
        gliding = false;
        document.documentElement.style.scrollBehavior = "";
      }
    };
    requestAnimationFrame(tick);
  };

  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || reduceMotion) return;

  let acc = 0;
  let accTimer = 0;
  window.addEventListener("wheel", (e) => {
    if (gliding) {
      e.preventDefault();
      return;
    }
    if (window.scrollY > 36 || e.deltaY <= 0) {
      acc = 0;
      return;
    }
    e.preventDefault();
    acc += e.deltaY;
    clearTimeout(accTimer);
    accTimer = setTimeout(() => { acc = 0; }, 220);
    if (acc > 42) {
      acc = 0;
      glide(mainY());
    }
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (gliding || window.scrollY > 36) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) return;
    if (e.key === " " || e.key === "PageDown" || e.key === "ArrowDown") {
      e.preventDefault();
      glide(mainY());
    }
  });
})();

/* ── Reading progress ─────────────────────────────────── */
(() => {
  const bar = $(".progress");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
})();

/* ── Reveal on scroll ─────────────────────────────────── */
(() => {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }),
    { rootMargin: "24px 0px 20% 0px", threshold: 0.01 }
  );
  items.forEach((el) => io.observe(el));
})();

/* ── Contents scrollspy ───────────────────────────────── */
(() => {
  const links = $$(".toc a");
  if (!links.length) return;
  const sections = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  const setActive = (id) => links.forEach((a) => a.setAttribute("aria-current", a.hash === `#${id}` ? "true" : "false"));
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin: "-20% 0px -65% 0px" }
  );
  sections.forEach((s) => io.observe(s));
})();

/* ── Tabs (WAI-ARIA pattern) ──────────────────────────── */
$$("[data-tabs]").forEach((root) => {
  const tabs = $$('[role="tab"]', root);
  const select = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (!panel) return;
      panel.hidden = !on;
      if (on) {
        panel.querySelectorAll("img").forEach((img) => {
          if (img.loading === "lazy") img.loading = "eager";
        });
      }
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t) => {
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    panel?.querySelectorAll("img[loading='lazy']").forEach((img) => { img.loading = "eager"; });
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in keys) {
        e.preventDefault();
        select(tabs[(i + keys[e.key] + tabs.length) % tabs.length], true);
      } else if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
      else if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
});

/* ── Before / after slider ────────────────────────────── */
$$(".compare").forEach((root) => {
  const input = $("input[type=range]", root);
  const set = (v) => root.style.setProperty("--pos", `${v}%`);
  set(input.value);
  input.addEventListener("input", () => set(input.value));
});

/* ── Theory map filter ────────────────────────────────── */
$$("[data-theory]").forEach((root) => {
  const buttons = $$(".filter", root);
  const cards = $$(".decision", root);
  const status = $(".filter-status", root);
  const apply = (key) => {
    let hits = 0;
    cards.forEach((c) => {
      const match = key === "all" || c.dataset.tags.split(" ").includes(key);
      c.classList.toggle("is-dim", !match);
      c.classList.toggle("is-hit", match && key !== "all");
      if (match) hits++;
    });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.key === key)));
    if (status) {
      const name = buttons.find((b) => b.dataset.key === key)?.textContent.trim();
      status.textContent = key === "all"
        ? `Showing all ${cards.length} design decisions.`
        : `${name} shaped ${hits} of ${cards.length} decisions.`;
    }
  };
  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.key)));
  apply("all");
});

/* ── Heuristic table filter ───────────────────────────── */
$$("[data-heuristics]").forEach((root) => {
  const buttons = $$(".filter", root);
  const rows = $$("tbody tr", root);
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      const key = b.dataset.key;
      rows.forEach((r) => (r.hidden = key !== "all" && r.dataset.result !== key));
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    })
  );
});

/* ── Lightbox ─────────────────────────────────────────── */
(() => {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Enlarged image");
  box.innerHTML = '<button type="button" aria-label="Close enlarged image">×</button><figure><img alt=""><p></p></figure>';
  document.body.append(box);
  const img = $("img", box);
  const cap = $("p", box);
  const close = $("button", box);
  let opener = null;
  const hide = () => { box.hidden = true; document.body.style.overflow = ""; opener?.focus(); };
  const show = (src, alt, trigger) => {
    opener = trigger;
    img.src = src; img.alt = alt; cap.textContent = alt;
    box.hidden = false; document.body.style.overflow = "hidden";
    close.focus();
  };
  $$("img[data-zoom]").forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Enlarge: ${el.alt}`);
    const open = () => show(el.dataset.zoom || el.src, el.alt, el);
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  close.addEventListener("click", hide);
  box.addEventListener("click", (e) => { if (e.target === box) hide(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") hide();
    if (e.key === "Tab") { e.preventDefault(); close.focus(); }
  });
})();

/* ── Speech helper ────────────────────────────────────── */
function speak(text, { rate = 0.95, onBoundary, onEnd } = {}) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = rate;
  if (onBoundary) u.onboundary = onBoundary;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  window.speechSynthesis.speak(u);
  return true;
}

/* ── Interface 1: selection is not activation ─────────── */
(() => {
  const root = $("#carousel-demo");
  if (!root) return;
  const cards = $$(".cdemo__card", root);
  const live = $(".cdemo__live", root);
  const log = $(".cdemo__log", root);
  const calmBtn = $("[data-calm]", root);
  let active = 0;
  let opened = 0;

  const render = () => {
    cards.forEach((c, i) => {
      c.classList.toggle("is-active", i === active);
      c.setAttribute("aria-selected", String(i === active));
      c.tabIndex = i === active ? 0 : -1;
    });
  };
  const move = (d, focus = true) => {
    active = Math.max(0, Math.min(cards.length - 1, active + d));
    render();
    if (focus) cards[active].focus();
    live.textContent = `Selected ${cards[active].dataset.title}. Nothing opens until you press Open.`;
  };
  const open = () => {
    opened++;
    const title = cards[active].dataset.title;
    live.textContent = `Opening ${title}.`;
    log.innerHTML = `<b>${title}</b> opened by an explicit press. Books opened by accident while browsing: <b>0</b>.`;
  };

  cards.forEach((c, i) => {
    c.addEventListener("click", () => { active = i; render(); live.textContent = `Selected ${c.dataset.title}.`; });
    c.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
  $("[data-prev]", root).addEventListener("click", () => move(-1, false));
  $("[data-next]", root).addEventListener("click", () => move(1, false));
  $("[data-open]", root).addEventListener("click", open);
  calmBtn.addEventListener("click", () => {
    const on = calmBtn.getAttribute("aria-pressed") !== "true";
    calmBtn.setAttribute("aria-pressed", String(on));
    calmBtn.textContent = on ? "Calm Mode on" : "Calm Mode off";
    root.classList.toggle("is-calm", on);
  });
  render();
})();

/* ── Interface 2: Read Aloud with word highlighting ───── */
(() => {
  const root = $("#readaloud-demo");
  if (!root) return;
  const textEl = $(".ra__text", root);
  const btn = $("[data-speak]", root);
  const note = $(".ra__note", root);
  const text = textEl.textContent.trim().replace(/\s+/g, " ");
  const words = text.split(" ");
  textEl.innerHTML = words.map((w) => `<span>${w}</span>`).join(" ");
  const spans = $$("span", textEl);
  const offsets = [];
  words.reduce((pos, w) => { offsets.push(pos); return pos + w.length + 1; }, 0);

  const reset = () => {
    spans.forEach((s) => s.classList.remove("is-on"));
    btn.setAttribute("aria-pressed", "false");
    btn.lastChild.textContent = " Read Aloud";
  };
  btn.addEventListener("click", () => {
    if (btn.getAttribute("aria-pressed") === "true") { window.speechSynthesis?.cancel(); reset(); return; }
    const ok = speak(text, {
      rate: 0.9,
      onBoundary: (e) => {
        if (e.name && e.name !== "word") return;
        let idx = offsets.findIndex((o, i) => e.charIndex >= o && (i === offsets.length - 1 || e.charIndex < offsets[i + 1]));
        spans.forEach((s, i) => s.classList.toggle("is-on", i === idx));
      },
      onEnd: reset,
    });
    if (!ok) { note.textContent = "This browser does not support speech synthesis, so Read Aloud cannot play here."; return; }
    btn.setAttribute("aria-pressed", "true");
    btn.lastChild.textContent = " Stop";
  });
})();

/* ── Interface 2: X-ray zoom and invert ───────────────── */
(() => {
  const root = $("#xray-demo");
  if (!root) return;
  const img = $("img", root);
  const level = $(".xr__level", root);
  let zoom = 1;
  let inverted = false;
  const apply = () => {
    img.style.transform = `scale(${zoom})`;
    img.style.filter = inverted ? "invert(1)" : "none";
    level.textContent = `${Math.round(zoom * 100)}%`;
  };
  $("[data-zoom-in]", root).addEventListener("click", () => { zoom = Math.min(3, zoom + 0.25); apply(); });
  $("[data-zoom-out]", root).addEventListener("click", () => { zoom = Math.max(1, zoom - 0.25); apply(); });
  $("[data-reset]", root).addEventListener("click", () => { zoom = 1; inverted = false; invertBtn.setAttribute("aria-pressed", "false"); apply(); });
  const invertBtn = $("[data-invert]", root);
  invertBtn.addEventListener("click", () => {
    inverted = !inverted;
    invertBtn.setAttribute("aria-pressed", String(inverted));
    apply();
  });
  apply();
})();

/* ── Contrast calculator (WCAG 2.1 relative luminance) ── */
function luminance(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
$$("[data-contrast]").forEach((el) => {
  const [fg, bg] = el.dataset.contrast.split(",");
  const ratio = contrast(fg, bg);
  const out = $(".ratio", el);
  const badge = $(".grade", el);
  out.textContent = `${ratio.toFixed(2)} : 1`;
  const grade = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large text" : "Fails";
  badge.textContent = grade;
  badge.className = `grade pill ${ratio >= 4.5 ? "pill--pass" : ratio >= 3 ? "pill--medium" : "pill--high"}`;
});

/* ── Interface 3: screen reader simulator ─────────────── */
(() => {
  const root = $("#sr-demo");
  if (!root) return;
  const log = $(".sr__log", root);
  const colours = $$('[data-group="colour"] [role=radio]', root);
  const sizes = $$('[data-group="size"] [role=radio]', root);
  const addBtn = $("[data-add]", root);
  const bagCount = $(".sr__bag b", root);
  const voice = $("[data-voice]", root);
  const defaultColour = colours[0].dataset.value;
  let colour = defaultColour;
  let size = null;
  let bag = 0;

  const say = (text, kind = "speech") => {
    const li = document.createElement("li");
    li.className = `is-${kind}`;
    li.innerHTML = `<span>${kind === "live" ? "Live region" : kind === "error" ? "Error" : "Screen reader"}</span>${text}`;
    log.prepend(li);
    while (log.children.length > 6) log.lastChild.remove();
    if (voice.getAttribute("aria-pressed") === "true") speak(text, { rate: 1.05 });
  };

  const setupGroup = (radios, label, onPick) => {
    radios.forEach((r, i) => {
      r.addEventListener("focus", () => {
        const checked = r.getAttribute("aria-checked") === "true";
        say(`${label} ${r.dataset.value}${checked ? ", currently selected" : ""}, radio button, ${i + 1} of ${radios.length}.`);
      });
      const pick = () => {
        radios.forEach((x, j) => { x.setAttribute("aria-checked", String(j === i)); x.tabIndex = j === i ? 0 : -1; });
        onPick(r.dataset.value);
        say(`${label} ${r.dataset.value} selected.`);
      };
      r.addEventListener("click", pick);
      r.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) {
          e.preventDefault();
          const next = radios[(i + d + radios.length) % radios.length];
          next.focus();
          next.click();
        }
        if (e.key === " ") { e.preventDefault(); pick(); }
      });
    });
  };
  setupGroup(colours, "Colour", (v) => (colour = v));
  setupGroup(sizes, "Size", (v) => (size = v));

  addBtn.addEventListener("focus", () =>
    say(`Add to bag. ${colour ? `Colour: ${colour}.` : "No colour selected."} ${size ? `Size: ${size}.` : "No size selected."} Price: £49.99. Button.`)
  );
  addBtn.addEventListener("click", () => {
    if (!size) { say("Please select a size first. Use arrow keys to choose from the size options.", "error"); return; }
    if (!colour) { say("Please select a colour first. Use arrow keys to choose from the colour options.", "error"); return; }
    bag++;
    bagCount.textContent = bag;
    say(`Chunky Knit Jumper in ${colour}, size ${size}, added to your bag. Press B to view your bag.`, "live");
  });
  voice.addEventListener("click", () => {
    const on = voice.getAttribute("aria-pressed") !== "true";
    voice.setAttribute("aria-pressed", String(on));
    voice.textContent = on ? "Voice on" : "Voice off";
    if (!on) window.speechSynthesis?.cancel();
  });
  $("[data-clear]", root).addEventListener("click", () => {
    log.innerHTML = "";
    colour = defaultColour; size = null; bag = 0;
    bagCount.textContent = "0";
    colours.forEach((r, i) => { r.setAttribute("aria-checked", String(i === 0)); r.tabIndex = i === 0 ? 0 : -1; });
    sizes.forEach((r, i) => { r.setAttribute("aria-checked", "false"); r.tabIndex = i === 0 ? 0 : -1; });
  });
})();

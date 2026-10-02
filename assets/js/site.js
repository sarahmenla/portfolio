const orders = {
  all: ["hci", "auto", "rovera", "shade", "fee", "library", "nicola", "vr", "oaxaca", "art", "bob", "voice"],
  ai: ["rovera", "shade", "voice", "bob", "auto", "hci", "library", "fee", "oaxaca", "vr", "art", "nicola"],
  data: ["auto", "library", "rovera", "hci", "shade", "fee", "oaxaca", "bob", "vr", "art", "nicola", "voice"],
  health: ["hci", "library", "auto", "shade", "fee", "vr", "nicola", "art", "rovera", "oaxaca", "bob", "voice"],
  engineering: ["auto", "rovera", "oaxaca", "bob", "hci", "library", "fee", "vr", "shade", "art", "nicola", "voice"],
  design: ["hci", "library", "fee", "nicola", "art", "vr", "shade", "auto", "rovera", "oaxaca", "bob", "voice"],
  product: ["fee", "hci", "auto", "shade", "library", "nicola", "rovera", "vr", "oaxaca", "art", "bob", "voice"]
};

const aliases = {
  ml: "ai", ai: "ai", "machine-learning": "ai", dl: "ai", "deep-learning": "ai",
  data: "data", analytics: "data",
  health: "health", medtech: "health", healthcare: "health",
  engineering: "engineering", robotics: "engineering", software: "engineering",
  design: "design", ux: "design", ui: "design", hci: "design", ucd: "design", "3d": "design",
  product: "product", pm: "product"
};

const notes = {
  all: "Everything, in the order I would walk someone through it.",
  ai: "For AI, machine learning, and deep learning. The models sit inside a product: a route, a colour decision, a voice agent.",
  data: "For data and analytics. Start with the internship automation, then the Mars route, which fuses several layers into one decision.",
  health: "For health and medtech. The dental portal is the deepest build. The NHS-affiliated work, in Experience, was advisory.",
  engineering: "For software engineering and robotics. Working systems: an automation, a search, a robot, a full-stack app.",
  design: "For UX, UI, HCI, and product design. Research, the interface, and the thing a person actually uses.",
  product: "For product management. Framing the problem, leading the design, and getting a prototype in front of people."
};

const titles = {
  all: "Sarah Menla · Portfolio",
  ai: "Sarah Menla · AI and machine learning",
  data: "Sarah Menla · Data",
  health: "Sarah Menla · Health",
  engineering: "Sarah Menla · Engineering",
  design: "Sarah Menla · Design",
  product: "Sarah Menla · Product"
};

const params = new URLSearchParams(location.search);
const asked = (params.get("for") || "all").toLowerCase();
const key = orders[aliases[asked] || asked] ? (aliases[asked] || asked) : "all";

document.getElementById("lens-note").textContent = notes[key];
document.title = titles[key];
document.querySelectorAll(".lenses a").forEach((link) => {
  if (link.dataset.lens === key) link.setAttribute("aria-current", "true");
  else link.removeAttribute("aria-current");
});

const grid = document.getElementById("work-grid");
const rest = document.getElementById("work-rest");
const restWrap = document.getElementById("rest-wrap");
const byId = Object.fromEntries([...document.querySelectorAll(".card")].map((card) => [card.dataset.id, card]));

orders[key].forEach((id) => {
  const card = byId[id];
  if (!card) return;
  const tags = card.dataset.tags.split(/\s+/);
  const match = key === "all" || tags.includes(key);
  card.classList.remove("card--lead");
  (match ? grid : rest).appendChild(card);
});

const first = grid.querySelector(".card");
if (first) first.classList.add("card--lead");
restWrap.hidden = rest.children.length === 0;

const shown = grid.children.length;
document.getElementById("work-count").textContent = key === "all"
  ? `${shown} projects`
  : `${shown} in front for this role`;

document.querySelectorAll(".timeline li").forEach((item) => {
  const tags = (item.dataset.tags || "").split(/\s+/).filter(Boolean);
  item.classList.toggle("is-on", key !== "all" && tags.includes(key));
});

const copy = document.getElementById("copy-link");
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copy.textContent = "Copied";
  } catch {
    copy.textContent = "Copy the address bar";
  }
  setTimeout(() => { copy.textContent = "Copy this view"; }, 1600);
});

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".card, .timeline li, .skill-board article").forEach((el, i) => {
    el.style.animationDelay = `${Math.min(i, 8) * 40}ms`;
    el.classList.add("reveal");
  });
}

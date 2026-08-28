var ART = {
  Scout: "desk/scout.jpg?v=floor4",
  Wx: "desk/wx.jpg?v=floor4",
  Johnny: "desk/johnny.jpg?v=floor4",
  Trader: "desk/trader.jpg?v=floor4",
  Printer: "desk/printer.jpg?v=floor4",
  Macro: "desk/macro.jpg?v=floor4"
};
var ADD_RE = /\+\$?([\d,]+(?:\.\d+)?)\s*add/i;
var REST_RE = /(\d+)\s*Yes\s*@\s*(\d+(?:\.\d+)?)c/i;

function usd(n) {
  if (n == null || isNaN(n)) return "\u2014";
  return (n < 0 ? "-" : "") + "$" + Math.abs(Number(n)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function signed(n) { return n > 0 ? "+" + usd(n) : usd(n); }
function addInNote(note) {
  var m = String(note || "").match(ADD_RE);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}
function parseAdds(series) {
  return (series || []).reduce(function (a, p) { return a + addInNote(p.note); }, 0);
}
function addsThrough(series) {
  var run = 0;
  return (series || []).map(function (p) { run += addInNote(p.note); return run; });
}
function sum(arr, key) {
  return (arr || []).reduce(function (a, x) { return a + Number(x[key] || 0); }, 0);
}
function liveRest(side) {
  var m = String(side || "").match(REST_RE);
  return m ? Number(m[1]) * (Number(m[2]) / 100) : 0;
}
function liveRests(live) {
  return (live || []).reduce(function (a, r) { return a + liveRest(r.side); }, 0);
}
function accent(name) {
  if (name === "Wx" || name === "Printer") return "mint";
  if (name === "Johnny" || name === "Macro") return "gold";
  return "cyan";
}
function kindTone(kind) {
  if (kind === "PRINT" || kind === "CLEAR" || kind === "PASS") return "mint";
  if (kind === "KILL" || kind === "NO") return "dead";
  if (kind === "NOTE") return "gold";
  return "cyan";
}
function tickClock() {
  var el = document.getElementById("clock");
  if (!el) return;
  el.textContent = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).replace(/\s(AM|PM)/, function (_, p) { return " " + p + " ET"; }).replace(",", "");
}
setInterval(tickClock, 1000);
tickClock();

function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function tot(label, value, cls) {
  var wrap = el("div", "tot");
  wrap.appendChild(el("label", "", label));
  wrap.appendChild(el("b", cls || "", value));
  return wrap;
}

function confetti() {
  var c = ["#3dffa6", "#5ce1ff", "#ffc14a"];
  for (var i = 0; i < 18; i++) {
    var d = el("div", "confetti");
    d.style.left = (12 + Math.random() * 76) + "vw";
    d.style.top = "4vh";
    d.style.background = c[i % c.length];
    document.body.appendChild(d);
    setTimeout(function (node) { node.remove(); }, 1200, d);
  }
}

var chart, lastSig = "";

function draw(s) {
  var first = (s.series && s.series[0]) || { cash: s.cash, allIn: s.allInMid, t: "" };
  var adds = parseAdds(s.series);
  var startAllIn = Number(first.allIn || 0);
  var tradePnl = Number(s.allInMid) - startAllIn - adds;
  document.getElementById("cash").textContent = usd(s.cash);
  document.getElementById("allin").textContent = usd(s.allInMid);
  document.getElementById("allinBid").textContent = usd(s.allInBid);
  document.getElementById("asof").textContent = s.asOfLabel || "\u2014";
  document.getElementById("scoreboard").textContent = s.scoreboard || "";
  var pnlEl = document.getElementById("tradePnl");
  pnlEl.textContent = signed(tradePnl);
  pnlEl.className = tradePnl > 0 ? "mint" : tradePnl < 0 ? "dead" : "gold";

  var totals = document.getElementById("totals");
  totals.replaceChildren(
    tot("Start all-in", usd(startAllIn), ""),
    tot("Capital added", usd(adds), "gold"),
    tot("Trading P/L", signed(tradePnl), tradePnl >= 0 ? "mint" : "dead"),
    tot("Printed $", usd(sum(s.printed, "cost")), "mint"),
    tot("Dead premium", usd(sum(s.dead, "cost")), "dead"),
    tot("Live rests", usd(liveRests(s.live)), "cyan")
  );

  var stations = document.getElementById("stations");
  stations.replaceChildren();
  (s.seats || []).forEach(function (seat) {
    var art = ART[seat.name] || ART.Scout;
    var card = el("article", "station");
    var meta = el("div", "station-meta");
    var row = el("div", "row");
    row.appendChild(el("h2", "", seat.name));
    row.appendChild(el("span", "role " + accent(seat.name), seat.role));
    meta.appendChild(row);
    var st = el("p", "", seat.state);
    st.title = seat.state || "";
    meta.appendChild(st);
    var wrap = el("div", "station-art");
    var img = el("img");
    img.src = art;
    img.alt = "";
    wrap.appendChild(img);
    card.appendChild(meta);
    card.appendChild(wrap);
    stations.appendChild(card);
  });

  var tape = s.tape || [];
  var list = document.getElementById("tape-list");
  list.replaceChildren();
  tape.forEach(function (e) {
    var row = el("div", "ev");
    var meta = el("div", "meta");
    meta.appendChild(el("span", "", e.et));
    meta.appendChild(el("span", "who", e.who));
    meta.appendChild(el("span", kindTone(e.kind), e.kind));
    row.appendChild(meta);
    row.appendChild(el("div", "text", e.text));
    list.appendChild(row);
  });

  if (tape[0]) {
    var who = String(tape[0].who || "Desk");
    var route = document.getElementById("route");
    route.textContent = "Routing \u00b7 " + who;
    route.className = "route " + accent(who);
    var sig = tape[0].et + "|" + tape[0].kind + "|" + tape[0].text;
    if (lastSig && sig !== lastSig && /PRINT|CLEAR|PASS/.test(tape[0].kind || "")) confetti();
    lastSig = sig;
  }

  var bits = [];
  (s.live || []).forEach(function (p) {
    bits.push(["cyan", "LIVE  " + p.city + "  " + p.bin + "  " + p.side]);
  });
  (s.printed || []).forEach(function (p) {
    bits.push(["mint", "PRINT  " + p.city + "  CLI " + p.cli + "  " + usd(p.cost)]);
  });
  (s.dead || []).forEach(function (p) {
    bits.push(["dead", "DEAD  " + p.city + "  " + p.why + "  " + usd(p.cost)]);
  });
  var ticker = document.getElementById("ticker");
  ticker.replaceChildren();
  var loop = bits.length ? bits.concat(bits) : [["", "desk idle"]];
  loop.forEach(function (item) { ticker.appendChild(el("span", item[0], item[1])); });

  var labels = (s.series || []).map(function (x) { return x.t; });
  var run = addsThrough(s.series);
  var growth = (s.series || []).map(function (x, i) { return Number(x.allIn) - startAllIn - run[i]; });
  var zero = labels.map(function () { return 0; });
  if (window.Chart) {
    var ctx = document.getElementById("pnl");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Zero",
            data: zero,
            borderColor: "rgba(232,246,255,0.35)",
            borderDash: [4, 4],
            pointRadius: 0,
            borderWidth: 1,
            tension: 0
          },
          {
            label: "Trading P/L",
            data: growth,
            borderColor: "#ffc14a",
            backgroundColor: "rgba(255,193,74,0.12)",
            fill: false,
            tension: 0.32,
            pointRadius: 3,
            pointBackgroundColor: "#ffc14a",
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (item) {
                if (item.dataset.label === "Zero") return "0 line";
                var n = Number(item.raw);
                return "Trading P/L  " + (n > 0 ? "+" : "") + usd(n);
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#8aa0b8", font: { size: 10 }, maxRotation: 40, minRotation: 0, autoSkip: false },
            grid: { display: false },
            border: { color: "#1c2a55" },
            title: { display: true, text: "Time", color: "#4d6080", font: { size: 10 } }
          },
          y: {
            ticks: {
              color: "#8aa0b8",
              font: { size: 10 },
              callback: function (v) {
                var n = Number(v);
                return (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
              }
            },
            grid: { color: "rgba(92,225,255,0.10)" },
            border: { color: "#1c2a55" },
            title: { display: true, text: "P/L $", color: "#4d6080", font: { size: 10 } },
            suggestedMin: Math.min.apply(null, [0].concat(growth)),
            suggestedMax: Math.max.apply(null, [0].concat(growth))
          }
        }
      }
    });
  }
}

function load() {
  fetch("state.json?ts=" + Date.now(), { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("feed " + r.status);
      return r.json();
    })
    .then(draw)
    .catch(function (err) {
      var route = document.getElementById("route");
      if (route) route.textContent = "NO STATE";
      console.error(err);
    });
}
load();
setInterval(load, 8000);

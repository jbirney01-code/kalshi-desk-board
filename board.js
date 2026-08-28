function money2(n){
  if (n == null || isNaN(n)) return "—";
  var sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(Number(n)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function tickClock(){
  var et = new Date().toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});
  document.getElementById("clock").textContent = et + " ET";
}
setInterval(tickClock,1000); tickClock();

function sum(arr, key){
  return (arr || []).reduce(function(a,x){ return a + Number(x[key] || 0); }, 0);
}
function addInNote(note){
  var m = String(note || "").match(/\+\$?([\d,]+(?:\.\d+)?)\s*add/i);
  return m ? Number(m[1].replace(/,/g,"")) : 0;
}
function parseAdds(series){
  return (series || []).reduce(function(a,p){ return a + addInNote(p.note); }, 0);
}
function addsThrough(series){
  var run = 0;
  return (series || []).map(function(p){
    run += addInNote(p.note);
    return run;
  });
}

var chart;
function draw(s){
  document.getElementById("cash").textContent = money2(s.cash);
  document.getElementById("allin").textContent = money2(s.allInMid);
  document.getElementById("allinBid").textContent = money2(s.allInBid);
  document.getElementById("asof").textContent = s.asOfLabel;

  var printedCost = sum(s.printed, "cost");
  var deadCost = sum(s.dead, "cost");
  var liveCount = (s.live || []).length;
  var printCount = (s.printed || []).length;
  var deadCount = (s.dead || []).length;
  var first = (s.series && s.series[0]) || { cash: s.cash, allIn: s.allInMid };
  var adds = parseAdds(s.series);
  var startAllIn = Number(first.allIn || 0);
  var tradePnl = Number(s.allInMid) - startAllIn - adds;

  var pnlEl = document.getElementById("tradePnl");
  pnlEl.textContent = (tradePnl >= 0 ? "+" : "") + money2(tradePnl);
  var wrap = document.getElementById("pnlMetric");
  wrap.classList.toggle("up", tradePnl >= 0);
  wrap.classList.toggle("down", tradePnl < 0);

  document.getElementById("totals").innerHTML = [
    tot("Start all-in", money2(startAllIn), first.t || "first snap"),
    tot("Capital added", money2(adds), "excluded from P/L"),
    tot("Trading P/L", (tradePnl>=0?"+":"") + money2(tradePnl), "all-in \u2212 start \u2212 adds"),
    tot("Printed", money2(printedCost), printCount + " cities"),
    tot("Dead premium", money2(deadCost), deadCount + " cities"),
    tot("Live rests", String(liveCount), "cash " + money2(s.cash))
  ].join("");

  document.getElementById("growthNote").textContent =
    "All-in " + money2(s.allInMid) + " \u00b7 cash " + money2(s.cash) + " \u00b7 " + (s.scoreboard || "");

  document.getElementById("seats").innerHTML = (s.seats || []).map(function(x){
    return "<div class=seat><strong>"+x.name+"</strong><em>"+x.role+"</em><div class=st>"+x.state+"</div></div>";
  }).join("");

  var rows = [];
  (s.live || []).forEach(function(p){
    rows.push("<tr><td><span class=\"tag live\">LIVE</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.side+"</td><td>"+p.status+"</td></tr>");
  });
  (s.printed || []).forEach(function(p){
    rows.push("<tr><td><span class=\"tag print\">PRINT</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.qty+" Yes CLI "+p.cli+"</td><td>cost "+money2(p.cost)+"</td></tr>");
  });
  (s.dead || []).forEach(function(p){
    rows.push("<tr><td><span class=\"tag dead\">DEAD</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.why+"</td><td>cost "+money2(p.cost)+"</td></tr>");
  });
  document.getElementById("book").innerHTML = "<thead><tr><th></th><th>City</th><th>Bin</th><th></th><th></th></tr></thead><tbody>"+rows.join("")+"</tbody>";
  document.getElementById("tape-list").innerHTML = (s.tape || []).map(function(e){
    return "<div class=\"ev "+e.kind+"\"><div class=meta><span>"+e.et+"</span><span>"+e.who+"</span><span class=kind>"+e.kind+"</span></div><div>"+e.text+"</div></div>";
  }).join("");

  var labels = (s.series || []).map(function(x){ return x.t; });
  var cash = (s.series || []).map(function(x){ return x.cash; });
  var allIn = (s.series || []).map(function(x){ return x.allIn; });
  var runningAdds = addsThrough(s.series);
  var growth = (s.series || []).map(function(x,i){ return Number(x.allIn) - startAllIn - runningAdds[i]; });
  var ctx = document.getElementById("pnl");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "All-in mid", data: allIn, borderColor: "#3dffa6", backgroundColor: "rgba(61,255,166,0.10)", fill: true, tension: 0.28, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2 },
        { label: "Cash", data: cash, borderColor: "#6ea8ff", backgroundColor: "transparent", tension: 0.28, pointRadius: 4, borderWidth: 2 },
        { label: "Trading P/L", data: growth, borderColor: "#ffc14a", backgroundColor: "transparent", tension: 0.28, pointRadius: 3, borderWidth: 2, borderDash: [4,3], yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: { labels: { color: "#8b95a7", boxWidth: 10 } },
        tooltip: {
          callbacks: {
            afterLabel: function(c){ return (s.series[c.dataIndex] && s.series[c.dataIndex].note) || ""; }
          }
        }
      },
      scales: {
        x: { ticks: { color: "#8b95a7" }, grid: { color: "#1c212b" } },
        y: { ticks: { color: "#8b95a7", callback: function(v){ return "$"+v; } }, grid: { color: "#1c212b" } },
        y1: {
          position: "right",
          ticks: { color: "#ffc14a", callback: function(v){ return (v>=0?"+":"")+ "$"+v; } },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function tot(label, value, sub){
  return "<div class=tot><label>"+label+"</label><b>"+value+"</b><div class=sub>"+sub+"</div></div>";
}

function load(){
  fetch("state.json?ts="+Date.now()).then(function(r){ return r.json(); }).then(draw);
}
load();
setInterval(load, 8000);

function money2(n){
  if (n == null || isNaN(n)) return "\u2014";
  var sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(Number(n)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function tickClock(){
  var et = new Date().toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});
  document.getElementById("clock").textContent = et + " ET";
}
setInterval(tickClock,1000); tickClock();
function sum(arr, key){ return (arr||[]).reduce(function(a,x){ return a + Number(x[key]||0); },0); }
function addInNote(note){
  var m = String(note||"").match(/\+\$?([\d,]+(?:\.\d+)?)\s*add/i);
  return m ? Number(m[1].replace(/,/g,"")) : 0;
}
function parseAdds(series){ return (series||[]).reduce(function(a,p){ return a + addInNote(p.note); },0); }
function addsThrough(series){
  var run = 0;
  return (series||[]).map(function(p){ run += addInNote(p.note); return run; });
}
function tot(label,value,sub){
  return "<div class=tot><label>"+label+"</label><b>"+value+"</b><div class=sub>"+sub+"</div></div>";
}
function spark(canvas, values, color){
  if (!canvas || !values.length) return;
  var w = canvas.width = canvas.clientWidth * 2 || 176;
  var h = canvas.height = canvas.clientHeight * 2 || 80;
  var ctx = canvas.getContext("2d");
  var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
  if (min === max) { min -= 1; max += 1; }
  ctx.clearRect(0,0,w,h);
  ctx.beginPath();
  values.forEach(function(v,i){
    var x = values.length===1 ? w/2 : i/(values.length-1)*w;
    var y = h - (v-min)/(max-min)*h;
    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  });
  ctx.strokeStyle = color || "#3dffa6";
  ctx.lineWidth = 3;
  ctx.stroke();
}
function confetti(){
  var colors = ["#3dffa6","#5ce1ff","#ff5dcc","#ffc14a","#6ea8ff"];
  for (var i=0;i<18;i++){
    var d = document.createElement("div");
    d.className = "confetti";
    d.style.left = (20 + Math.random()*60) + "vw";
    d.style.top = "8vh";
    d.style.background = colors[i%colors.length];
    document.getElementById("fx").appendChild(d);
    setTimeout(function(el){ el.remove(); }, 1400, d);
  }
}
var chart, lastPrint = 0, lastTape = "";
function draw(s){
  document.getElementById("cash").textContent = money2(s.cash);
  document.getElementById("allin").textContent = money2(s.allInMid);
  document.getElementById("allinBid").textContent = money2(s.allInBid);
  document.getElementById("asof").textContent = s.asOfLabel || "\u2014";
  var printedCost = sum(s.printed,"cost");
  var deadCost = sum(s.dead,"cost");
  var first = (s.series && s.series[0]) || { cash:s.cash, allIn:s.allInMid };
  var adds = parseAdds(s.series);
  var startAllIn = Number(first.allIn||0);
  var tradePnl = Number(s.allInMid) - startAllIn - adds;
  var pnlEl = document.getElementById("tradePnl");
  pnlEl.textContent = (tradePnl>=0?"+":"") + money2(tradePnl);
  pnlEl.className = tradePnl>=0 ? "up" : "down";
  document.getElementById("totals").innerHTML = [
    tot("Start all-in", money2(startAllIn), first.t||""),
    tot("Capital added", money2(adds), "not P/L"),
    tot("Trading P/L", (tradePnl>=0?"+":"")+money2(tradePnl), "all-in - start - adds"),
    tot("Printed", money2(printedCost), (s.printed||[]).length+" cities"),
    tot("Dead premium", money2(deadCost), (s.dead||[]).length+" cities"),
    tot("Live rests", String((s.live||[]).length), money2(s.cash))
  ].join("");
  document.getElementById("hubStats").innerHTML = "all-in "+money2(s.allInMid)+" \u00b7 "+(s.scoreboard||"weather desk");
  var seats = s.seats || [];
  document.getElementById("stations").innerHTML = seats.map(function(seat,i){
    return '<div class="station"><h3>'+seat.name+'</h3><div class="role">'+seat.role+'</div><div class="state">'+seat.state+'</div><canvas class="st-spark" data-i="'+i+'"></canvas><div class="px c'+(i%6)+'"><div class="h"></div><div class="b"></div><div class="l"><i></i><i></i></div></div></div>';
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll(".st-spark"), function(cv,i){
    var base = (s.series||[]).map(function(p){ return p.allIn; });
    var jitter = base.map(function(v){ return v + ((i+1)*7 % 13); });
    spark(cv, jitter.length?jitter:[s.allInMid], ["#5ce1ff","#3dffa6","#ffc14a","#6ea8ff","#ff5dcc","#c4b5fd"][i%6]);
  });
  var tape = s.tape || [];
  document.getElementById("tape-list").innerHTML = tape.map(function(e){
    return '<div class="ev '+e.kind+'"><div class="meta"><span>'+e.et+'</span><span>'+e.who+'</span><span>'+e.kind+'</span></div><div>'+e.text+'</div></div>';
  }).join("");
  if (tape[0]) {
    document.getElementById("route").textContent = "ROUTING \u00b7 " + String(tape[0].who||"DESK").toUpperCase();
    var sig = tape[0].et + tape[0].text;
    if (lastTape && sig !== lastTape && /PRINT|CLEAR|PASS/.test(tape[0].kind||"")) confetti();
    lastTape = sig;
  }
  var bits = [];
  (s.live||[]).forEach(function(p){ bits.push("<b>LIVE</b> "+p.city+" "+p.bin+" "+(p.side||"")); });
  (s.printed||[]).forEach(function(p){ bits.push("<b>PRINT</b> "+p.city+" CLI "+p.cli+" "+money2(p.cost)); });
  (s.dead||[]).forEach(function(p){ bits.push("<b>DEAD</b> "+p.city+" "+p.why); });
  document.getElementById("ticker").innerHTML = bits.concat(bits).join(" \u00b7 ") || "desk idle";
  var walk = document.getElementById("walk");
  if (!walk.childElementCount) {
    seats.slice(0,4).forEach(function(seat,i){
      var w = document.createElement("div");
      w.className = "walker px c"+(i%6);
      w.style.animation = "cross "+(14+i*3)+"s linear infinite";
      w.style.animationDelay = (-i*4)+"s";
      w.innerHTML = '<div class="h"></div><div class="b"></div><div class="l"><i></i><i></i></div>';
      walk.appendChild(w);
    });
  }
  var labels = (s.series||[]).map(function(x){ return x.t; });
  var cash = (s.series||[]).map(function(x){ return x.cash; });
  var allIn = (s.series||[]).map(function(x){ return x.allIn; });
  var runningAdds = addsThrough(s.series);
  var growth = (s.series||[]).map(function(x,i){ return Number(x.allIn)-startAllIn-runningAdds[i]; });
  spark(document.getElementById("miniSpark"), allIn, "#3dffa6");
  var ctx = document.getElementById("pnl");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type:"line",
    data:{
      labels:labels,
      datasets:[
        {label:"All-in", data:allIn, borderColor:"#3dffa6", backgroundColor:"rgba(61,255,166,.12)", fill:true, tension:.32, pointRadius:3, borderWidth:2},
        {label:"Cash", data:cash, borderColor:"#5ce1ff", backgroundColor:"transparent", tension:.32, pointRadius:3, borderWidth:2},
        {label:"Trading P/L", data:growth, borderColor:"#ffc14a", borderDash:[4,3], tension:.32, pointRadius:2, borderWidth:2, yAxisID:"y1"}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      animation:{duration:800},
      plugins:{legend:{labels:{color:"#7d89b8", boxWidth:8, font:{size:10}}}},
      scales:{
        x:{ticks:{color:"#7d89b8", maxRotation:0}, grid:{color:"#22224a"}},
        y:{ticks:{color:"#7d89b8", callback:function(v){return "$"+v;}}, grid:{color:"#22224a"}},
        y1:{position:"right", ticks:{color:"#ffc14a", callback:function(v){return (v>=0?"+":"")+"$"+v;}}, grid:{drawOnChartArea:false}}
      }
    }
  });
  if ((s.printed||[]).length > lastPrint && lastPrint) confetti();
  lastPrint = (s.printed||[]).length;
}
function load(){
  fetch("state.json?ts="+Date.now()).then(function(r){ return r.json(); }).then(draw).catch(function(err){
    document.getElementById("route").textContent = "NO STATE";
    console.error(err);
  });
}
load();
setInterval(load, 8000);

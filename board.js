function money2(n){return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
function tickClock(){var et=new Date().toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});document.getElementById("clock").textContent=et+" ET";}
setInterval(tickClock,1000);tickClock();
var chart;
function draw(s){
document.getElementById("cash").textContent=money2(s.cash);
document.getElementById("allin").textContent=money2(s.allInMid);
document.getElementById("allinBid").textContent=money2(s.allInBid);
document.getElementById("asof").textContent=s.asOfLabel;
document.getElementById("seats").innerHTML=s.seats.map(function(x){return "<div class=seat><strong>"+x.name+"</strong><em>"+x.role+"</em><div class=st>"+x.state+"</div></div>";}).join("");
var rows=[];
s.live.forEach(function(p){rows.push("<tr><td><span class=\"tag live\">LIVE</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.side+"</td><td>"+p.status+"</td></tr>");});
s.printed.forEach(function(p){rows.push("<tr><td><span class=\"tag print\">PRINT</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.qty+" Yes CLI "+p.cli+"</td><td>cost "+money2(p.cost)+"</td></tr>");});
s.dead.forEach(function(p){rows.push("<tr><td><span class=\"tag dead\">DEAD</span></td><td>"+p.city+"</td><td>"+p.bin+"</td><td>"+p.why+"</td><td>cost "+money2(p.cost)+"</td></tr>");});
document.getElementById("book").innerHTML="<thead><tr><th></th><th>City</th><th>Bin</th><th></th><th></th></tr></thead><tbody>"+rows.join("")+"</tbody>";
document.getElementById("tape-list").innerHTML=s.tape.map(function(e){return "<div class=\"ev "+e.kind+"\"><div class=meta><span>"+e.et+"</span><span>"+e.who+"</span><span class=kind>"+e.kind+"</span></div><div>"+e.text+"</div></div>";}).join("");
var labels=s.series.map(function(x){return x.t;});
var cash=s.series.map(function(x){return x.cash;});
var allIn=s.series.map(function(x){return x.allIn;});
var ctx=document.getElementById("pnl");
if(chart) chart.destroy();
chart=new Chart(ctx,{type:"line",data:{labels:labels,datasets:[{label:"All-in mid",data:allIn,borderColor:"#3dffa6",backgroundColor:"rgba(61,255,166,0.08)",fill:true,tension:0.25,pointRadius:4},{label:"Cash",data:cash,borderColor:"#6ea8ff",backgroundColor:"transparent",tension:0.25,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:900},plugins:{legend:{labels:{color:"#8b95a7"}},tooltip:{callbacks:{afterLabel:function(c){return s.series[c.dataIndex].note||"";}}}},scales:{x:{ticks:{color:"#8b95a7"},grid:{color:"#1c212b"}},y:{ticks:{color:"#8b95a7",callback:function(v){return "$"+v;}},grid:{color:"#1c212b"}}}}});
}
function load(){fetch("state.json?ts="+Date.now()).then(function(r){return r.json();}).then(draw);}
load();
setInterval(load,8000);

/* 8-frame office sprites — one loop per bot */
(function () {
  var PAL = {
    Scout:   { body:"#5ce1ff", visor:"#3dffa6", acc:"#ffc14a", extra:"#ffffff" },
    Wx:      { body:"#3dffa6", visor:"#5ce1ff", acc:"#ffc14a", extra:"#6ea8ff" },
    Johnny:  { body:"#ffc14a", visor:"#141428", acc:"#ff5d7a", extra:"#e8f6ff" },
    Trader:  { body:"#6ea8ff", visor:"#141428", acc:"#3dffa6", extra:"#ff5d7a" },
    Printer: { body:"#ff5dcc", visor:"#fff1c8", acc:"#3dffa6", extra:"#fff4d6" },
    Macro:   { body:"#c4b5fd", visor:"#ffc14a", acc:"#ffc14a", extra:"#fff4d6" }
  };
  function px(ctx,x,y,c){ ctx.fillStyle=c; ctx.fillRect(x*3,y*3,3,3); }
  function pr(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x*3,y*3,w*3,h*3); }
  function deskBase(ctx, wood){
    pr(ctx,3,26,26,4,"#0e1020");
    pr(ctx,2,27,28,3, wood ? "#3e2c1c" : "#18203a");
    pr(ctx,3,28,26,2, wood ? "#543a22" : "#141c40");
  }
  function monitor(ctx,x,y,w,h,glow,on){
    pr(ctx,x,y,w,h,"#0a0c18");
    pr(ctx,x+1,y+1,w-2,h-2,"#080e1c");
    pr(ctx,x+2,y+2,w-4,on?2:1,glow);
    pr(ctx,x+(w>>1)-1,y+h,3,1,"#a0b0c4");
  }
  function bot(ctx,cx,cy,pal,armL,armR,hdx,hdy){
    var hx=cx+hdx, hy=cy-7+hdy;
    pr(ctx,cx-3,cy+1,10,8,"#1c2030");
    pr(ctx,cx-2+0,cy,8,8,pal.body);
    pr(ctx,cx-1,cy+1,6,2,pal.visor);
    pr(ctx,hx-2,hy,8,7,pal.body);
    pr(ctx,hx-1,hy+1,6,4,"#0a0c18");
    pr(ctx,hx,hy+2,4,2,pal.visor);
    px(ctx,hx,hy+2,"#f0f8ff"); px(ctx,hx+3,hy+2,"#f0f8ff");
    px(ctx,hx+3,hy-2,pal.visor);
    pr(ctx,cx-4,cy+2+armL,3,5,pal.body);
    px(ctx,cx-4,cy+6+armL,"#f0d2b4");
    pr(ctx,cx+5,cy+2+armR,3,5,pal.body);
    px(ctx,cx+7,cy+6+armR,"#f0d2b4");
  }
  function drawBotFrame(ctx, name, t){
    var pal = PAL[name] || PAL.Scout;
    ctx.clearRect(0,0,96,96);
    if(name==="Scout"){
      deskBase(ctx,false);
      monitor(ctx,2,10,8,10,pal.body,t%2===0);
      monitor(ctx,22,9,8,10,pal.visor,t%3===0);
      bot(ctx,14,16,pal,0,t%2?-1:1,[-2,-1,0,1,2,1,0,-1][t],t%2);
      px(ctx,6,8-(t%5>>1),pal.acc);
      pr(ctx,4,9-(t%5>>1),5,1,pal.acc);
    } else if(name==="Wx"){
      deskBase(ctx,false);
      monitor(ctx,3,8,11,12,pal.body,true);
      px(ctx,6+(t%3),11,"#fff"); px(ctx,7+(t%3),11,"#fff");
      monitor(ctx,22,11,7,8,pal.visor,t%2);
      var rise=[0,-1,-2,-1,0,1,0,-1][t];
      bot(ctx,15,17,pal,rise,0,0,rise);
      pr(ctx,24,23,3,3,pal.acc);
      if(t%2) px(ctx,25,21,"#fff");
    } else if(name==="Johnny"){
      deskBase(ctx,true);
      monitor(ctx,20,8,9,11,pal.body,t%2===0);
      pr(ctx,3,12,10,1,pal.extra);
      var b=[0,1,2,1,0,-1,-2,-1][t];
      bot(ctx,13,16+(b>>1),pal,b>>1,-(b>>1),0,b>>1);
      if(b<0){ pr(ctx,20,14,3,3,pal.body); px(ctx,21,13,"#f0d2b4"); }
    } else if(name==="Trader"){
      deskBase(ctx,false);
      monitor(ctx,1,7,9,11,pal.body,t%2===0);
      monitor(ctx,22,7,9,11,pal.acc,t%2===1);
      for(var i=0;i<3;i++) pr(ctx,24+i*2,14-((t+i)%4),1,2+((t+i)%4),(t+i)%2?pal.extra:pal.acc);
      bot(ctx,14,16,pal,[0,1,0,2,0,1,0,2][t]-1,[1,0,2,0,1,0,2,0][t]-1,(t%3)-1,0);
      pr(ctx,10,25,12,2,"#1c2030");
    } else if(name==="Printer"){
      deskBase(ctx,false);
      var lift=[0,-1,-2,-1,0,1,2,1][t];
      var py=[24,22,20,18,16,14,12,10][t];
      pr(ctx,21,16,9,8,pal.body);
      pr(ctx,22,17,7,4,"#0a0c18");
      pr(ctx,23,py,5,4,pal.extra);
      bot(ctx,12,16,pal,lift,1,0,lift>>1);
      pr(ctx,3,23,5,3,pal.extra);
    } else {
      deskBase(ctx,true);
      var nod=[0,1,2,1,0,-1,-2,-1][t];
      monitor(ctx,21,8,9,12,pal.body,t%3!==1);
      bot(ctx,13,17,pal,1,nod>>1,nod>>1,0);
      pr(ctx,6,22,8,5,pal.extra);
      pr(ctx,19,20+(nod>>1),1,4,pal.acc);
    }
  }
  function dockBooth(c){
    var card = c.closest(".station");
    if (!card || card.querySelector(".sprite-booth")) return;
    var art = card.querySelector(".station-art");
    if (!art) return;
    var body = card.querySelector(".station-body");
    if (!body) {
      body = document.createElement("div");
      body.className = "station-body";
      art.parentNode.insertBefore(body, art);
      body.appendChild(art);
    }
    var booth = document.createElement("div");
    booth.className = "sprite-booth";
    if (c.parentNode) c.parentNode.removeChild(c);
    booth.appendChild(c);
    body.appendChild(booth);
  }
  function ensureCanvas(node){
    if (node.tagName === "CANVAS") {
      dockBooth(node);
      return node;
    }
    var c = document.createElement("canvas");
    c.className = "sprite-canvas";
    c.width = 96; c.height = 96;
    var name = (node.className.match(/\b(scout|wx|johnny|trader|printer|macro)\b/i) || ["Scout"])[0];
    c.dataset.bot = name.charAt(0).toUpperCase() + name.slice(1);
    if (name.toLowerCase() === "wx") c.dataset.bot = "Wx";
    node.parentNode.replaceChild(c, node);
    dockBooth(c);
    return c;
  }
  var tick = 0;
  function loop(){
    tick = (tick + 1) % 8;
    var nodes = document.querySelectorAll(".sprite-canvas, .sprite");
    for (var i=0;i<nodes.length;i++){
      var c = ensureCanvas(nodes[i]);
      var ctx = c.getContext("2d");
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = false;
      drawBotFrame(ctx, c.dataset.bot, tick);
    }
  }
  setInterval(loop, 120);
  loop();
})();

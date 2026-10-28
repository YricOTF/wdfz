/* 里世界 3D · 机房里的贪吃蛇
   以前在电脑上"一打开就卡死"：
   ① 方向只在蛇走一步的那一帧读 KEY，轻点一下方向键基本被吞掉；倒计时一完蛇就一头撞右墙。
   ② 鼠标还锁在画面里，看不见指针；Esc 先被浏览器拿去解除指针锁，页面上又没有能点的按钮 —— 看上去就是死机。
   现在：方向按下就进队列（WASD / 方向键 / 屏幕方向键 / 滑动都行），打开时先释放指针锁，
   面板上有「再来一局」「离开」两个按钮，空格 / 回车重开，Esc 离开。 */
'use strict';

var PC={on:false,body:[],dir:{x:1,y:0},q:[],food:{x:3,y:3},score:0,best:0,dead:false,t:0,cd:0};
var PC_N=16, PC_STEP=0.15;
var PCGAME={
  start:function(){
    try{ if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); }catch(e){}
    for(var k in KEY) KEY[k]=false;
    try{ TOUCH.active=false; TOUCH.dx=TOUCH.dy=0; }catch(e){}
    PC.on=true; PC.best=0;
    this.reset();
    var el=document.getElementById('pcgame'); if(el) el.style.display='flex';
    this.draw();
    try{ SFX.click(); }catch(e){}
  },
  reset:function(){
    PC.dead=false; PC.score=0; PC.t=0; PC.cd=2.0;
    PC.body=[{x:5,y:8},{x:4,y:8},{x:3,y:8}]; PC.dir={x:1,y:0}; PC.q=[];
    PC.food=this.rf();
    var rb=document.getElementById('pcAgain'); if(rb) rb.style.visibility='hidden';
  },
  again:function(){ if(!PC.on) return; this.reset(); this.draw(); try{ SFX.click(); }catch(e){} },
  rf:function(){
    var f, tries=0, hit;
    do{
      f={x:(Math.random()*PC_N)|0, y:(Math.random()*PC_N)|0}; hit=false;
      for(var i=0;i<PC.body.length;i++) if(PC.body[i].x===f.x&&PC.body[i].y===f.y){ hit=true; break; }
    }while(hit&&++tries<200);
    return f;
  },
  /* 转向：进队列，一步最多吃一个，不允许直接掉头 */
  turn:function(dx,dy){
    if(!PC.on||PC.dead) return;
    var last=PC.q.length?PC.q[PC.q.length-1]:PC.dir;
    if(last.x===dx&&last.y===dy) return;
    if(last.x===-dx&&last.y===-dy) return;
    if(PC.q.length<3) PC.q.push({x:dx,y:dy});
  },
  /* 键盘：小游戏开着的时候，按键都归它，不再漏给背包、地图、交互 */
  key:function(k){
    if(k==='escape'){ this.stop(); return; }
    if(k==='w'||k==='arrowup') this.turn(0,-1);
    else if(k==='s'||k==='arrowdown') this.turn(0,1);
    else if(k==='a'||k==='arrowleft') this.turn(-1,0);
    else if(k==='d'||k==='arrowright') this.turn(1,0);
    else if((k===' '||k==='enter'||k==='e')&&PC.dead) this.again();
  },
  stop:function(){
    if(!PC.on) return;
    var sc=Math.max(PC.score,PC.best||0);
    var gain=Math.min(20, 6+sc*2);
    if(sc>0){ S.san=Math.min(100,S.san+gain); toast('SAN +'+gain+'（最高 '+sc+' 分）'); }
    PC.on=false;
    for(var k in KEY) KEY[k]=false;
    var el=document.getElementById('pcgame'); if(el) el.style.display='none';
    S.tsec=((S.tsec+10*60)%1440+1440)%1440;
  },
  tick:function(dt){
    if(!PC.on) return;
    if(PC.dead) return;
    if(dt>0.25) dt=0.25;
    if(PC.cd>0){ PC.cd-=dt; this.draw(); return; }
    PC.t+=dt;
    var steps=0;
    while(PC.t>=PC_STEP&&steps<2&&!PC.dead){ PC.t-=PC_STEP; steps++; this.step(); }
    if(steps) this.draw();
  },
  step:function(){
    if(PC.q.length) PC.dir=PC.q.shift();
    var h={x:PC.body[0].x+PC.dir.x, y:PC.body[0].y+PC.dir.y};
    if(h.x<0||h.y<0||h.x>=PC_N||h.y>=PC_N){ this.die(); return; }
    for(var i=0;i<PC.body.length-1;i++) if(PC.body[i].x===h.x&&PC.body[i].y===h.y){ this.die(); return; }
    PC.body.unshift(h);
    if(h.x===PC.food.x&&h.y===PC.food.y){ PC.score++; PC.food=this.rf(); try{ SFX.click(); }catch(e){} }
    else PC.body.pop();
  },
  die:function(){
    PC.dead=true; PC.best=Math.max(PC.best||0,PC.score);
    var rb=document.getElementById('pcAgain'); if(rb) rb.style.visibility='visible';
  },
  draw:function(){
    var cv=document.getElementById('pccv'); if(!cv) return;
    var c=cv.getContext('2d'); if(!c) return;
    c.fillStyle='#0a1210'; c.fillRect(0,0,320,320);
    c.strokeStyle='rgba(120,200,170,.10)'; c.lineWidth=1;
    for(var g=0;g<=PC_N;g++){ c.beginPath(); c.moveTo(g*20,0); c.lineTo(g*20,320); c.stroke();
      c.beginPath(); c.moveTo(0,g*20); c.lineTo(320,g*20); c.stroke(); }
    c.fillStyle='#c8554a'; c.fillRect(PC.food.x*20+3,PC.food.y*20+3,14,14);
    for(var i=0;i<PC.body.length;i++){
      c.fillStyle=i?'#5a9a7a':'#79c8a4';
      c.fillRect(PC.body[i].x*20+1,PC.body[i].y*20+1,18,18);
    }
    c.textAlign='left'; c.font='11px sans-serif'; c.fillStyle='rgba(159,227,194,.7)';
    c.fillText('得分 '+PC.score+(PC.best?'　最高 '+PC.best:''),6,14);
    if(PC.cd>0){
      c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(0,0,320,320);
      c.fillStyle='#dff5ea'; c.font='bold 64px sans-serif'; c.textAlign='center';
      c.fillText(String(Math.ceil(PC.cd)),160,180);
      c.font='11px sans-serif'; c.fillStyle='#9fe3c2';
      c.fillText('准备 · 方向键 / WASD 转向',160,212);
    }
    if(PC.dead){
      c.fillStyle='rgba(0,0,0,.72)'; c.fillRect(0,0,320,320);
      c.fillStyle='#e8f4ec'; c.font='15px sans-serif'; c.textAlign='center';
      c.fillText('结束 · 得分 '+PC.score,160,146);
      c.font='11px sans-serif'; c.fillStyle='#9fe3c2';
      c.fillText('空格 / 回车 再来一局 · Esc 离开',160,174);
    }
  }
};
/* 面板上的按钮、屏幕方向键、在画布上滑动 */
function initPcGame(){
  var el=document.getElementById('pcgame'); if(!el) return;
  function on(id,fn){ var b=document.getElementById(id); if(!b) return;
    b.addEventListener('pointerdown',function(e){ e.preventDefault(); e.stopPropagation(); fn(); }); }
  on('pcAgain',function(){ PCGAME.again(); });
  on('pcQuit',function(){ PCGAME.stop(); });
  on('pcU',function(){ PCGAME.turn(0,-1); }); on('pcD',function(){ PCGAME.turn(0,1); });
  on('pcL',function(){ PCGAME.turn(-1,0); }); on('pcR',function(){ PCGAME.turn(1,0); });
  var cv=document.getElementById('pccv'), sx=0, sy=0, sid=-1;
  if(cv){
    cv.addEventListener('pointerdown',function(e){ sid=e.pointerId; sx=e.clientX; sy=e.clientY; e.preventDefault(); });
    cv.addEventListener('pointerup',function(e){
      if(e.pointerId!==sid) return; sid=-1;
      var dx=e.clientX-sx, dy=e.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy))<18){ if(PC.dead) PCGAME.again(); return; }
      if(Math.abs(dx)>Math.abs(dy)) PCGAME.turn(dx>0?1:-1,0); else PCGAME.turn(0,dy>0?1:-1);
    });
  }
}

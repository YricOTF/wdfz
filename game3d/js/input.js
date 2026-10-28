/* 里世界 3D · 键鼠与触屏输入、玩家移动 */
'use strict';

var KEY={}, TOUCH={dx:0,dy:0,run:false,active:false};
var LOOKDRAG={on:false,x:0,y:0};
function initInput(){
  window.addEventListener('keydown',function(e){
    var k=e.key.toLowerCase();
    if(PRO.on){ e.preventDefault(); if(!e.repeat) proNext(); return; }
    if(typeof PC!=='undefined'&&PC.on){                 /* 机房小游戏开着：按键全归它 */
      e.preventDefault(); if(!e.repeat) PCGAME.key(k); return;
    }
    KEY[k]=true;
    if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k)>=0) e.preventDefault();
    if(e.key==='Tab'){ e.preventDefault(); if(e.repeat) return; UI.toggle('bag'); return; }
    if(e.repeat) return;
    if(k==='h'){ UI.toggle('think'); }
    if(k==='j'){ UI.toggle('note'); }
    if(k==='m'){ UI.toggle('mapv'); }
    if(e.key==='F2'){ e.preventDefault(); if(typeof Dev!=='undefined') Dev.toggle(); return; }
    if(k==='escape'){
      if(UI.openPanel==='set'){ UI.close('set'); if(PAUSE.on) UI.open('pause'); return; }
      Game.pauseToggle();
    }
    if(k==='e'){ tryInteract(); }
    if(k==='f'){ toggleTorch(); }
    if(k==='g'){ dropSelected(); }
    if(k==='1'){ useHot(0); }
    if(k==='2'){ useHot(1); }
  },{passive:false});
  window.addEventListener('keyup',function(e){ KEY[e.key.toLowerCase()]=false; });

  var cv=document.getElementById('cv');
  var proEl=document.getElementById('pro');
  if(proEl) proEl.addEventListener('click',function(e){ e.stopPropagation(); proNext(); });
  window.addEventListener('pointerdown',function(e){
    if(!PRO.on) return;
    if(e.target&&e.target.id==='pro') return;   /* 交给 #pro 自己的 click */
    proNext();
  },{passive:true});
  cv.addEventListener('click',function(){
    if(PRO.on||S.screen!=='play') return;
    if(typeof endLook==='function') endLook();
    LOOKDRAG.on=false;
    if(cv.requestPointerLock){
      /* 指针锁在某些状态下会 reject（没有焦点 / 刚切窗口 / 非安全上下文）。
         这不影响游戏，静默掉，别弹红条。 */
      try{ var _pl=cv.requestPointerLock(); if(_pl&&_pl.catch) _pl.catch(function(){}); }catch(e){}
    }
  });
  var LOOK_PER_EVENT=160;               /* 单次事件最多按 160px 算 */
  document.addEventListener('mousemove',function(e){
    if(document.pointerLockElement!==cv) return;
    var mx=e.movementX||0, my=e.movementY||0;
    if(!isFinite(mx)||!isFinite(my)) return;
    if(mx>LOOK_PER_EVENT) mx=LOOK_PER_EVENT; else if(mx<-LOOK_PER_EVENT) mx=-LOOK_PER_EVENT;
    if(my>LOOK_PER_EVENT) my=LOOK_PER_EVENT; else if(my<-LOOK_PER_EVENT) my=-LOOK_PER_EVENT;
    S.ang+=mx*0.0022;
    S.pitch=clamp(S.pitch-my*0.0022,-1.25,1.25);
  });
  var lookId=-1;
  function endLook(){ LOOKDRAG.on=false; lookId=-1; }
  window.addEventListener('pointerdown',function(e){
    if(e.target.closest && e.target.closest('button,.hslot,#stick,#tRun,#tAct,#tPause,.close,#tcol')) return;
    if(document.pointerLockElement===cv) return;
    if(UI.anyOpen()||PAUSE.on||S.dead||(typeof PC!=='undefined'&&PC.on)) return;
    if(S.screen==='play'&&S.mode){ LOOKDRAG.on=true; LOOKDRAG.x=e.clientX; LOOKDRAG.y=e.clientY; lookId=e.pointerId; }
  });
  window.addEventListener('pointermove',function(e){
    if(!LOOKDRAG.on||e.pointerId!==lookId) return;
    if(document.pointerLockElement===cv){ endLook(); return; }
    if(e.pointerType==='mouse'&&e.buttons===0){ endLook(); return; }
    var dx=e.clientX-LOOKDRAG.x, dy=e.clientY-LOOKDRAG.y;
    if(Math.abs(dx)>160||Math.abs(dy)>160){ endLook(); return; }   /* 坐标跳变，丢弃 */
    S.ang+=dx*0.0042;
    S.pitch=clamp(S.pitch-dy*0.0042,-1.25,1.25);
    LOOKDRAG.x=e.clientX; LOOKDRAG.y=e.clientY;
  });
  window.addEventListener('pointerup',function(e){ if(e.pointerId===lookId) endLook(); });
  window.addEventListener('pointercancel',function(e){ if(e.pointerId===lookId) endLook(); });
  window.addEventListener('pointerout',function(e){
    if(e.pointerId===lookId&&e.pointerType==='mouse'&&!e.relatedTarget) endLook();
  });

  function resetInputState(){
    TOUCH.active=false; TOUCH.dx=0; TOUCH.dy=0; TOUCH.run=false;
    LOOKDRAG.on=false;
    var kn=document.getElementById('knob');
    if(kn) kn.style.transform='';
    var tr=document.getElementById('tRun');
    if(tr) tr.classList.remove('held');
    KEY['w']=KEY['a']=KEY['s']=KEY['d']=false;
    KEY['arrowup']=KEY['arrowdown']=KEY['arrowleft']=KEY['arrowright']=false;
    KEY['shift']=false; KEY[' ']=false;
  }
  window.__resetInput=resetInputState;
  window.addEventListener('blur',resetInputState);
  document.addEventListener('visibilitychange',function(){ if(document.hidden) resetInputState(); });
  window.addEventListener('contextmenu',function(e){ if(S.screen==='play') e.preventDefault(); });

  var stick=document.getElementById('stick'), knob=document.getElementById('knob');
  if(stick){
    var sid=-1, s0={x:0,y:0};
    stick.addEventListener('pointerdown',function(e){ sid=e.pointerId; s0={x:e.clientX,y:e.clientY}; e.stopPropagation(); });
    window.addEventListener('pointermove',function(e){
      if(e.pointerId!==sid) return;
      var dx=e.clientX-s0.x, dy=e.clientY-s0.y, d=Math.hypot(dx,dy), m=44;
      if(d>m){ dx=dx/d*m; dy=dy/d*m; }
      knob.style.transform='translate('+dx+'px,'+dy+'px)';
      TOUCH.dx=dx/m; TOUCH.dy=dy/m; TOUCH.active=true;
      e.stopPropagation();
    });
    function stickEnd(e){
      if(sid!==-1 && e.pointerId!==sid) return;
      sid=-1; TOUCH.active=false; TOUCH.dx=TOUCH.dy=0; knob.style.transform='';
    }
    window.addEventListener('pointerup',stickEnd);
    window.addEventListener('pointercancel',stickEnd);
    stick.addEventListener('lostpointercapture',stickEnd);
    var tr=document.getElementById('tRun');
    /* 奔跑键改成"点一下开 / 再点一下关"：手机上一只手推摇杆、一只手转视角，
       没有第三根手指去一直按着它。摇杆推到底也算奔跑。 */
    tr.addEventListener('pointerdown',function(e){
      TOUCH.run=!TOUCH.run;
      if(TOUCH.run) tr.classList.add('held'); else tr.classList.remove('held');
      e.stopPropagation();
    });
    var ta=document.getElementById('tAct');
    ta.addEventListener('pointerdown',function(e){ tryInteract(); e.stopPropagation(); });
    var tp=document.getElementById('tPause');
    if(tp) tp.addEventListener('pointerdown',function(e){
      e.stopPropagation(); if(e.cancelable) e.preventDefault();
      TOUCH.active=false; TOUCH.dx=TOUCH.dy=0; LOOKDRAG.on=false;
      if(!PAUSE.on) Game.pauseToggle();
    });
  }
  document.addEventListener('pointerlockchange',function(){
    LOOKDRAG.on=false;
  });
  document.addEventListener('pointerlockerror',function(){ LOOKDRAG.on=false; });
}

function updatePlayer(dt){
  if(S.dead||S.screen!=='play'||(S.intro||0)>0) return;
  var locked=PAUSE.on||UI.anyOpen()||(typeof PC!=='undefined'&&PC.on);   /* 字幕不该锁移动 */
  var fw=0, sd=0;
  if(!locked){
    if(KEY['w']||KEY['arrowup']) fw+=1;
    if(KEY['s']||KEY['arrowdown']) fw-=1;
    if(KEY['a']||KEY['arrowleft']) sd-=1;
    if(KEY['d']||KEY['arrowright']) sd+=1;
    if(TOUCH.active){ fw+=-TOUCH.dy; sd+=TOUCH.dx; }
  }
  var stickFull=TOUCH.active&&Math.hypot(TOUCH.dx,TOUCH.dy)>0.96;
  var wantRun=(KEY['shift']||TOUCH.run||stickFull)&&!locked;
  S.run=wantRun&&S.stam>6&&(fw!==0||sd!==0);

  if(S.seated&&(fw!==0||sd!==0)){ S.seated=false; }
  var mag=Math.hypot(fw,sd);
  S.moving=mag>0.08&&!S.seated;
  if(S.moving){
    var spd=SPD_WALK+15.4*(0.35+0.65*S.stam/100);
    if(S.run) spd=SPD_RUN;
    if(typeof DEV!=='undefined'&&DEV.fast) spd*=2.6;
    if(mag>1){ fw/=mag; sd/=mag; }
    var ca=Math.cos(S.ang), sa=Math.sin(S.ang);
    var vx=(ca*fw - sa*sd), vy=(sa*fw + ca*sd);
    var l=Math.hypot(vx,vy)||1;
    moveBy(vx/l*spd*dt, vy/l*spd*dt);
  }
  if(S.moving&&!S.seated){
    S.stepT=(S.stepT||0)-dt;
    if(S.stepT<=0){ S.stepT=S.run?0.30:0.46; SFX.step(); }
  } else { S.stepT=0; }
  if(S.run&&S.moving){ S.stam=Math.max(0,S.stam-17*dt); }
  else { S.stam=Math.min(100,S.stam+11*dt); }
  if(S.enterCool>0) S.enterCool-=dt;
  syncCamera(dt);
}
var SPD_WALK=21, SPD_RUN=36.4;

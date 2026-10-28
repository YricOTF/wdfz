/* 里世界 3D · 地下车库
   以前：60×26 米一整片空地，只有 6 辆车（能开的那几辆）、15 根柱子、顶上 4 根管子，
   开着手电也只看得见一圈水泥地。现在把一个真的地下车库摆满：
   画满车位线和车挡，空车位里停着别人的车（有的盖着车衣）、锥桶和纸箱；墙下半截刷绿漆、
   黄色腰线，柱子上有区号；顶上是梁、风管、喷淋管、线槽、灯管（大多是坏的）；
   出口有道闸、限高杆、减速带，楼梯和出口上方是亮着的绿色「安全出口」。
   玩法完全不动：能开的车还是那 6 格 V，真光源还是原来那一盏（手电机制靠它）。 */
'use strict';

var GAR_SIGN_MATS={};
/* 牌子：lit=true 时自己发光（安全出口），否则跟着手电亮 */
function garageSign(c,text,w,h,bg,fg,x,y,z,rotY,lit){
  var key=text+'|'+bg+'|'+fg+'|'+(lit?1:0), mat=GAR_SIGN_MATS[key];
  if(!mat){
    var cv=document.createElement('canvas'); cv.width=256; cv.height=Math.max(32,Math.round(256*h/w));
    var g=cv.getContext('2d');
    g.fillStyle=bg; g.fillRect(0,0,cv.width,cv.height);
    g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle';
    g.font='700 '+Math.round(cv.height*0.58)+'px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
    g.fillText(text,cv.width/2,cv.height*0.54,cv.width*0.9);
    var t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;
    mat=lit?new THREE.MeshBasicMaterial({map:t,fog:true}):new THREE.MeshPhongMaterial({map:t,shininess:4,specular:0x111111});
    mat.userData.shared=true;                    /* 切场景不销毁，下次进来直接用 */
    GAR_SIGN_MATS[key]=mat;
  }
  var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  m.position.set(x,y,z); m.rotation.y=rotY||0;
  c.extras.push(m);
  return m;
}
/* 别人的车：轿车 / SUV / 盖着车衣。不能开，但挡路（有碰撞） */
function garageParked(c,bx,bz,kind,seed){
  var K=c.K, low=lodLow();
  var cols=[0x8a8e90,0x2a2e34,0x6a2a26,0x3a4a5a,0xd0d0cc,0x4a4438,0x1e3a32];
  var col=cols[Math.floor(seed*7)%7];
  c.ao(bx,bz,3.9,2.2,0.9);
  c.solid(bx,bz,3.80,1.86);
  K.frame(bx,bz,0);
  if(kind==='tarp'){                             /* 车衣：一层灰布罩着，轮廓软 */
    K.bevel('fabric',0,0.50,0,3.86,0.74,1.88,0x5a5e58,1,0.22);
    K.bevel('fabric',-0.15,1.08,0,2.30,0.52,1.70,0x5e625c,1.02,0.24);
    K.box('fabric',0,0.10,0.95,3.6,0.20,0.02,0x4e524c,0.95);
    K.box('fabric',0,0.10,-0.95,3.6,0.20,0.02,0x4e524c,0.95);
  }else{
    var suv=(kind==='suv'), bodyH=suv?0.80:0.64, cabY=suv?1.45:1.20, cabH=suv?0.66:0.56;
    K.bevel('metal',0,0.30+bodyH/2,0,3.80,bodyH,1.80,col,1.02,0.10);
    K.bevel('metal',suv?-0.25:-0.15,cabY,0,suv?2.70:2.10,cabH,1.62,col,1.06,0.12);
    K.box('glass',suv?1.12:0.93,cabY,0,0.02,cabH*0.75,1.44,0x141c24,1.2);
    K.box('glass',-0.15,cabY+0.02,0.815,suv?2.4:1.8,cabH*0.62,0.01,0x141c24,1.1);
    K.box('glass',-0.15,cabY+0.02,-0.815,suv?2.4:1.8,cabH*0.62,0.01,0x141c24,1.1);
    var wx, wz;
    for(wx=-1;wx<=1;wx+=2) for(wz=-1;wz<=1;wz+=2){
      if(low) K.box('dark',wx*1.22,0.34,wz*0.86,0.66,0.66,0.18,0x0e1216,1);
      else K.rod('dark',wx*1.22,0.34,wz*0.78,wx*1.22,0.34,wz*0.94,0.34,0.34,10,0x0e1216);
    }
    K.box('emit',-1.905,0.82,0.66,0.02,0.10,0.24,0x5a1610,1);
    K.box('emit',-1.905,0.82,-0.66,0.02,0.10,0.24,0x5a1610,1);
    K.box('paper',1.905,0.52,0,0.01,0.12,0.40,(seed>0.8)?0x2a7a3a:0x2a5a9a,1);   /* 蓝牌，偶尔一块绿牌 */
    K.bevel('plastic',1.84,0.40,0,0.12,0.18,1.78,0x1a1e22,1,0.04);
    K.bevel('plastic',-1.84,0.40,0,0.12,0.18,1.78,0x1a1e22,1,0.04);
    if(!low) K.box('decal',0,cabY+cabH/2+0.012,0,suv?2.0:1.5,0.008,1.2,0x9a9890,1);   /* 车顶落的灰 */
  }
  K.unframe();
}
function garageDecor(c){
  var K=c.K, R=c.R, W=c.W, H=c.H, CX=c.CX, CZ=c.CZ, halfW=c.halfW, halfH=c.halfH;
  var low=lodLow(), hi=(QUALITY>=2), i, k, x, z;
  function cell(gx,gy){ return (R.grid[gy]&&R.grid[gy][gx]!==undefined)?R.grid[gy][gx]:'#'; }
  function rectHas(x0,z0,x1,z1,set){
    var gx0=Math.floor(x0+halfW), gx1=Math.floor(x1+halfW-1e-3), gy0=Math.floor(z0+halfH), gy1=Math.floor(z1+halfH-1e-3), gx, gy;
    for(gy=gy0;gy<=gy1;gy++) for(gx=gx0;gx<=gx1;gx++) if(set.indexOf(cell(gx,gy))>=0) return true;
    return false;
  }
  var LINE=0xd8d4c4, YEL=0xc8a830, BLK=0x1a1a18;

  /* ---- 车位：四排平行车位，每格 4×2.6 米；能开的车（V）占着的那几格照画线 ---- */
  var rows=[4,9,16,22], bayL=4.0, bayD=2.6, ri, bayN=0;
  var x0=CX(12)-bayL*Math.floor((CX(12)+halfW-1.2)/bayL);
  for(ri=0;ri<rows.length;ri++){
    var bz=CZ(rows[ri]);
    for(x=x0;x+bayL/2<CX(51);x+=bayL){
      var bxl=x-bayL/2, bxr=x+bayL/2, bzt=bz-bayD/2, bzb=bz+bayD/2;
      var gcx=Math.floor(x+halfW), hasV=(cell(gcx,rows[ri])==='V');
      if(!hasV&&rectHas(bxl+0.05,bzt+0.05,bxr-0.05,bzb-0.05,['#','S','O','V'])) continue;
      bayN++;
      K.g('decal').quad(bxl,bzt,bxr,bzt,bxr,bzt+0.1,bxl,bzt+0.1,0.006,LINE);
      K.g('decal').quad(bxl,bzb-0.1,bxr,bzb-0.1,bxr,bzb,bxl,bzb,0.006,LINE);
      K.g('decal').quad(bxl,bzt,bxl+0.1,bzt,bxl+0.1,bzb,bxl,bzb,0.006,LINE);
      if(!low){                                   /* 车挡：车尾那头两块黄黑相间的 */
        K.bevel('plastic',bxl+0.45,0.05,bz-0.55,0.16,0.10,0.55,YEL,1,0.02);
        K.bevel('plastic',bxl+0.45,0.05,bz+0.55,0.16,0.10,0.55,YEL,1,0.02);
      }
      if(hasV) continue;
      var hs=hash2(Math.round(x*7)+31,rows[ri]*13+5);
      if(hs<0.30) garageParked(c,x+0.1,bz,'car',hash2(rows[ri],Math.round(x)));
      else if(hs<0.40) garageParked(c,x+0.1,bz,'suv',hash2(rows[ri]+3,Math.round(x)));
      else if(hs<0.50) garageParked(c,x+0.1,bz,'tarp',0);
      else if(hs<0.58){                           /* 锥桶 + 纸箱，好像有人在这儿堆过东西 */
        for(k=0;k<3;k++){
          var cxk=x-1.0+k*0.9;
          K.box('plastic',cxk,0.02,bz-0.6,0.36,0.04,0.36,0xd8602a,1);
          K.cyl('plastic',cxk,0.04,bz-0.6,0.15,0.035,0.66,8,0xd8602a);
          K.cyl('paper',cxk,0.34,bz-0.6,0.098,0.084,0.09,8,0xe8e4dc);
        }
        K.box('paper',x+0.8,0.25,bz+0.3,0.70,0.50,0.55,0x9a7a52,1);
        K.box('paper',x+0.7,0.70,bz+0.25,0.55,0.40,0.45,0x8a6c48,1.05);
        c.solid(x+0.8,bz+0.3,0.75,0.6);
      }else{                                      /* 空车位：地上一摊油渍 */
        K.g('decal').quad(x-0.6,bz-0.45,x+0.7,bz-0.45,x+0.7,bz+0.5,x-0.6,bz+0.5,0.005,0x2a2a28);
      }
    }
  }

  /* ---- 柱子：黄黑警示带（原来就有）+ 护角 + 两面区号 ---- */
  var zoneOf=['A','B','C','D','E'], gy, gx;
  for(gx=1;gx<W-1;gx++) for(gy=1;gy<H-1;gy++){
    if(cell(gx,gy)!=='#') continue;
    var pcx=CX(gx), pcz=CZ(gy), kb;
    for(kb=0;kb<4;kb++) K.box('plastic',pcx,0.15+kb*0.25,pcz,1.02,0.12,1.02,kb%2?BLK:YEL,1.0);
    if(!low) for(k=0;k<4;k++){ var sx=(k&1)?1:-1, sz=(k&2)?1:-1; K.box('metal',pcx+sx*0.5,0.9,pcz+sz*0.5,0.06,1.8,0.06,0x8a9094,1.05); }
    var zone=zoneOf[Math.max(0,Math.min(4,Math.round((gx-8)/10)))]+'区 '+(gy<9?'1':(gy<16?'2':'3'));
    garageSign(c,zone,0.84,0.34,'#2e4a3c','#e8e2c8',pcx,1.75,pcz+0.511,0,false);
    garageSign(c,zone,0.84,0.34,'#2e4a3c','#e8e2c8',pcx,1.75,pcz-0.511,Math.PI,false);
  }

  /* ---- 墙：大号区名刷在墙上；消防栓箱、灭火器 ---- */
  var nz=-halfH+1.0+0.012, sz2=halfH-1.0-0.012;     /* 北墙 / 南墙内表面 */
  var wallMarks=[[6,'B1 · A区'],[22,'B1 · B区'],[38,'B1 · C区']];
  for(i=0;i<wallMarks.length;i++){
    garageSign(c,wallMarks[i][1],3.0,0.9,'#8a8a84','#c8a830',CX(wallMarks[i][0]),2.05,nz,0,false);
    garageSign(c,wallMarks[i][1],3.0,0.9,'#8a8a84','#c8a830',CX(wallMarks[i][0]+8),2.05,sz2,Math.PI,false);
  }
  garageSign(c,'B1',1.4,1.0,'#8a8a84','#c8a830',-halfW+1.0+0.012,2.0,CZ(13),Math.PI/2,false);
  var fire=[[16,1],[34,1],[10,-1],[44,-1]];
  for(i=0;i<fire.length;i++){
    var fx=CX(fire[i][0]), fside=fire[i][1], fz=fside>0?(-halfH+1.0+0.14):(halfH-1.0-0.14);
    K.box('metal',fx,1.15,fz,0.75,1.05,0.26,0xa82820,1.0);
    K.box('glass',fx,1.20,fz+fside*0.135,0.58,0.70,0.01,0xc8d4d8,1.0);
    if(!low) K.box('paper',fx,1.74,fz+fside*0.135,0.5,0.10,0.01,0xe8e0d0,1.0);
    K.cyl('metal',fx+0.6,0.02,fz,0.09,0.09,0.50,8,0xb02a22);
    K.cyl('metal',fx+0.78,0.02,fz,0.09,0.09,0.50,8,0xb02a22);
  }
  /* 墙根的排水沟 */
  K.g('decal').quad(-halfW+1,-halfH+1.0,halfW-1,-halfH+1.0,halfW-1,-halfH+1.28,-halfW+1,-halfH+1.28,0.004,0x1e2022);
  K.g('decal').quad(-halfW+1,halfH-1.28,halfW-1,halfH-1.28,halfW-1,halfH-1.0,-halfW+1,halfH-1.0,0.004,0x1e2022);

  /* ---- 地面：车道中线（原来就有）、导向箭头、减速带 ---- */
  K.g('decal').quad(-halfW+1,CZ(13)-0.06,halfW-4,CZ(13)-0.06,halfW-4,CZ(13)+0.06,-halfW+1,CZ(13)+0.06,0.006,YEL);
  var arrows=[8,22,36,46];
  for(i=0;i<arrows.length;i++){
    var ax=CX(arrows[i]), az=CZ(13)+1.0;
    K.g('decal').quad(ax-1.0,az-0.12,ax+0.3,az-0.12,ax+0.3,az+0.12,ax-1.0,az+0.12,0.006,LINE);
    K.g('decal').quad(ax+0.3,az-0.42,ax+1.0,az,ax+1.0,az,ax+0.3,az+0.42,0.006,LINE);
  }
  var bumpX=CX(51);
  for(k=0;k<8;k++) K.box('plastic',bumpX,0.025,CZ(10.5)+k*0.62+0.31,0.36,0.05,0.62,k%2?BLK:YEL,1);

  /* ---- 出口：岗亭、道闸（抬着）、限高杆 ---- */
  var bx2=CX(53), bz2=CZ(10)+0.2;
  K.bevel('metal',bx2,1.15,bz2,1.5,2.3,1.3,0xd8d4cc,1,0.05);
  K.box('glass',bx2,1.45,bz2+0.66,1.2,0.8,0.01,0x1a242c,1.1);
  K.box('glass',bx2-0.76,1.45,bz2,0.01,0.8,1.0,0x1a242c,1.1);
  K.box('metal',bx2,2.34,bz2,1.7,0.08,1.5,0x3a3e40,1);
  c.solid(bx2,bz2,1.5,1.3);
  var gpx=CX(53)+0.4, gpz=CZ(11)+0.35;
  K.bevel('metal',gpx,0.55,gpz,0.36,1.1,0.32,0xc8a830,1,0.03);
  for(k=0;k<6;k++) K.box('plastic',gpx,1.2+k*0.24+0.12,gpz,0.08,0.24,0.08,k%2?0xc82a22:0xe8e4dc,1);   /* 抬起来的闸杆 */
  c.solid(gpx,gpz,0.4,0.36);
  var hbx=CX(50);
  K.box('metal',hbx,2.30,CZ(13)+0.0,0.14,0.14,5.6,YEL,1);
  for(k=0;k<7;k++) K.box('plastic',hbx,2.30,CZ(13)-2.8+0.4+k*0.8,0.15,0.15,0.4,BLK,1);
  K.rod('metal',hbx,2.37,CZ(13)-2.4,hbx,WALLH,CZ(13)-2.4,0.02,0.02,4,0x6a6e70);
  K.rod('metal',hbx,2.37,CZ(13)+2.4,hbx,WALLH,CZ(13)+2.4,0.02,0.02,4,0x6a6e70);
  garageSign(c,'限高 2.2m',1.3,0.36,'#c8a830','#1a1a18',hbx-0.08,2.05,CZ(13),-Math.PI/2,false);

  /* ---- 安全出口：楼梯口、出口上方、车道上吊着的指示牌 —— 唯一一直亮着的东西 ---- */
  garageSign(c,'安全出口',1.2,0.36,'#1e8a4a','#eaffef',halfW-1.0-0.012,2.62,CZ(12.5),-Math.PI/2,true);   /* 出口上方的墙上 */
  K.box('metal',CX(55.5),2.48,CZ(13),1.24,0.40,0.06,0x2a2e30,1);                                       /* 楼梯口吊着一块 */
  garageSign(c,'安全出口 · 楼梯',1.15,0.32,'#1e8a4a','#eaffef',CX(55.5),2.48,CZ(13)-0.035,Math.PI,true);
  garageSign(c,'安全出口 · 楼梯',1.15,0.32,'#1e8a4a','#eaffef',CX(55.5),2.48,CZ(13)+0.035,0,true);
  K.rod('metal',CX(55.5)-0.5,2.68,CZ(13),CX(55.5)-0.5,WALLH,CZ(13),0.012,0.012,4,0x5a5e60);
  K.rod('metal',CX(55.5)+0.5,2.68,CZ(13),CX(55.5)+0.5,WALLH,CZ(13),0.012,0.012,4,0x5a5e60);
  var hang=[14,30,44];
  for(i=0;i<hang.length;i++){
    var hx=CX(hang[i]), hz=CZ(13);
    K.box('metal',hx,2.40,hz,0.06,0.42,1.30,0x2a2e30,1);
    garageSign(c,'出口  EXIT  →',1.25,0.36,'#1e8a4a','#eaffef',hx-0.035,2.40,hz,-Math.PI/2,true);
    garageSign(c,'←  出口  EXIT',1.25,0.36,'#1e8a4a','#eaffef',hx+0.035,2.40,hz,Math.PI/2,true);
    K.rod('metal',hx,2.61,hz-0.5,hx,WALLH,hz-0.5,0.012,0.012,4,0x5a5e60);
    K.rod('metal',hx,2.61,hz+0.5,hx,WALLH,hz+0.5,0.012,0.012,4,0x5a5e60);
  }

  /* ---- 顶上：梁、风管、喷淋、线槽、灯管 ---- */
  var pr=[5,12,19], pc=[8,18,28,38,48];
  for(i=0;i<pr.length;i++) K.box('concrete',0,WALLH-0.25,CZ(pr[i]),W-2,0.5,0.6,0x7a7a74,1.0);
  for(i=0;i<pc.length;i++) K.box('concrete',CX(pc[i]),WALLH-0.25,0,0.6,0.5,H-2,0x7a7a74,1.0);
  for(gy=3;gy<H-2;gy+=7) K.rod('metal',-halfW+1,2.70,CZ(gy),halfW-1,2.70,CZ(gy),0.08,0.08,8,0x4a4e50);   /* 原来的那几根管子，挪到梁下面 */
  var dz=CZ(7)+0.2;
  K.box('metal',0,2.24,dz,W-3,0.42,0.90,0x8a9294,1.08);                        /* 风管 */
  if(!low) for(x=-halfW+2;x<halfW-2;x+=1.6) K.box('metal',x,2.24,dz,0.05,0.48,0.96,0x9aa2a4,1.1);
  var spr=[CZ(2),CZ(16),CZ(23)];
  for(i=0;i<spr.length;i++){
    K.rod('metal',-halfW+1,2.86,spr[i],halfW-1,2.86,spr[i],0.03,0.03,6,0xa8302a);           /* 喷淋 */
    if(hi) for(x=-halfW+3;x<halfW-2;x+=3) K.cyl('metal',x,2.70,spr[i],0.03,0.02,0.16,6,0xc8b070);
  }
  K.box('metal',0,2.66,CZ(13)-1.6,W-6,0.08,0.36,0x6a7072,1.05);              /* 线槽 */
  for(x=-halfW+4;x<halfW-6;x+=6){                                              /* 灯管：大多是黑的 */
    for(k=0;k<2;k++){
      var lz=k?CZ(16)+0.8:CZ(9)+0.8, lit=(hash2(Math.round(x),k*7)<0.12);
      K.box('metal',x,WALLH-0.53,lz,1.30,0.05,0.16,0x8a9094,1);
      K.box(lit?'emit':'plastic',x,WALLH-0.565,lz,1.20,0.025,0.06,lit?0x8a9ca4:0x3a3e40,1);
    }
  }
}

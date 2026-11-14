'use strict';
// Холсты и шейдер: цветокор и эффекты считает видеокарта.

/* ---------- холсты ---------- */
const out=$('#out'), ctx=out.getContext('2d');
const glc=document.createElement('canvas');
const gl=glc.getContext('webgl',{premultipliedAlpha:false,antialias:false})||glc.getContext('experimental-webgl');
let W=1080,H=1920;
const VS='attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const FS=`precision highp float;varying vec2 v;uniform sampler2D T;uniform vec2 uS,uSh,uBd;
uniform float uZ,uR,uFl,uDim,uRgb,uBl,uCon,uSat,uTemp,uBri,uFade,uVig,uGr,uTime,uTeal;
vec2 map(vec2 p){p.x*=.5625;float c=cos(uR),s=sin(uR);p=vec2(p.x*c-p.y*s,p.x*s+p.y*c);p.x/=.5625;p=p/uZ+uSh;
 vec2 q=p+.5;q=1.-abs(1.-mod(q,2.));return (q-.5)*uS+.5;}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+uTime)*43758.5453);}
void main(){vec2 p=v-.5;vec3 c;
 if(uBl>.003||abs(uBd.x)+abs(uBd.y)>.003){c=vec3(0.);for(int i=0;i<8;i++){float k=float(i)/8.;c+=texture2D(T,map(p*(1.-uBl*k)+uBd*k)).rgb;}c/=8.;}
 else{vec2 d=p*uRgb;c=vec3(texture2D(T,map(p+d)).r,texture2D(T,map(p)).g,texture2D(T,map(p-d)).b);}
 c+=uBri;c=(c-.5)*uCon+.5;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,uSat);
 c.r+=uTemp;c.b-=uTemp;c+=uTeal*mix(vec3(-.045,.012,.05),vec3(.05,.015,-.045),smoothstep(.15,.85,l));
 c=c*(1.-uFade)+uFade*vec3(.13,.13,.15);
 c*=1.-uVig*smoothstep(.3,.95,length(p*vec2(1.,1.25)));
 c+=(h(v*vec2(1080.,1920.))-.5)*uGr;c*=1.-uDim;c=mix(c,vec3(1.),uFl);
 gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;
let U={},tex;
function initGL(){
  if(!gl)return;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  for(const n of ['uS','uSh','uBd','uZ','uR','uFl','uDim','uRgb','uBl','uCon','uSat','uTemp','uBri','uFade','uVig','uGr','uTime','uTeal'])U[n]=gl.getUniformLocation(pr,n);
  tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
}
function setSize(q){W=q;H=q*16/9;out.width=glc.width=W;out.height=glc.height=H;if(gl)gl.viewport(0,0,W,H)}

import * as THREE from 'three';
import type { Design, Stitch, Vec3 } from './model.ts';
import { activeEnd } from './machine.ts';
export function plyCurve(curve: THREE.Curve<THREE.Vector3>, offset:number, phase:number){
 const points:THREE.Vector3[]=[];
 for(let i=0;i<=96;i++){const t=i/96,p=curve.getPoint(t),tangent=curve.getTangent(t);const n=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();const b=new THREE.Vector3().crossVectors(tangent,n).normalize();const a=t*Math.PI*12+phase;const join=Math.min(1,t*12,(1-t)*12);p.addScaledVector(n,Math.cos(a)*offset*join).addScaledVector(b,Math.sin(a)*offset*join);points.push(p);}
 return new THREE.CatmullRomCurve3(points);
}
export function fuzzGeometry(curve:THREE.Curve<THREE.Vector3>,radius:number,fuzz:number,seed:number){
 const positions:number[]=[];
 const rand=(i:number)=>{const x=Math.sin((i+seed*97)*127.1)*43758.5453;return x-Math.floor(x);};
 for(let i=0;i<110;i++){
  const t=i/110,p=curve.getPoint(t),angle=rand(i)*Math.PI*2;
  const dx=Math.cos(angle),dy=Math.sin(angle),len=fuzz*(.25+rand(i+300));
  positions.push(p.x+dx*radius,p.y+dy*radius,p.z+.018,p.x+dx*(radius+len),p.y+dy*(radius+len),p.z+.025+len*.5);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return g;
}
// Store each completed path, rather than rebuilding old fabric from current settings.
export function makeStitch(d:Design,completed:Stitch[],targetIndex:number|null):Stitch{
 const start=activeEnd(completed),n=completed.length,row=Math.floor(n/d.columns),dir=row%2?-1:1;
 const spacing=.43+d.hook*.055;
 const elasticity=d.strands.reduce((a,s)=>a+s.elasticity,0)/d.strands.length;
 const h=spacing*(.75+elasticity*.1);
 const target=d.stitch==='single'&&targetIndex!==null?completed[targetIndex].loop:null;
 let x=start[0],y=start[1];
 if(n>0&&n%d.columns===0)y+=h;
 if(target){x=target[0]-dir*spacing*.5;y=target[1]+h*.7;}
 const v=(a:number,b:number,z:number):Vec3=>[x+a*spacing*dir,y+b*h,.3+z];
 const points:Vec3[]=d.stitch==='chain'
 ? [[...start],v(.18,-.25,0),v(.7,-.25,.04),v(.82,.1,.03),v(.55,.5,0),v(.15,.43,.16),v(.08,.1,.17),v(.5,.06,.18),v(1,0,0)]
 : [[...start],v(.18,.15,.12),[target![0]-.13,target![1]-.08,.22],[target![0]+.06,target![1]-.12,.39],v(.3,.5,.18),v(.35,.7,0),v(.73,.62,-.02),v(.8,.24,.08),[target![0]+.12,target![1],.45],v(.75,-.1,.16),v(1,0,0)];
 return {id:n,type:d.stitch,hook:d.hook,strands:structuredClone(d.strands),points,end:points.at(-1)!,loop:v(.5,.28,.04),targetIndex:d.stitch==='single'?targetIndex:null,row};
}
export function recordCurve(s:Stitch){return new THREE.CatmullRomCurve3(s.points.map(p=>new THREE.Vector3(...p)),false,'centripetal');}

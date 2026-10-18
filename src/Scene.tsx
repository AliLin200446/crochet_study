import { memo, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStudio } from './store';
import { recordCurve } from './geometry';
import { YarnPath } from './Materials';
import { HookController } from './HookController';
import { activeEnd, gestureTarget } from './machine';
import { knotEnd, type Stitch } from './model';
const FabricStitch=memo(function FabricStitch({record}:{record:Stitch}){const curve=useMemo(()=>recordCurve(record),[record]);return <YarnPath curve={curve} strands={record.strands}/>;});
function Studio(){const {camera,gl,size}=useThree();const controls=useRef<OrbitControls|null>(null),hook=useRef<THREE.Group>(null);const aim=useRef(new THREE.Vector3(-2.5,-.4,.45));const s=useStudio();
 const reduced=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 useEffect(()=>{const c=new OrbitControls(camera,gl.domElement);controls.current=c;c.enableDamping=!reduced;c.minDistance=5;c.maxDistance=48;c.maxPolarAngle=Math.PI*.48;c.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};c.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};return()=>{controls.current=null;c.dispose();};},[camera,gl,reduced]);
 useEffect(()=>{const c=controls.current;if(c){c.mouseButtons.LEFT=s.mode==='inspect'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;c.touches.ONE=s.mode==='inspect'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;}},[s.mode]);
 useEffect(()=>{camera.up.set(0,1,0);const distance=Math.max(16,19/(size.width/size.height));camera.position.set(0,-distance*.28,distance);camera.lookAt(0,0,0);controls.current?.target.set(0,0,0);controls.current?.update();},[camera,s.cameraKey,size.width,size.height]);
 const knot=useMemo(()=>new THREE.CatmullRomCurve3([new THREE.Vector3(-3.5,-1.8,.2),new THREE.Vector3(-3.1,-1,.3),new THREE.Vector3(-3.35,-.55,.3),new THREE.Vector3(-2.95,-.2,.3),new THREE.Vector3(-2.6,-.5,.3),new THREE.Vector3(-2.95,-.9,.43),new THREE.Vector3(...knotEnd)]),[]);
 const knotStrands=useRef(structuredClone(s.completed[0]?.strands??s.design.strands));
 const active=activeEnd(s.completed);const loop=useMemo(()=>new THREE.CatmullRomCurve3(Array.from({length:25},(_,i)=>{const a=i/24*Math.PI*2;return new THREE.Vector3(active[0]+Math.sin(a)*.23,active[1]+.23-Math.cos(a)*.23,.34+Math.sin(a)*.07);})),[active]);
 const feed=useMemo(()=>s.design.strands.map(()=>new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,1,0)),49,.04,6,false)),[s.design.strands]);
 useEffect(()=>()=>feed.forEach(g=>g.dispose()),[feed]);
 const bridge=useMemo(()=>new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,1,0)),39,.045,6,false),[]);
 useEffect(()=>()=>bridge.dispose(),[bridge]);
 const hookLoops=useMemo(()=>new THREE.TorusGeometry(.16,.035,6,24),[]);useEffect(()=>()=>hookLoops.dispose(),[hookLoops]);
 useFrame((_,delta)=>{
  controls.current?.update();if(hook.current){hook.current.position.lerp(aim.current,reduced?1:1-Math.exp(-delta*22));hook.current.rotation.z=-.52;hook.current.rotation.x=s.dragging?-.12:0;}
  const tip=hook.current?.position??aim.current;
  const tether=new THREE.CatmullRomCurve3([new THREE.Vector3(...active),new THREE.Vector3(active[0]-.12,active[1]+.25,.42),new THREE.Vector3(tip.x-.13,tip.y+.15,.58),new THREE.Vector3(tip.x+.12,tip.y+.2,.58),new THREE.Vector3(active[0]+.12,active[1]+.25,.42),new THREE.Vector3(...active)]);
  const attr=bridge.getAttribute('position');for(let i=0;i<=39;i++){const p=tether.getPoint(i/39),t=tether.getTangent(i/39),n=new THREE.Vector3(-t.y,t.x,0).normalize(),b=new THREE.Vector3().crossVectors(t,n).normalize();for(let j=0;j<=6;j++){const a=j/6*Math.PI*2,q=p.clone().addScaledVector(n,.037*Math.cos(a)).addScaledVector(b,.037*Math.sin(a));attr.setXYZ(i*7+j,q.x,q.y,q.z);}}attr.needsUpdate=true;bridge.computeVertexNormals();bridge.computeBoundingSphere();
  const target=gestureTarget(s.design,s.completed,s.machine);
  const end=s.machine.attached||s.machine.step>0?tip:new THREE.Vector3(...target);
  const fc=new THREE.CatmullRomCurve3([new THREE.Vector3(-5,2.1,.65),new THREE.Vector3(-4.6,.8,.4),new THREE.Vector3(end.x-.6,end.y+.4,.45),end]);
  feed.forEach((g,k)=>{const a=g.getAttribute('position');const radius=s.design.strands[k].thickness*.035;for(let i=0;i<=49;i++){const p=fc.getPoint(i/49),t=fc.getTangent(i/49),n=new THREE.Vector3(-t.y,t.x,0).normalize(),b=new THREE.Vector3().crossVectors(t,n).normalize();const twist=i/49*Math.PI*18+k*Math.PI*2/feed.length;if(feed.length>1)p.addScaledVector(n,Math.cos(twist)*radius).addScaledVector(b,Math.sin(twist)*radius);for(let j=0;j<=6;j++){const a0=j/6*Math.PI*2,q=p.clone().addScaledVector(n,radius*Math.cos(a0)).addScaledVector(b,radius*Math.sin(a0));a.setXYZ(i*7+j,q.x,q.y,q.z);}}a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();});
 });
 return <>
 <YarnPath curve={knot} strands={knotStrands.current}/>{s.completed.map(record=><FabricStitch key={record.id} record={record}/>)}<YarnPath curve={loop} strands={s.completed.at(-1)?.strands??knotStrands.current}/>
 <mesh geometry={bridge} castShadow><meshStandardMaterial color={s.design.strands[0].color} roughness={.9}/></mesh>
 {feed.map((g,i)=><mesh key={i} geometry={g} castShadow><meshPhysicalMaterial color={s.design.strands[i].color} roughness={1-s.design.strands[i].shine*.7}/></mesh>)}
 <group ref={hook} scale={[.7+s.design.hook*.075,1,.7+s.design.hook*.075]}>
 <mesh position={[0,1.43,.17]} castShadow><cylinderGeometry args={[.067,.07,2.8,20]}/><meshStandardMaterial color="#c3bbb0" metalness={.92} roughness={.24}/></mesh>
 <mesh position={[0,3.35,.17]} castShadow><capsuleGeometry args={[.17,1.5,6,16]}/><meshStandardMaterial color="#ac7860" roughness={.51}/></mesh>
 <mesh position={[0,2.56,.17]}><cylinderGeometry args={[.13,.09,.2,16]}/><meshStandardMaterial color="#bdb5a8" metalness={.8} roughness={.24}/></mesh>
 <mesh position={[.055,.11,.17]} rotation={[0,0,Math.PI*.78]} castShadow><torusGeometry args={[.105,.052,8,16,Math.PI*1.35]}/><meshStandardMaterial color="#d5cec2" metalness={.92} roughness={.2}/></mesh>
 {Array.from({length:s.machine.loops+(s.machine.attached?1:0)},(_,i)=><mesh key={i} position={[0,.25+i*.18,.17]} rotation={[Math.PI/2,0,0]} geometry={hookLoops}><meshStandardMaterial color={s.design.strands[0].color} roughness={.9}/></mesh>)}
 </group>
 <HookController hook={hook} aim={aim} controls={controls}/>
 <mesh position={[-5,2.1,.7]} scale={[.75,.65,.65]} castShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={s.design.strands[0].color} roughness={.96}/></mesh>
 <YarnBall/>
 </>;
}
function YarnBall(){const strands=useStudio(s=>s.design.strands);const geometries=useMemo(()=>Array.from({length:38},(_,i)=>{const pts=[];for(let j=0;j<=100;j++){const t=j/100*Math.PI*2,a=i*.61,x=Math.cos(t)*.78,y=Math.sin(t)*.68*Math.cos(a);pts.push(new THREE.Vector3(x*Math.cos(a*.25)-y*Math.sin(a*.25),x*Math.sin(a*.25)+y*Math.cos(a*.25),.72+Math.sin(t)*.68*Math.sin(a)));}return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),100,.042,5,true);}),[]);useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);return <group position={[-5,2.1,0]}>{geometries.map((g,i)=><mesh key={i} geometry={g} castShadow><meshStandardMaterial color={strands[i%strands.length].color} roughness={.94}/></mesh>)}</group>;}
export default function Scene(){return <Canvas shadows dpr={[1,1.7]} camera={{position:[0,-5,16],fov:39,near:.1,far:100}} gl={{antialias:true,alpha:true}} aria-label="Manual crochet workspace"><ambientLight intensity={1.3}/><hemisphereLight args={['#fff9ed','#9e8c75',1.1]}/><directionalLight position={[-5,7,12]} intensity={2.5} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-.0005} shadow-normalBias={.035}/><Studio/><mesh position={[0,0,-.07]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.14}/></mesh></Canvas>;}

import { useEffect, useRef, type RefObject } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStudio } from './store';
import { activeEnd, expectedGesture, gestureTarget, instructions } from './machine';
export function HookController({hook,aim,controls}:{hook:RefObject<THREE.Group|null>;aim:RefObject<THREE.Vector3>;controls:RefObject<OrbitControls|null>}){
 const {camera,gl,size}=useThree();const button=useRef<HTMLButtonElement>(null),marker=useRef<HTMLDivElement>(null),tipMarker=useRef<HTMLDivElement>(null);const s=useStudio();
 const root=gl.domElement.closest('.canvas-area') as HTMLElement;
 const html=useRef<Root|null>(null);
 useEffect(()=>{const element=document.createElement('div');element.className='hook-overlay-host';root.appendChild(element);const renderer=createRoot(element);html.current=renderer;return()=>{html.current=null;queueMicrotask(()=>renderer.unmount());element.remove();};},[root]);
 const done=s.completed.length>=s.design.columns*s.design.rows;
 const target=gestureTarget(s.design,s.completed,s.machine);
 const gesture=expectedGesture(s.design.stitch,s.machine);
 const count=s.completed.length;
 useEffect(()=>{const state=useStudio.getState();const a=activeEnd(state.completed);if(state.machine.step>0)aim.current.set(...gestureTarget(state.design,state.completed,{...state.machine,step:state.machine.step-1}));else aim.current.set(a[0]+.2,a[1]+.3,.45);},[count,s.design,s.cameraKey,aim]);
 useEffect(()=>{
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-.45);
  let drag:{id:number;offset:THREE.Vector3;startX:number;startY:number;revision:number}|null=null;
  const world=(e:PointerEvent)=>{const box=gl.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null;};
  const stop=()=>{if(drag&&root.hasPointerCapture(drag.id))root.releasePointerCapture(drag.id);drag=null;if(controls.current)controls.current.enabled=true;useStudio.setState({dragging:false});};
  const down=(e:PointerEvent)=>{
   const state=useStudio.getState();if(state.mode!=='make'||e.button!==0)return;
   if(drag){e.preventDefault();e.stopImmediatePropagation();return;}
   const p=world(e);if(!p||!hook.current)return;
   hook.current.updateWorldMatrix(true,true);
   const grabbed=(e.target as HTMLElement).closest?.('.hook-grab')||ray.intersectObject(hook.current,true).length>0;
   if(!grabbed)return;
   e.preventDefault();e.stopImmediatePropagation();if(controls.current)controls.current.enabled=false;
   drag={id:e.pointerId,offset:p.clone().sub(aim.current),startX:e.clientX,startY:e.clientY,revision:state.revision};root.setPointerCapture(e.pointerId);useStudio.setState({dragging:true,feedback:''});
  };
  const move=(e:PointerEvent)=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopImmediatePropagation();const p=world(e);if(p){p.sub(drag.offset);p.x=THREE.MathUtils.clamp(p.x,-18,18);p.y=THREE.MathUtils.clamp(p.y,-12,15);p.z=.45;aim.current.copy(p);}};
  const up=(e:PointerEvent)=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopImmediatePropagation();const state=useStudio.getState();const moved=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5;
   if(moved&&state.revision===drag.revision&&state.mode==='make'){
    const point=world(e)?.sub(drag.offset);if(point){point.z=.45;const valid=state.act(expectedGesture(state.design.stitch,state.machine),point.toArray() as [number,number,number],.68);if(valid)aim.current.set(...gestureTarget(state.design,state.completed,state.machine));}
   }else if(!moved)useStudio.setState({feedback:'Hold the handle. Drag the hook tip to the ring, then release.'});stop();
  };
  const cancel=(e:PointerEvent)=>{if(drag&&e.pointerId===drag.id)stop();};
  root.addEventListener('pointerdown',down,true);root.addEventListener('pointermove',move,true);root.addEventListener('pointerup',up,true);root.addEventListener('pointercancel',cancel,true);root.addEventListener('lostpointercapture',cancel,true);
  return()=>{root.removeEventListener('pointerdown',down,true);root.removeEventListener('pointermove',move,true);root.removeEventListener('pointerup',up,true);root.removeEventListener('pointercancel',cancel,true);root.removeEventListener('lostpointercapture',cancel,true);stop();};
 },[camera,gl,hook,aim,controls,root]);
 useFrame(()=>{
  const project=(p:THREE.Vector3)=>{p.project(camera);return [(p.x+1)*size.width/2,(-p.y+1)*size.height/2];};
  if(hook.current&&button.current){hook.current.updateWorldMatrix(true,false);const a=project(hook.current.localToWorld(new THREE.Vector3(0,3.35,.17)));button.current.style.left=`${a[0]}px`;button.current.style.top=`${a[1]}px`;if(tipMarker.current){const t=project(hook.current.position.clone());tipMarker.current.style.left=`${t[0]}px`;tipMarker.current.style.top=`${t[1]}px`;}}
  if(marker.current){const p=project(new THREE.Vector3(...gestureTarget(useStudio.getState().design,useStudio.getState().completed,useStudio.getState().machine)));marker.current.style.left=`${p[0]}px`;marker.current.style.top=`${p[1]}px`;}
 });
 useEffect(()=>{html.current?.render(<div className="hook-overlay">
 {s.mode==='make'&&!done&&<><div ref={tipMarker} className="hook-tip" data-testid="hook-tip"/><button ref={button} className={`hook-grab ${s.dragging?'held':''}`} aria-label="Crochet hook: drag to target; Enter performs current gesture" title="Drag the hook tip into the ring and release. Keyboard: Enter performs one gesture." onClick={e=>{if(e.detail===0){aim.current.set(...target);s.act(gesture);}}}><span>{s.guidance&&!s.dragging?'pick up ↘':''}</span></button><div ref={marker} className={`gesture-marker ${s.dragging?'dragging':''}`} data-testid="gesture-target" aria-label={instructions[gesture]}><i/>{s.guidance&&<span>{gesture==='insert'?'insert':gesture==='catch'||gesture.includes('yarn-over')?'catch yarn':'pull through'}<small>release here</small></span>}</div></>}
 </div>);});
 return null;
}

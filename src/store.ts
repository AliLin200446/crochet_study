import { create } from 'zustand';
import type { Design, Strand, Fiber, Stitch } from './model.ts';
import { freshMachine, expectedGesture, transition, findTarget, isValidDrop, gestureTarget, type Machine, type Gesture } from './machine.ts';
import { makeStitch } from './geometry.ts';
import * as history from './history.ts';
export type { Fiber, Strand, Design } from './model.ts';
export const fibers = {
 cotton: { title:'cotton',note:'crisp, matte & quietly structured',weight:'a little definition',fuzziness:0,elasticity:.1,shine:.1 },
 merino: { title:'merino wool',note:'plump, springy & soft to the touch',weight:'a little warmth',fuzziness:.35,elasticity:.65,shine:.05 },
 mohair: { title:'mohair',note:'a fine thread with a featherlight halo',weight:'a little cloud',fuzziness:.85,elasticity:.35,shine:.25 },
};
export const palette=['#8cabb6','#e2cbbb','#b46e5e','#a6ac8b','#d5b36b','#ddd6c6','#706274','#414f56'];
export function newStrand(fiber:Fiber='cotton',color=palette[0]):Strand{return {fiber,color,thickness:fiber==='mohair'?.7:1.2,fuzziness:fibers[fiber].fuzziness,elasticity:fibers[fiber].elasticity,shine:fibers[fiber].shine};}
export const initial:Design={hook:4,columns:10,rows:10,stitch:'chain',strands:[newStrand()]};
type Store=history.History & {design:Design;machine:Machine;sound:boolean;mode:'make'|'inspect'|'pattern';cameraKey:number;saved:boolean;guidance:boolean;dragging:boolean;feedback:string;revision:number;change:(patch:Partial<Design>)=>void;act:(gesture:Gesture,point?:[number,number,number],radius?:number)=>boolean;undo:()=>void;redo:()=>void;restart:()=>void;save:()=>void};
export const useStudio=create<Store>((set,get)=>({
 design:structuredClone(initial),completed:[],past:[],future:[],machine:freshMachine(),sound:false,mode:'make',cameraKey:0,saved:false,guidance:true,dragging:false,feedback:'',revision:0,
 change:patch=>set(s=>({design:{...s.design,...patch,columns:s.completed.length?s.design.columns:patch.columns??s.design.columns},machine:freshMachine(),feedback:s.machine.step?'New settings ready. Start this stitch again.':'These settings are for your next stitch.',saved:false,revision:s.revision+1})),
 act:(gesture,point,radius=.6)=>{const s=get();if(s.mode!=='make'||s.completed.length>=s.design.columns*s.design.rows)return false;
  if(point&&!isValidDrop(point,gestureTarget(s.design,s.completed,s.machine),Math.min(.85,radius))){set({feedback:'Almost. Bring the hook tip into the glowing ring.'});return false;}
  const target=s.machine.targetIndex??findTarget(s.completed),result=transition(s.design.stitch,s.machine,gesture,target);
  if(!result.valid){set({feedback:target===null&&s.design.stitch==='single'?'Make a chain first — it gives the hook a stitch to enter.':'Follow the glowing target for this step.'});return false;}
  if(result.complete){const record=makeStitch(s.design,s.completed,target);set({...history.commit(s,[...s.completed,record]),machine:result.machine,feedback:'A new stitch, made by you.',saved:false,revision:s.revision+1});sound('stitch');}
  else {set({machine:result.machine,feedback:'',revision:s.revision+1});sound();}return true;
 },
 undo:()=>set(s=>({...history.undo(s),machine:freshMachine(),feedback:'One stitch back.',saved:false,revision:s.revision+1})),
 redo:()=>set(s=>({...history.redo(s),machine:freshMachine(),feedback:'One stitch restored.',saved:false,revision:s.revision+1})),
 restart:()=>set(s=>({...history.commit(s,[]),machine:freshMachine(),design:{...s.design,stitch:'chain'},feedback:'A slip knot. A fresh beginning.',saved:false,revision:s.revision+1})),
 save:()=>{const s=get();try{localStorage.setItem('crochet-study-v2',JSON.stringify({version:2,design:s.design,completed:s.completed,machine:s.machine}));set({saved:true});}catch{set({saved:false});}}
}));
export function validDesign(d:Design){return d&&[2,3,4,5,6,8].includes(d.hook)&&Number.isInteger(d.columns)&&d.columns>=6&&d.columns<=22&&Number.isInteger(d.rows)&&d.rows>=2&&d.rows<=16&&['chain','single'].includes(d.stitch)&&Array.isArray(d.strands)&&d.strands.length>=1&&d.strands.length<=3&&d.strands.every(s=>s.fiber in fibers&&/^#[0-9a-f]{6}$/i.test(s.color)&&Number.isFinite(s.thickness)&&s.thickness>=.3&&s.thickness<=3&&[s.fuzziness,s.elasticity,s.shine].every(v=>Number.isFinite(v)&&v>=0&&v<=1));}
export function restore(){try{const raw=localStorage.getItem('crochet-study-v2');if(!raw)return;const v=JSON.parse(raw);if(v.version!==2||!validDesign(v.design)||!Array.isArray(v.completed)||v.completed.length>352)return;
 const vec=(p:unknown)=>Array.isArray(p)&&p.length===3&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<200);
 if(v.completed.some((s:Stitch,i:number)=>s.id!==i||!['chain','single'].includes(s.type)||!validDesign({...v.design,hook:s.hook,strands:s.strands})||!Array.isArray(s.points)||s.points.length<2||s.points.length>30||!s.points.every(vec)||!vec(s.end)||!vec(s.loop)||!(s.targetIndex===null||Number.isInteger(s.targetIndex)&&s.targetIndex>=0&&s.targetIndex<i)))return;
 let machine=freshMachine();
 if(Number.isInteger(v.machine?.step)&&v.machine.step>=0&&v.machine.step<(v.design.stitch==='chain'?2:5)){for(let i=0;i<v.machine.step;i++){const r=transition(v.design.stitch,machine,expectedGesture(v.design.stitch,machine),findTarget(v.completed));if(!r.valid)break;machine=r.machine;}}
 useStudio.setState({design:v.design,completed:v.completed,machine,past:v.completed.map((_:Stitch,i:number)=>v.completed.slice(0,i)).slice(-80),future:[],saved:true});
 }catch{/* corrupt storage must not prevent opening the atelier */}}
let audio:AudioContext|undefined;
export function sound(kind:'stitch'|'select'='select'){if(!useStudio.getState().sound)return;try{audio??=new AudioContext();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.setValueAtTime(kind==='stitch'?380:680,audio.currentTime);o.frequency.exponentialRampToValueAtTime(100,audio.currentTime+.06);g.gain.setValueAtTime(.018,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09);}catch{/* optional sound */}}
export function currentInstruction(){const s=useStudio.getState();return expectedGesture(s.design.stitch,s.machine);}

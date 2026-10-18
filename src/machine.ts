import type { Design, Stitch, Vec3 } from './model.ts';
import { knotEnd } from './model.ts';
export type Gesture = 'catch' | 'pull' | 'insert' | 'yarn-over' | 'draw-up' | 'yarn-over-again' | 'pull-both';
export type Machine = { step: number; loops: number; attached: boolean; targetIndex: number | null };
export const freshMachine = (): Machine => ({ step:0, loops:1, attached:false, targetIndex:null });
export const sequences: Record<Design['stitch'], Gesture[]> = {chain:['catch','pull'],single:['insert','yarn-over','draw-up','yarn-over-again','pull-both']};
export const instructions: Record<Gesture,string> = {catch:'Catch the yarn to make your first loop.',pull:'Pull the yarn through the active loop.',insert:'Insert the hook into the glowing stitch.','yarn-over':'Catch the working yarn.','draw-up':'Draw the yarn through the stitch.','yarn-over-again':'Catch the yarn once more.','pull-both':'Pull through both loops. One new stitch.'};
export function findTarget(stitches:Stitch[]):number|null {
 const used=new Set(stitches.filter(s=>s.targetIndex!==null).map(s=>s.targetIndex));
 for(let i=stitches.length-2;i>=0;i--)if(!used.has(i))return i;
 const last=stitches.length-1;return last>=0&&!used.has(last)?last:null;
}
export function expectedGesture(type:Design['stitch'],m:Machine){return sequences[type][m.step];}
export function transition(type:Design['stitch'],m:Machine,gesture:Gesture,validTarget:number|null):{machine:Machine;complete:boolean;valid:boolean}{
 if(gesture!==expectedGesture(type,m)||type==='single'&&validTarget===null)return {machine:m,complete:false,valid:false};
 const next={...m,step:m.step+1,targetIndex:type==='single'?validTarget:null};
 if(gesture==='catch'||gesture==='yarn-over'||gesture==='yarn-over-again')next.attached=true;
 if(gesture==='draw-up'){next.loops=2;next.attached=false;}
 const complete=next.step===sequences[type].length;
 return {machine:complete?freshMachine():next,complete,valid:true};
}
export function activeEnd(stitches:Stitch[]):Vec3{return stitches.at(-1)?.end??knotEnd;}
// Work is constrained to a shallow plane; each new target needs its own release.
export function gestureTarget(d:Design,stitches:Stitch[],m:Machine):Vec3{
 const a=activeEnd(stitches),g=expectedGesture(d.stitch,m),index=m.targetIndex??findTarget(stitches);
 const base=d.stitch==='single'&&index!==null?stitches[index].loop:a;
 if(g==='insert')return [...base];
 if(g==='catch'||g==='yarn-over'||g==='yarn-over-again')return [base[0]-.8,base[1]+1.15,.45];
 return [base[0]+.8,base[1]+.65,.45];
}
export function isValidDrop(point:Vec3,target:Vec3,radius:number){return Math.hypot(point[0]-target[0],point[1]-target[1])<=radius;}

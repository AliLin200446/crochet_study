import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { plyCurve, fuzzGeometry } from './geometry';
import type { Strand } from './model';
export const YarnPath=memo(function YarnPath({curve,strands,portion=1}:{curve:THREE.Curve<THREE.Vector3>;strands:Strand[];portion?:number}){
 const data=useMemo(()=>strands.map((s,i)=>{const radius=s.thickness*.043;const offset=strands.length>1?radius*.85:0;const c=plyCurve(curve,offset,i*Math.PI*2/strands.length);
 return {s,plies:Array.from({length:3},(_,p)=>new THREE.TubeGeometry(plyCurve(c,radius*.4,p*Math.PI*2/3),96,radius*.64,5,false)),fuzz:s.fuzziness>.02?fuzzGeometry(c,radius,s.fuzziness*.12,i):null};}),[curve,strands]);
 useEffect(()=>()=>data.forEach(d=>{d.plies.forEach(g=>g.dispose());d.fuzz?.dispose();}),[data]);
 data.forEach(d=>{d.plies.forEach(g=>g.setDrawRange(0,Math.floor(96*portion)*30));d.fuzz?.setDrawRange(0,Math.floor(110*portion)*2);});
 return <>{data.map((d,i)=><group key={i}>{d.plies.map((g,j)=><mesh key={j} geometry={g} castShadow receiveShadow><meshPhysicalMaterial color={d.s.color} roughness={1-d.s.shine*.72} sheen={d.s.shine*.5} sheenColor={d.s.color}/></mesh>)}{d.fuzz&&<lineSegments geometry={d.fuzz}><lineBasicMaterial color={d.s.color} transparent opacity={.3}/></lineSegments>}</group>)}</>;
});

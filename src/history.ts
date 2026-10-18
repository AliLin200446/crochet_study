import type { Stitch } from './model.ts';
export type History = { completed: Stitch[]; past: Stitch[][]; future: Stitch[][] };
export function commit(h:History,completed:Stitch[]):History{return {completed,past:[...h.past.slice(-79),h.completed],future:[]};}
export function undo(h:History):History {return h.past.length?{completed:h.past.at(-1)!,past:h.past.slice(0,-1),future:[h.completed,...h.future]}:h;}
export function redo(h:History):History {return h.future.length?{completed:h.future[0],past:[...h.past,h.completed],future:h.future.slice(1)}:h;}

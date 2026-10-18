export type Vec3 = [number, number, number];
export type Fiber = 'cotton' | 'merino' | 'mohair';
export type Strand = { fiber: Fiber; color: string; thickness: number; fuzziness: number; elasticity: number; shine: number };
export type Design = { hook: number; columns: number; rows: number; stitch: 'single' | 'chain'; strands: Strand[] };
export type Stitch = { id: number; type: Design['stitch']; hook: number; strands: Strand[]; points: Vec3[]; end: Vec3; loop: Vec3; targetIndex: number | null; row: number };
export const knotEnd: Vec3 = [-2.8,-.7,.3];

# crochet study — V2 / made by hand

An independent crochet atelier built with React, TypeScript, Vite, React Three Fiber, Three.js, and Zustand. The original cream editorial design and physical toolbox are retained. Nail Study is untouched.

## Run

```sh
npm install
npm run dev -- --port 5174
npm run build
npm test
```

Preview: http://127.0.0.1:5174/. Tests use Node's type stripping (Node 24 recommended).

## Crochet by hand

Start with a slip knot. Hold the wooden hook handle and drag **the hook tip** into the green target, then release. Every release performs at most one valid action. There is no autoplay, timer-driven stitch creation, playback, or speed control.

- **Chain:** catch yarn → pull through. Repeat for each new chain.
- **Single crochet:** make a chain first, select single crochet, then insert → yarn over → draw up a loop → yarn over again → pull through both loops. Each action has its own target and release.
- Missing the target leaves the current action unchanged. The active loop remains connected while the hook moves.
- Keyboard alternative: tab to the hook, then press Enter for each individual gesture.
- Drag empty space to pan; scroll/pinch to zoom. Inspect mode changes the drag to orbit. Hook gestures capture the pointer and disable the camera until release or cancellation.
- Undo/redo works on completed stitches. Cmd/Ctrl-Z and Shift-Cmd/Ctrl-Z are supported. Restart is undoable. Row width is fixed once the first stitch is completed.
- Save writes to `crochet-study-v2` in this browser. Completed geometry, material recipes, and the current valid action resume on reload. Recent stitch undo is reconstructed. Legacy V1 saves remain untouched and are not automatically converted into handmade stitches.

## Materials

Three strands maximum, each with independent material, color, diameter (0.3–3 mm), fuzziness, elasticity, and shine. Individual colored plies remain visible in the working yarn and completed fabric. Elasticity is an artistic loop-height parameter, not physical simulation. Hook size controls spacing independently of yarn diameter. A quiet fit note appears for unusual hook/yarn ratios.

Every stitch stores its own immutable yarn recipe, hook size, path, endpoint, target index, and row. Changing settings never rebuilds finished stitches. Changes during a partially formed stitch cancel that unfinished action sequence, with a message; completed work remains intact.

## Architecture

- `model.ts`: persistent design and stitch records.
- `machine.ts`: deterministic action sequences, loop counts, attachment state, target selection, and drop validity.
- `history.ts`: immutable completed-stitch snapshots and undo/redo.
- `geometry.ts`: connected procedural paths and ply/fiber geometry.
- `Materials.tsx`: per-strand surfaces and fuzz.
- `HookController.tsx`: raycast pickup, constrained drag plane, pointer capture, snap validation, projected targets, and keyboard gestures.
- `Scene.tsx`: persistent stitches, hook, active loop, working yarn, lighting, and camera.
- `store.ts`: commands, material defaults, save/load, and UI state.
- `App.tsx` / `style.css`: existing craft-table interface and contextual guidance.

## Verification and limits

Automated tests cover consecutive chain strokes, single-crochet sequencing, invalid drops, connections across row turns, material persistence, three strands, stitch-level history, hook/diameter independence, idle behavior, and save validation. Browser checks use actual pointer drags for chain and all five single-crochet actions, invalid releases, camera pan/reset, history, three-strand controls, save/reload, and a 390 × 844 layout. The pointer controller accepts touch PointerEvents and handles cancellation; physical touchscreen/pinch hardware has not been tested in this desktop environment.

This is constrained procedural interaction, not physically validated cloth or crochet simulation. Connections and target ownership are deterministic; the stitch diagram is a visual study rather than a certified crochet pattern. Additional stitches and finishing details are explicitly marked upcoming. Capacity is 22 × 16 stitches, with 80 history entries. Geometry is disposed when removed/replaced. No deployment has been performed.

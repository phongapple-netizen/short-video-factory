# Codex instructions — Short Video Factory

One repository contains **many** independent Remotion videos.

1. New videos belong in src/videos/; register each unique Composition ID in src/Root.tsx.
2. Never change an existing ID without migration. IDs must match ^[A-Za-z][A-Za-z0-9_-]*$.
3. Default 1080×1920, 30fps. Keep important content in x=60..930, y=160..1500.
4. Visible Chinese text >=30px, subtitles at most 2 lines, diagrams high contrast.
5. Use one structured content data source for math, diagrams, subtitles, and narration timing.
6. Prefer frame-based Remotion timing (useCurrentFrame, interpolate, spring); do not use random animation timings.
7. Audio target is about -15 LUFS and true peak <= -1.5 dBTP; verify separately, as the workflow does not normalize audio.
8. Output H.264/yuv420p/CRF16 final; half-size CRF22 draft.
9. Never commit credentials or secret/private media to this public repo. Put shared media in public/assets/ and reference via staticFile().
10. Run npm run typecheck and render-test changed compositions where possible.
11. Update README's video list when adding a composition.

# Commands and reference selection

All commands run from the discovered repository root; do not hardcode a cloud workspace path.

```bash
npm ci
npm run cases                         # current versions
npm run cases -- --all                # includes old/preview versions
npm run new:video -- MyVideo --subject math
npm run voice:case -- MyVideo         # real measured cues, Edge/Azure cache
npm run voice:case -- MyVideo --cached-only
npm run typecheck
npm run check:factory
npm run registry:check
npm run review:case -- MyVideo
npm run render:case -- MyVideo final
npm run deliver:case -- MyVideo --reviewed
npm run deliver:case -- MyVideo --verify-links  # after an authorized push
```

Successful references:

- `cube-cross-holes` / `MathExplainer`: voxel geometry, cross-hole subtraction and layer counting. Preserve 25+14+10 removed and 20+16+4+16+20 remaining when modifying this example.
- `trapezoid-hidden-shapes` / `TrapezoidExplainer`: elementary geometry, hidden equal right triangles, circle argument and area100. Preserve the correct perpendicular pairs AC⊥AD and BD⊥BC. Discuss extra-curricular concepts honestly for the intended grade.
- `chibi-map` / `ChibiMapFull`: full SVG world, camera, moving armies, naval fire propagation, late-period regions. It is not the old card film or the two-scene preview.

Existing-reference TTS scripts differ; consult `standards/WORKFLOW.md`. Shared new-topic timing does not rewrite the reference narration or its existing measured cues.

On a new machine install this skill with:

```bash
npx -y skills@latest add phongapple-netizen/short-video-factory --skill short-video-factory -g -y
# Or from the repository without installing another package:
npm run skill:install -- --global
```

The installed skill must still locate/read the repository. Installing a skill does not install Node, ffmpeg, fonts or credentials, and does not guarantee recognition in an already-open session. Start a new session or explicitly request reading the repository's SKILL.md if needed.

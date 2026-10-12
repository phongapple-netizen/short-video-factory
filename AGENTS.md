# Codex instructions — Short Video Factory

This repository contains independent Remotion videos and a reusable production workflow.

1. Read `standards/WORKFLOW.md`, `standards/douyin-profile.json`, and `cases.json`. The profile is the only platform settings source. Keep existing successful films and user edits; do not rebuild unrelated videos.
2. New videos belong in `src/videos/`; use `npm run new:video -- UniqueId --subject math|history|physics|chemistry`. Preserve existing IDs; IDs match `^[A-Za-z][A-Za-z0-9_-]*$`.
3. `cases.json` owns current/preview/archived versions, metadata and timing paths. Resolve a current case through its stable key. Run `npm run registry:sync` after registry edits; do not manually drift the generated Actions menu or registration module. Preserve registration entries of old versions.
4. Default1080×1920/30fps, key content x60..930/y160..1500; visible text≥30px, first-frame title≥88px, captions≤2 lines ending≤1500. No bottom footer. Subject-specific diagrams are code; content/narration/measurements are structured data.
5. Drive animations with frame and seeded randomness. Read timing from measured audio. Keep numeric display text separate from natural speech. Protect cached voices when a service fails; never store/echo credentials.
6. Establish and verify models, facts, grade suitability, units, conditions and sources before speech. Templates are starters, not automatically correct completed topics. Do not silently change unmodified narration to meet a contradictory duration.
7. Run `npm run typecheck`, `npm run check:factory`, `npm run registry:check` and appropriate render/preview checks. Inspect actual review images; automatic geometry audits cannot replace semantic/visual review.
8. `npm run render:case -- Id final` renders CRF16 H.264/yuv420p/AAC then normalizes/verifies final encoded audio (~−15 LUFS, peak≤−1.5 dBTP). Use configured browser paths; draft is half-sizeCRF22.
9. `npm run deliver:case -- Id --reviewed` records the agent/creator's completed image review and prepares files. This flag is not a user permission request. Default is continuous work; stop at preview only if explicitly requested or if required information is missing.
10. Push only within the user's authorized scope. No force-push or committed credentials/private media/dependencies/raw duplicates. After a requested push verify real links with `npm run deliver:case -- Id --verify-links`.
11. Skill source: `skills/short-video-factory/SKILL.md`; its repo discovery, commands and settings refer back here. Install/update with `npm run skill:install -- --global`. Do not duplicate settings inside the Skill.

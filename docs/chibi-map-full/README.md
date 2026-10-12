# 赤壁之战：完整地图推演版

Composition `ChibiMapFull`；封面 `ChibiMapCover`。1080×1920、30fps，七镜共2332帧（77.73秒）。
原版口播、字幕与标题沿用 `src/videos/trapezoid/history/chibi.json`，实际时序沿用同目录 `chibi.runtime.json`，每镜遵循 `max(计划时长, 配音时长+0.8秒)`。口播内容未修改或额外加速，因此无法同时达到此前计划的62–66秒。

地图地理、路线、镜头和后来形势的数据在 `map/world.json`。底图和羽化区域均预渲染为PNG；没有逐帧SVG滤镜。

1. 南下：1.2秒插画后0.5秒淡入地图，镜头随曹军南下，数字滚动至号称80万。
2. 联盟：曹军东下，蓝绿路线汇聚赤壁，诸葛亮出使以虚线表示。
3. 兵力：80个空心红圈缩减为20个实心红圈；5个蓝绿联军圈；疫病圈陆续变暗。曹军点阵在北岸，计数为示意。
4. 连船：12艘曹军战船入场，细线逐条连接，南岸黄盖船队集结。
5. 火攻：10艘小船沿江面进攻，风线从东南吹向西北，火势每0.25秒依次传播；北岸营寨燃烧；插入火攻插画。
6. 败退：红色虚线，泥泞斑块，军队点数变少变暗；镜头跟随撤退至许昌；插入败退插画。
7. 结局：拉回全景，淡入后来魏蜀吴形势，明确非208年疆界；208→220→221→222；关键词依次弹出，末3秒显示评论引导。

图中文字由Remotion绘制。地名34px，标题88px，字幕32px，字幕底边1500px；切换仅一条标题节点。没有添加背景音乐（素材不存在）。

配音缓存为Azure云希−5%：先前Edge-TTS不可用，此次复用已生成音频，不请求TTS服务。可通过现有配音脚本用Edge重生成；不会把密钥存入文件。

```bash
npm ci
npm run typecheck
node scripts/audit-chibi-full.cjs
REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium npm run render:case -- ChibiMapFull final
# 云端无需指定浏览器环境变量
npm run render:case -- ChibiMapFull final
```

`geometry-audit.json`记录27帧（关键帧与每镜切换前、开始、切换后）的浏览器实际坐标、字号、标题数量与字幕安全区。
`scene-table.json`记录实际起止时间、配音时长和字数/秒；没有超过4.8字/秒的场景。
`audio-report.json`为编码后AAC的ebur128响度/真峰值检测，`ffprobe.json`对应原画质成片，`small-ffprobe.json`对应较小下载版。

原画质为H.264/AAC、yuv420p、CRF16。较小下载版保持1080×1920、30fps和相同AAC音频，仅将视频编码为CRF27以降低下载大小。

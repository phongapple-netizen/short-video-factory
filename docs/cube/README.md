# 十字贯通孔 · 竖屏数学讲解

抖音版：1080 × 1920，30 fps，63 秒。保留现有2D SVG单位方块模型、孔洞内壁与讲解逻辑。

安全区统一定义在 `src/layout.ts`：x=60–930，y=160–1500。字幕框底边固定在1500，页眉顶边不早于160，无底部页脚。
时间轴定义在 `src/timeline.json`：0–6读题，6–26打孔，26–32分层，32–47点数，47–58验算，58–63互动结尾。
结尾76弹出，局部时间3秒后淡入评论提示。封面为独立的 `DouyinCover` Still。

## 几何依据

正方体含 125 个 1 cm³ 单位方块，坐标 x/y/z 均为 0–4。
小十字截面定义为 `|a−2| + |b−2| ≤ 1`，仅占五格：中心和上下左右四个相邻格。

- 上下孔：截面在 xy 平面，沿 z 贯通。
- 左右孔：截面在 yz 平面，沿 x 贯通。
- 前后孔：截面在 xz 平面，沿 y 贯通。

每个孔单独体积都是 25。依次对剩余方块做差集，新增挖走 25、14、10，剩余 125、100、86、76。
五层真实截面分别含 20、16、4、16、20 个方块。打孔、分层、二维格子和编号均读取 `src/geometry.ts`，避免图与数字不一致。

第一、第五层（20格）：
```
■■■■■
■■·■■
■···■
■■·■■
■■■■■
```
第二、第四层（16格）：
```
■■·■■
■■·■■
·····
■■·■■
■■·■■
```
第三层（4格）：
```
■···■
·····
·····
·····
■···■
```

## 配音与字幕

`scripts/prepare_douyin_audio.py` 复用原Edge-TTS配音；开场1.10倍速、验算1.25倍速，其余配音保持原速，用ffprobe测量新的实际时长后对齐。
原始字幕/配音文本保存在 `src/captions-v2.json`。当前字幕数组 `src/captions.json` 的 `text` 使用阿拉伯数字，`voiceText` 保留原始汉字读法。
音频起点、字幕显示与打孔/点数关键动作都读取该数组。新TTS请求曾返回403，因此本版不依赖再次联网生成配音。
`python scripts/generate_voice.py --fresh` 可在服务可用时重新生成原读法；默认执行只复用现有配音。

## 运行

```sh
python scripts/prepare_douyin_audio.py
npx remotion studio src/index.tsx
npx remotion still src/index.tsx DouyinCover out/douyin-cover.png --browser-executable=/usr/bin/chromium
npx remotion still src/index.tsx MathExplainer out/douyin-review-15s.png --frame=450 --browser-executable=/usr/bin/chromium --props='{"showSafeArea":true}'
npx remotion render src/index.tsx MathExplainer out/douyin-raw.mp4 --browser-executable=/usr/bin/chromium --crf=16 --pixel-format=yuv420p --codec=h264 --audio-codec=aac --color-space=bt709
python scripts/normalize_audio.py
ffprobe -v error -show_streams -show_format out/douyin-final.mp4
ffmpeg -hide_banner -i out/douyin-final.mp4 -af ebur128=peak=true -f null -
```

`out/douyin-review-*.png` 是0s、15s、40s、结尾、封面及额外分层/验算/残留检查帧，红虚线仅为审阅安全区边界，成片和封面不包含虚线。
`scripts/check_safe_frames.py` 检查这些帧的主要前景是否越界；报告在 `out/douyin-safe-area-report.json`。
归一化采用两遍loudnorm，目标-15 LUFS，给AAC编码留少量真峰值余量，并用ebur128复测编码成品；测量报告在 `out/douyin-audio-report.json`。
最终视频为 `out/douyin-final.mp4`，封面为 `out/douyin-cover.png`。之前两版视频仍保留。

## 后续跨学科视频

当前工作区通用制作规范保存在 `../video-production/STANDARDS.md`，默认参数为 `../video-production/douyin-profile.json`，选题单为 `../video-production/BRIEF_TEMPLATE.md`。
这些文件用于新项目复用；本次数学视频的场景、模型和成片不受影响。

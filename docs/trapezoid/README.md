# 等腰梯形 · 对角线垂直两腰

新增“图说历史”合成 `ChibiHistory` 与 `ChibiCover`：内容数据和配音、导出流程见 [HISTORY.md](HISTORY.md)。

62秒抖音竖屏视频，1080×1920、30fps。应用 `src/profile.json` 的安全区、字号、编码和音量规范。
本条明确保留用户指定的7秒开场和6秒结尾，覆盖通用时长默认值。

## 题目与几何模型

AB是画在上方的短底，CD是下方长底。两腰为AD和BC。
**AC⊥AD，BD⊥BC**；未使用AC⊥BC、BD⊥AD。

`src/geometry.ts` 定义题目提供的精确坐标：
A(−10,10)，B(10,10)，C(10√2,0)，D(−10√2,0)，O(0,20−10√2)，H(10√2,10)。
辅助点E(−10,0)是A到CD的垂足；M(0,0)是CD中点；N(0,10)是AB中点。

图形根据同一坐标以780px宽投影，居中在安全区内；直角符号由相应两条射线的单位向量绘制，角度弧也由实际射线生成。
模块加载时断言135°、两个指定90°、两腰相等、高10、面积100，以及45°、22.5°、112.5°、67.5°和O的共线关系。
条件不满足会报错。计算记录保存在 `out/model-check.json`。

## 分镜

| 时间 | 内容 |
| --- | --- |
| 0–7 | 第一帧88px标题；梯形从下往上显现，标明两个直角、135°及AB=20 |
| 7–17 | 邻补角45°；高亮△AOD，推出AD=AO |
| 17–27 | 第3步：取CD中点M，分别观察直角△ACD、△BCD，得到MA=MB=MC=MD，四点同圆 |
| 27–38 | 第4步：∠ADB=45°，同弧AB的圆心角∠AMB=90°；发现等腰直角△AMB |
| 38–48 | 第5步：作MN⊥AB，等腰直角△AMN使高MN=AN=20÷2=10；面积100弹出 |
| 48–56 | 说明两个拓展性质通常不是普通五年级必修，建议回看第3—5步 |
| 56–62 | 看清垂直关系，答案会不同；评论提示淡入 |

MN表示梯形高。以AB为底求△ABC面积时，真正的垂线是CH；H位于AB在B侧的延长线上。

## 配音与字幕

当前配音已使用 Azure Speech 的 zh-CN-XiaoxiaoNeural 晓晓声音，19句均成功合成。Edge-TTS免费接口仍返回403；先前Google备用音频保留在 public/audio 中。
`src/narration.json` 把数字字幕 `text` 与自然读法 `voiceText` 分开保存。
`scripts/generate_azure_voice.py` 从环境变量读取凭据，音频缓存只记录声音名称与文本，不记录密钥。测量每句WAV时长，用保留音调的atempo调整适配固定窗口（本条最大约1.288倍），重新对齐字幕与动画。
`src/captions.json` 含19句的音源、起止时间、真实时长和速度。

## 运行和导出

当前工作区复用上个项目的已安装依赖。迁移项目后可运行 `npm ci` 安装锁定依赖。
需要重做Azure配音时安装 `requests`（Google备用方案需要 `gTTS`），检查工具需要Pillow；FFmpeg与Chromium按环境安装。

```sh
python scripts/generate_azure_voice.py
npx remotion studio src/index.tsx
npx remotion still src/index.tsx TrapezoidExplainer out/check.png --frame=990 --browser-executable=/usr/bin/chromium --props='{"showSafeArea":true}'
npx remotion still src/index.tsx Cover out/cover.png --browser-executable=/usr/bin/chromium
npx remotion render src/index.tsx TrapezoidExplainer out/raw.mp4 --browser-executable=/usr/bin/chromium --crf=16 --pixel-format=yuv420p --codec=h264 --audio-codec=aac --color-space=bt709 --overwrite
python scripts/normalize_audio.py out/raw.mp4 out/final.mp4
ffprobe -v error -show_streams -show_format out/final.mp4
ffmpeg -hide_banner -i out/final.mp4 -af ebur128=peak=true -f null -
```

成品不带红色虚线；虚线仅用于 `showSafeArea` 审阅模式。
音频采用两遍loudnorm，目标−15 LUFS，并在编码成AAC后验证真峰值≤−1.5 dBTP。

交付：`out/final.mp4`、`out/cover.png`、`out/elementary-*.png`、检查报告和 `publish-copy.md`。

## 小学奥数讲法

不在视频中使用正弦或22.5°推导。两个隐藏图形为△AOD与△AMB；M必须是CD中点。斜边中点到三个顶点等距，以及同弧圆心角为圆周角的两倍，通常不属于普通五年级必修。会做常规面积题也未必能独立发现此解法。O是圆内点，不用∠AOB作为圆周角。画面显示直径CD的上半圆，仍由精确半径计算。模型另断言四个半径相等、∠ADB=45°、∠AMB=90°及MN=AN=BN=10。

本次字幕与解说按用户提供的七段完整文案更新，语音保留汉字读法，字幕使用阿拉伯数字。圆心角直角标记、面积100弹出与结尾评论提示均根据新音频时间重新对齐。

Azure脚本要求环境变量 AZURE_SPEECH_KEY、AZURE_SPEECH_REGION；AZURE_SPEECH_VOICE 默认为 zh-CN-XiaoxiaoNeural。本次区域为 westus2。密钥没有保存到项目。迁移或重启后需在运行环境重新提供密钥。

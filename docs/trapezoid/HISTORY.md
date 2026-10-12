# 图说历史：赤壁之战

新增合成 `ChibiHistory`，封面 Still `ChibiCover`。保留原数学视频合成。
1080×1920、30fps，复用配色、字体、Frame、Pill、CaptionBox、安全区配置与 loudnorm。

## 单一内容数据

编辑 `src/history/chibi.json` 即可更换标题、口播、数字字幕、关键词、图片路径、图表数据、区域示意、计划时长和声音。
`src/history/chibi.runtime.json` 为脚本生成的实测时间轴，不手工编辑。
所有可见文字由 Remotion/SVG 叠加，不使用插画中的文字。
当前六张国风插画均已生成并检查，位于 `public/images/chibi/01.png` 至 `06.png`。
区域图展示后来的三国形势示意，并明确注明不是208年疆界。

## 实际时长

每段时长严格按 `max(planned, audioDuration + 0.3 + 0.5)` 计算，并向上取整到30fps帧。
完整口播、云希−5%和这条公式使成片为 **77.73秒**，无法同时满足62–66秒目标。
保留当前文案和语速，没有通过截断语音或减小尾部空白压缩时长。

| 段落 | 实际起止（秒） | 配音（秒） | 字/秒 |
| --- | --- | --- | --- |
| 01 | 0.00–6.87 | 6.05 | 3.80 |
| 02 | 6.87–19.17 | 11.50 | 3.31 |
| 03 | 19.17–32.83 | 12.86 | 3.73 |
| 04 | 32.83–45.47 | 11.81 | 3.56 |
| 05 | 45.47–58.10 | 11.81 | 3.56 |
| 06 | 58.10–69.47 | 10.56 | 3.12 |
| 07 | 69.47–77.73 | 7.44 | 3.36 |

没有段落超过4.8字/秒；02、06、07低于目标3.5–4.5字/秒。
字数按口播汉字计，去掉标点，不按数字字幕字符数计。

## 配音和字幕

默认先尝试 `edge-tts`：`zh-CN-YunxiNeural`、−5%。本环境仍返回403，
已回退到 Azure Speech 同名云希声音，使用同样的−5% SSML语速，生成每场景一段MP3。
密钥只从环境变量读取，不保存到源文件或音频缓存。
可在 JSON 中切换 `zh-CN-XiaoxiaoNeural`；随后重新准备配音即可。
首次合成需要 `AZURE_SPEECH_KEY` 和 `AZURE_SPEECH_REGION` 环境变量。
依赖 `edge-tts`、`requests`、`Pillow`、FFmpeg、Chromium。

每段音频在场景开始后0.3秒进入，结尾至少留0.5秒。
字幕场景边界以实测音频为准，场景内短句按字符权重分配，并导出UTF-8 SRT。
`public/bgm.mp3` 若存在，循环音量0.08；当前不存在，已跳过。

## 画面与验证

插画做1.0→1.08缓慢推进、奇偶左右平移，所有图像被安全区内的卡片裁切。
相邻场景视觉交叉淡化0.4秒，音频时间轴不因淡化重叠而缩短。
连船SVG的连接线依次出现；火攻叠加少量火星和透明火光。
最后3秒淡入评论提示。所有标题88px，其他文字至少30px。
缺图时打印警告并显示渐变占位，不中断；已实测移走04.png仍能导出对应帧。

固定审阅帧0、12、22、32、44、60秒已导出；因时长扩展，另导出50秒火攻和74秒结尾。
安全区为x=60–930、y=160–1500，字幕底边1500，无页脚小字。
原数学合成字幕框改为调用共享 `CaptionBox`，默认字体和位置保持一致。

```sh
npm run history:prepare
npx remotion still src/index.tsx ChibiCover out/chibi/cover.png --browser-executable=/usr/bin/chromium --overwrite
npx remotion render src/index.tsx ChibiHistory out/chibi/raw.mp4 --browser-executable=/usr/bin/chromium --crf=16 --pixel-format=yuv420p --codec=h264 --audio-codec=aac --color-space=bt709 --concurrency=2 --overwrite
python scripts/normalize_audio.py out/chibi/raw.mp4 out/chibi/final.mp4
ffprobe -v error -show_streams -show_format -of json out/chibi/final.mp4 > out/chibi/ffprobe.json
python scripts/check_history.py
```

音量处理报告随输出视频保存在 `out/chibi/audio-report.json` 和 `ebur128.log`，
不会覆盖数学视频的音量报告。视频和字幕位于 `out/chibi/final.mp4`、`captions.srt`。
源视频CRF16、H264、yuv420p、BT.709，响度处理时复制视频流，只重新编码AAC。

## 修改文件

新增：`src/history/chibi.json`、生成的`chibi.runtime.json`、`src/history/video.tsx`、`src/components/CaptionBox.tsx`、`scripts/prepare_history.py`、`scripts/check_history.py`、六张配图和七段场景MP3、`HISTORY.md`。

修改：`src/root.tsx`注册历史合成；`src/layout.ts`提供SAFE_TOP等别名；`src/components/Frame.tsx`支持系列名；`src/video.tsx`复用共享字幕框；`scripts/normalize_audio.py`按视频输出目录保存报告；`package.json`增加历史命令；`README.md`增加入口。

## 成片测量

最终视频1080×1920、30fps、H264＋AAC、yuv420p；视频流77.733333秒，MP4封装77.8秒。编码后ebur128测得−15.0 LUFS、真峰值−1.7 dBTP。六张配图齐全。62–66秒目标未满足，原因是完整口播在云希−5%下按指定公式得到77.73秒；Edge-TTS免费接口仍403，因此使用Azure同名云希声音。

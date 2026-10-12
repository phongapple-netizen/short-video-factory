# 赤壁之战：地图推演版预览

本轮按用户要求只制作第04、05两个镜头并导出开始、中间、结束六帧，等待确认后才继续其他镜头和全片渲染。
新合成：`ChibiMapPreview`，1080×1920、30fps，时长25.27秒（镜头04、05实际配音窗口拼接）。
沿用 `src/history/chibi.json` 中的口播、字幕、屏幕标题；音频直接复用现有Azure云希−5%场景MP3。
Edge-TTS接口此前返回403，未改变配音提供方或文案。

地图使用一个1400×1600的SVG world，镜头焦点固定为屏幕(540,820)，`interpolate` + cubic inOut。
羊皮纸纹理、淡色山脉和江河已预渲染到 `public/map/base.png`，无逐帧SVG滤镜。
地点及路线坐标存于 `src/history/map/world.json`；地名以34/scale绘制，屏幕有效字号34px；路径线宽6/scale。
模型加载时检查乌林在完整河宽之外的北岸、赤壁在南岸、江陵到柴桑的上游至下游次序。
曹军12船首尾以细线连接；黄盖10船在南岸水面集结，军营地名仍保留原坐标，实际船行路径沿江面。
火势到达船阵后沿连续连接顺序每0.25秒点燃下一船，再点燃北岸营寨；火星使用固定种子的random。
东南风流线从右下向左上；火攻照片按计划镜头的6–8秒区间缩放到实际配音时长叠入。
镜头04尾部平滑拉到镜头05起始3.4倍，再向2.6倍拉远。标题仅保留一个DOM节点，切换前后各0.25秒淡出/入。

## 六帧

| 文件 | 预览帧 |
| --- | --- |
| 04-start.png | 0 |
| 04-middle.png | 189 |
| 04-end.png | 378 |
| 05-start.png | 379 |
| 05-middle.png | 568 |
| 05-end.png | 757 |

导出命令示例：

```sh
python scripts/prepare_map_base.py
npx remotion still src/index.tsx ChibiMapPreview out/chibi-map/04-middle.png --frame=189 --browser-executable=/usr/bin/chromium --overwrite
```

`geometry-audit.json`记录实际浏览器SVG文字包围盒、有效字号、字幕底边、单标题检查。
`model-check.json`记录岸线位置、船只数量及原始坐标。`review-six-frames.jpg`为六帧总览，`six-frames.zip`包含原尺寸PNG。

## 修改文件

新增：`src/history/map/world.json`、`model.ts`、`preview.tsx`、`scripts/prepare_map_base.py`、`public/map/base.png`、本说明。
修改：`src/root.tsx`注册预览合成；`src/history/video.tsx`导出既有关键词字幕组件；`package.json`与锁文件声明同版本`@remotion/paths`依赖。
新增`scripts/audit_map_frames.cjs`用于实际浏览器文字边界校验。新增`scripts/upload_delivery.py`用于按临时服务返回的动态下载地址交付已选输出文件，验证实际返回JPEG/ZIP/MP4，不上传项目源文件或密钥。

原配图01、05、06均存在，未缺图。本轮未渲染整段地图版、未做其他五镜、未导出地图版封面和全片SRT、未做地图版音量验证，因用户要求先确认第04、05镜头。
完整口播与指定时长公式仍得到77.73秒，不能同时满足62–66秒；在后续全片阶段需决定是否调整时长目标或口播速度/文案。

说明：浏览器渲染器可能把DOM放到屏幕外再画入帧，审阅包围盒已统一换算为视频画布坐标。船阵着火从撞击时刻起严格每0.25秒传播。六帧下载地址已按实际响应内容验证为JPEG和ZIP。

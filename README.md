# 短视频工厂 / Short Video Factory

一个仓库选择、预览和云端渲染多部 Remotion 竖屏短片。三个已制作案例的源码、配音、素材和成片已收录，无需重新申请配音接口即可渲染。

## 选择一个案例

**[进入 Actions 下拉菜单选择视频 →](https://github.com/phongapple-netizen/short-video-factory/actions/workflows/render.yml)**

点击 **Run workflow**，在 `composition` 下拉菜单选一个，再选 `final`，启动即可。完成后在运行详情的 **Artifacts** 下载视频、封面和字幕 ZIP（保留14天）。

| 案例 | composition 下拉选项 | 时长 | 成片下载 | 封面 |
| --- | --- | --- | --- | --- |
| 正方体打三个十字孔，剩余体积76 | `MathExplainer` | 63秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/cube.mp4) | [查看](previews/cube-cover.png) |
| 等腰梯形：发现隐藏图形，面积100 | `TrapezoidExplainer` | 62秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/trapezoid.mp4) | [查看](previews/trapezoid-cover.png) |
| 赤壁之战：地图推演版（最新改版，第04、05镜头） | `ChibiMapPreview` | 25.27秒 | [下载最新地图版 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/chibi-map.mp4) | [查看六帧](previews/chibi-map-review.jpg) |

以上 MP4 放在仓库中，不依赖临时网盘。浏览器若直接播放，可右键链接“另存为”。赤壁旧图片版仓库预览采用压缩视频，方便下载；Actions 的 final 选项会从源码重新导出 CRF16 原画质。

**赤壁主入口已改为最新地图版 `ChibiMapPreview`**：镜头在地图上推拉，曹军连船、黄盖火船移动、东南风和火势传播均为动画。目前是第04、05镜头的25.27秒预览，尚未完成其余镜头与全片。[六帧预览](previews/chibi-map-review.jpg)。

旧“图片卡片+字幕”版明确保留为 `ChibiHistory`（77.7秒），[旧版MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/chibi.mp4)、[旧版封面](previews/chibi-cover.png)。它不是最新地图改版。原来约64秒是计划时长，现有口播按 `max(计划时长, 配音时长+0.8秒)` 得到77.7秒，本次不改变口播。

原有 `PirateCoins`（60秒、无配音示例）和 `FactoryDemo`（12秒）也保留，ID 未改。

## 本地预览与导出

需要 Node.js 22+；重新渲染还需要 Python 3、ffmpeg/ffprobe 和中文字体。

```bash
npm ci
npm run dev
# Studio 左侧直接选择案例或封面
npm run typecheck
npm run compositions
npm run render:case -- MathExplainer final
npm run render:case -- TrapezoidExplainer final
npm run render:case -- ChibiHistory final
# 仅地图04、05草稿
npm run render:case -- ChibiMapPreview draft
```

渲染统一使用1080×1920、30fps、H.264、AAC、yuv420p、CRF16。draft 是半尺寸CRF22。`scripts/render-case.mjs` 会对有配音的视频执行两遍 loudnorm，并对编码后的 AAC 检测约−15 LUFS、峰值≤−1.5 dBTP；渲染结果在 `out/<composition>/`。可用环境变量 `REMOTION_BROWSER_EXECUTABLE` 指定本机 Chromium，云端默认使用 Remotion Chrome Headless Shell。

单独导出封面：

```bash
npx remotion still src/index.ts DouyinCover out/cube-cover.png
npx remotion still src/index.ts Cover out/trapezoid-cover.png
npx remotion still src/index.ts ChibiCover out/chibi-cover.png
```

## 文件组织与后续制作

- `cases.json`：三个案例的入口、时长、成片、封面和状态。
- `src/Root.tsx`：统一注册；`src/videos/cube/` 和 `src/videos/trapezoid/`：保留已成功的动画实现；历史在后者的 `history/` 中，共用字幕和安全区组件。
- `public/assets/`：各案例配音、六张赤壁插画和预渲染地图；无内置背景音乐。
- `standards/`：抖音安全区、字号、编码、响度和选题模板。
- `previews/`：现有成片、封面、历史SRT、地图预览。
- `docs/`：原项目制作记录与已有检验报告；原记录的命令和路径以本 README 为准。报告对应原制作输出，不代表本次迁移重新渲染了全片。

新增题材沿用 `src/videos/`、结构化JSON内容、安全区 x=60..930 / y=160..1500；再注册唯一ID、添加 `cases.json` 和工作流选项。

## 重新生成配音（可选）

现有音频已经收录，正常预览和导出无需密钥。修改口播后才需生成：

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/cube/generate_voice.py --fresh
python3 scripts/trapezoid/generate_azure_voice.py
python3 scripts/trapezoid/prepare_history.py
python3 scripts/trapezoid/prepare_map_base.py
```

正方体用 Edge-TTS 晓晓；梯形现有配音是 Azure 晓晓；历史配置是 Edge-TTS 云希、语速−5%，现有缓存来自 Azure 云希（此前 Edge 接口不可用）。Azure 重生成只读取环境变量 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION`、可选 `AZURE_SPEECH_VOICE`；请在本机环境或 GitHub Secrets 设置，勿提交密钥。脚本改写字幕/时间轴后请重新导出与检查。

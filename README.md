# 短视频工厂 / Short Video Factory

一个仓库选择、预览和云端渲染多部 Remotion 竖屏短片。三个已制作案例的源码、配音、素材和成片已收录，无需重新申请配音接口即可渲染。

## 选择一个案例

**[进入 Actions 下拉菜单选择视频 →](https://github.com/phongapple-netizen/short-video-factory/actions/workflows/render.yml)**

点击 **Run workflow**，在 `composition` 下拉菜单选一个，再选 `final`，启动即可。完成后在运行详情的 **Artifacts** 下载视频、封面和字幕 ZIP（保留14天）。

<!-- cases:start -->
| 案例 | Composition ID | 时长 | 成片 | 状态 |
| --- | --- | --- | --- | --- |
| 正方体打三个十字孔 | `MathExplainer` | 63秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/cube.mp4) | 正式版 |
| 等腰梯形隐藏图形求面积 | `TrapezoidExplainer` | 62秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/trapezoid.mp4) | 正式版 |
| 赤壁之战：地图推演版（完整新版） | `ChibiMapFull` | 77.73秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/chibi-map-full.mp4) | 正式版 |
| 五个海盗分金币（13镜讲解版） | `PirateGold` | 227.57秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/pirate-gold.mp4) | 正式版 |
| 五个海盗分金币·第1集：船长独吞98枚 | `PirateGoldEp1` | 65.97秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/pirate-gold-ep1.mp4) | 正式版 |
| 五个海盗分金币·第2集：只花2枚，船长拿走98枚 | `PirateGoldEp2` | 56.93秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/pirate-gold-ep2.mp4) | 正式版 |
| 热水冷水谁先结冰？姆潘巴效应 | `MpembaEffect` | 59.97秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/mpemba-effect.mp4) | 正式版 |
| 三个弹簧铁球，谁先落地？ | `SpringDrop` | 68.53秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/spring-drop.mp4) | 正式版 |
| 闵可夫斯基不等式：一个三角形就能证明 | `MinkowskiTriangle` | 47.33秒 | [下载 MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/minkowski-triangle.mp4) | 正式版 |
| 分子的左右手：0.00005%变成99.5%（2026诺贝尔化学奖） | `ChiralAmplification` | 56.73秒 | 待制作 | 制作中 |
<!-- cases:end -->

**下载较慢时：[赤壁地图版较小文件](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/chibi-map-full-small.mp4)**（同为1080×1920、30fps，音频保持相同，仅降低视频码率）。

以上 MP4 放在仓库中，不依赖临时网盘。浏览器若直接播放，可右键链接“另存为”。赤壁旧图片版仓库预览采用压缩视频，方便下载；Actions 的 final 选项会从源码重新导出 CRF16 原画质。

**赤壁主入口是完整地图版 `ChibiMapFull`**：七个镜头已完整串联，镜头随军队推拉，连船、火船突击、东南风、疫病、败退和后来三国形势都以动画地图讲解。封面为 `ChibiMapCover`，字幕为 [地图版SRT](previews/chibi-map-full.srt)。[查看关键帧](previews/chibi-map-full-review.jpg)，[逐帧高清图](previews/chibi-map-frames)。

`ChibiMapPreview` 保留为第04、05镜头的25.27秒早期预览，已被全片替代，不应作为新版成片选择。

旧“图片卡片+字幕”版明确保留为 `ChibiHistory`（77.7秒），[旧版MP4](https://raw.githubusercontent.com/phongapple-netizen/short-video-factory/main/previews/chibi.mp4)、[旧版封面](previews/chibi-cover.png)。它不是最新地图改版。原来约64秒是计划时长，现有口播按 `max(计划时长, 配音时长+0.8秒)` 得到77.7秒，本次不改变口播。

原有 `PirateCoins`（60秒、无配音示例）和 `FactoryDemo`（12秒）也保留，ID 未改。

### PirateGold 节奏修复

`PirateGold` 为有配音的13镜动画（旧的 `PirateCoins` 是无配音示例）。
仓库 `previews/pirate-gold.mp4` 保留旧版供对比；在 Actions 选择
`PirateGold` 的 `final` 渲染会使用现有语音缓存重新压缩镜头间停顿，
自动重建混音、场景时间轴和逐句字幕，使投票与结算跟随讲解。

```bash
npm run check:pirate
npm run render:case -- PirateGold final
npm run voice:case -- PirateGold --cached-only
```

注意：旧口播包含一句“B和D为什么不反对？”（实际两人投反对票），
画面改为“B、D反对为什么没用？”，但音频仍为旧缓存；
获得配音服务凭据后应重录这一句。

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
# 新版地图全片
npm run render:case -- ChibiMapFull final
# 早期04、05镜头草稿
npm run render:case -- ChibiMapPreview draft
```

渲染统一使用1080×1920、30fps、H.264、AAC、yuv420p、CRF16。draft 是半尺寸CRF22。`scripts/render-case.mjs` 会对有配音的视频执行两遍 loudnorm，并对编码后的 AAC 检测约−15 LUFS、峰值≤−1.5 dBTP；渲染结果在 `out/<composition>/`。可用环境变量 `REMOTION_BROWSER_EXECUTABLE` 指定本机 Chromium，云端默认使用 Remotion Chrome Headless Shell。`REMOTION_CONCURRENCY` 可设为1–4，默认1。

单独导出封面：

```bash
npx remotion still src/index.ts DouyinCover out/cube-cover.png
npx remotion still src/index.ts Cover out/trapezoid-cover.png
npx remotion still src/index.ts ChibiMapCover out/chibi-map-cover.png
```

## 文件组织与后续制作

- `cases.json`：三个案例的入口、时长、成片、封面和状态。
- `src/Root.tsx`：统一注册；`src/videos/cube/` 和 `src/videos/trapezoid/`：保留已成功的动画实现；历史在后者的 `history/` 中，共用字幕和安全区组件。
- `public/assets/`：各案例配音、六张赤壁插画和预渲染地图；无内置背景音乐。
- `standards/`：抖音安全区、字号、编码、响度和选题模板。
- `previews/`：现有成片、封面、历史SRT、地图预览。
- `docs/`：原项目制作记录与已有检验报告；原记录的命令和路径以本 README 为准。报告对应原制作输出，不代表本次迁移重新渲染了全片。

新增题材使用下方模板入口，登记和Actions选项自动同步。

## 重新生成配音（可选）

现有音频已经收录，正常预览和导出无需密钥。修改口播后才需生成：

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/cube/generate_voice.py --fresh
python3 scripts/trapezoid/generate_azure_voice.py
python3 scripts/trapezoid/prepare_history.py
python3 scripts/trapezoid/prepare_map_base.py
python3 scripts/trapezoid/prepare_map_regions.py
```

正方体用 Edge-TTS 晓晓；梯形现有配音是 Azure 晓晓；历史配置是 Edge-TTS 云希、语速−5%，现有缓存来自 Azure 云希（此前 Edge 接口不可用）。Azure 重生成只读取环境变量 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_REGION`、可选 `AZURE_SPEECH_VOICE`；请在本机环境或 GitHub Secrets 设置，勿提交密钥。脚本改写字幕/时间轴后请重新导出与检查。


## 稳定制作模板与Skill

规范唯一来源：[工作流](standards/WORKFLOW.md)、[平台参数](standards/douyin-profile.json)、[制作模板](templates/README.md)。

```bash
npm run cases
npm run new:video -- MyLesson --subject math  # history / physics / chemistry
# 替换content.json和Diagram.tsx里的示例，先验证模型
npm run voice:case -- MyLesson
npm run check:factory
npm run review:case -- MyLesson
# 查看实际帧后导出
npm run render:case -- MyLesson final
npm run deliver:case -- MyLesson --reviewed
# 按用户授权推送后测试实际链接
npm run deliver:case -- MyLesson --verify-links
```

模板尚未生成声音时只能预览计划时间轴，正式渲染会拒绝它。新模板不能自动解决任意几何题，也不会自动证明史实；数学/历史成功案例和物理/化学起步模板各有自己的图解与核查方法。

[short-video-factory Skill](skills/short-video-factory/SKILL.md)已随仓库提供，项目入口在`.agents/skills/`。本机安装：

```bash
npm run skill:install -- --global
# 其他机器也可安装：
npx -y skills@latest add phongapple-netizen/short-video-factory --skill short-video-factory -g -y
```

以后可说：“用短视频工厂做这道奥数题，沿用梯形案例，完成后推送仓库。” Skill会读取仓库当前规范，不另复制参数。安装后如当前会话未识别，请新开会话，或直接要求读取仓库SKILL.md；环境和密钥仍需在实际执行机器配置。

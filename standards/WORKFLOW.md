# 短视频工厂工作流 v2

仓库是规范、配置和程序的唯一来源。Skill负责找到仓库、选择参考和按顺序执行，不复制另一份参数。

## 固定参数和可调整内容

`standards/douyin-profile.json`唯一保存画幅、帧率、安全区、字号、配音默认值、编码和响度目标。数学与历史旧案例的layout已经引用它，移除了重复profile。

共同底座：1080×1920、30fps；关键内容x=60..930/y=160..1500；字幕底1500/最多两行；字号≥30、首帧标题≥88；H.264、yuv420p、CRF16、AAC、BT.709；最终AAC约−15 LUFS/±0.3，真峰值≤−1.5 dBTP。

按题材调整：时长、镜头数量、声音、品牌、图形模型、地图、实验、强调色。背景可以满屏，关键图解不进抖音遮挡区。所有动画依赖frame，不能用CSS animation/transition或未设种子的随机数。目标时长是计划，最终以配音实测为准，不将78秒说成64秒。

## 登记与版本

`cases.json`是唯一可渲染案例/版本登记表。每个案例有稳定`key`、当前`id`、`stage`、`subject`、`template`、字幕和时间轴路径。旧版/预览放在`versions`中，原ID不删除、不随意重命名。

- `published`：已完成、已校验的当前成片。
- `draft`：新建或在制作中，不能称为正式交付。
- `preview`：局部样片。
- `archived`：旧版。
- `example`：无配音示例。

默认按稳定key查找当前版本：`chibi-map`永远指向当前完整地图版。显式ID可渲染旧版，交付主入口不能因此切回旧版。

`npm run registry:sync`生成新增composition的统一注册、Actions选项和README案例表。修改登记后运行它；CI以`registry:check`发现遗漏。新版本如有自己的registration路径，要把旧版registration保留在versions中；旧项目的静态Root仍保留原ID。

## 一次制作的步骤

1. 阅读AGENTS、配置、登记表和参考案例；用户已有修改先保留。明确本条只讲清什么、受众/年级、事实、条件和结论。
2. 新选题：`npm run new:video -- UniqueId --subject math|history|physics|chemistry`。编辑content与Diagram；模板中的样例不是最终题目。
3. 验证模型与资料。数学断言图形关系、计数和结果；历史记录出处，区别史实/解释/示意图；物理核对方向、单位和边界；化学核对配平、守恒、条件与现象。适龄方法不能被高级方法悄悄替代。
4. 逐句保存`text`与`voiceText`。新模板运行`npm run voice:case -- Id`；音频按文本+声音+语速缓存，每段计时来自ffprobe。失败时保护旧缓存和运行时间轴。默认数学晓晓、历史云希，Edge失败可以使用配置的Azure环境变量；不打印/保存密钥。缺少可用服务时报告声音未完成，不伪造成功。
5. `npm run typecheck && npm run check:factory && npm run registry:check`。
6. `npm run review:case -- Id`导出首帧、每镜开始/中间/结束、封面与HTML索引。新模板和完整赤壁支持DOM审计；未标注的旧例报告`not-instrumented`，必须看实际帧，不能宣称自动检查了它所有布局。逐帧检查语义、模型、遮挡、字号、对比度、镜头节奏及切换重影。
7. 在请求完整导出时运行`npm run render:case -- Id final`，按共享配置渲染、两遍loudnorm、校验编码后的文件，导出封面、SRT、ffprobe与响度报告。默认concurrency1，资源足够可设`REMOTION_CONCURRENCY=2`。浏览器路径通过环境变量选择，不写死到跨平台脚本。
8. 查看并确认画面后运行`npm run deliver:case -- Id --reviewed`。这是制作者记录已自检，不要求用户额外批准。交付检查预览与成片的源文件签名，拒绝改稿后未重渲染的旧片或draft。复制原画质、生成同尺寸较小下载版、封面、SRT与报告，更新当前入口，填好输出文案文件。
9. 按用户已授权范围提交/推送；不force-push，不提交密钥、node_modules或重复raw。推送后`npm run deliver:case -- Id --verify-links`验证实际视频/PNG/SRT下载，报告当前ID、实测时长、响度、命令及限制。

默认连续推进；用户明确说“先给我确认样片”才在预览停下。选题缺关键事实时先完成独立工作再求补充；不用每个步骤重复申请权限。

## 已成功案例的配音入口

| 案例 | 数据与声音 | 重生成入口 |
| --- | --- | --- |
| 正方体 | 既有Edge晓晓缓存、cue实测时间 | `python3 scripts/cube/generate_voice.py --fresh` |
| 梯形 | 既有Azure晓晓缓存 | `python3 scripts/trapezoid/generate_azure_voice.py` |
| 赤壁完整地图 | 原历史JSON、既有Azure云希−5%缓存 | `python3 scripts/trapezoid/prepare_history.py` |
| 新模板 | content.json→逐句缓存→runtime.json | `npm run voice:case -- Id` |

修改赤壁口播后的prepare会影响同一历史数据的旧版与预览，这是共享数据的现有行为；如需独立版本先复制内容与runtime为独立路径。不要为整理模板重新请求所有声音。

## 发布与检查的边界

`verify-video.py`检查宽高/帧率/编码/像素格式/实际时长，测最终AAC响度。不会自动证明史实、化学条件、几何语义或手机界面遮挡完全正确。阅读关键帧仍由制作者完成。

`render:case`只产出，不自动推送。`deliver:case`只准备交付文件与登记，不自动对外发布。Skill承接用户已有授权继续提交推送，不额外增设批准流程。

物理、化学目前有模板和检查指南，还没有本账号完成的正式参考成片；不能把样例称为成功案例。

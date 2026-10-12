# 工作流整理验证（2026-10-12）

- 类型检查、案例登记与菜单同步检查通过；现有7个视频ID均保留。
- 新建数学、历史、物理、化学四类模板，在隔离目录自动注册并完成关键帧、封面、边界和字号检查。模板示例不计为新正式案例。
- 三个成功案例的回归帧：MathExplainer450、TrapezoidExplainer1100、ChibiMapFull660；与整理前PNG比较，像素完全一致。没有重渲染或替换现有成片。
- 测试缓存生成真实测量时间轴、失效缓存保护旧runtime、拒绝无配音正式导出、当前版本与两镜预览的时间轴重置、SRT毫秒进位。
- 隔离测试已跑通模板预览→渲染→两遍响度处理→ffprobe/ebur128验证→较小视频/封面/SRT/报告交付。测试音频为合成测量夹具，没有调用在线TTS，也不作为用户成片发布。
- 实际配音片段的4秒导出验证：1080×1920、30fps、H.264/yuv420p/AAC，容器4.01秒；−14.8 LUFS、−3.2 dBTP，符合配置容差。该片段仅用于脚本验证。
- 文案变化后，未更新的实测时间轴不能用于正式渲染；模型/源文件变化后，未重新预览、渲染的文件不能重新登记交付。
- Skill已提供项目入口和当前环境全局安装。其他环境仍需安装依赖、字体、ffmpeg及按需配置配音服务。

复现：

```bash
npm ci
npm run typecheck
npm run check:factory
npm run registry:check
npm run test:factory
# 完整模板预览与导出交付测试，需要本机浏览器、ffmpeg
FACTORY_RENDER_TEST=1 REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:factory
```

自动报告不替代事实、图形语义与遮挡的人工检查。默认CI执行快速登记/缓存测试；完整渲染测试按需要运行。

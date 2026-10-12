# 短视频工厂 / Short Video Factory

**一个 GitHub 仓库管理多部 Remotion 竖屏短片，用 GitHub Actions 云端渲染 MP4。** 老电脑用于写代码、预览，无需本地导出。

## 已内置的短片

| Composition ID | 内容 | 时长 | 规格 |
| --- | --- | --- | --- |
| PirateCoins | 五个海盗分金币：逆向归纳法 | 60 秒 | 1080×1920、30fps |
| FactoryDemo | 云端渲染的简短测试动画 | 12 秒 | 1080×1920、30fps |

PirateCoins 当前是**无配音、无背景音乐**的图文动态示例，还不是完整的抖音成片。题设明确为“赞成票达到半数即通过”，不应误改成“必须超过半数”。

## 如何在 GitHub 云端渲染视频

1. 进入仓库的 **Actions** 页面。
2. 左侧找到 **Render MP4 video** → 点击 **Run workflow**。
3. composition 填写 PirateCoins（首次推荐先用 FactoryDemo 测试），以后新增短片填新的 ID。
4. quality 选 final（正式1080×1920，CRF16）或 draft（半尺寸预览，CRF22）。
5. 启动后打开运行详情，在 **Artifacts** 下载 ZIP，解压就是 MP4。

如首次没有 Run workflow，请确认工作流已经在默认分支 main，并检查是否需要在 Actions 页面启用工作流。上传的 Artifacts 只保留14天，请及时下载。

## 如何添加第 N 部短片

1. 在 src/videos/ 新建 MyVideo.tsx，导出 React 组件。
2. 在 src/Root.tsx 注册一个 Composition，设置唯一 ID、durationInFrames、fps、width、height。
3. 推送到 main，在 Actions 中输入新的 Composition ID 再运行渲染。

**不用新建仓库，也不用为每个视频复制一份工作流。**

## 本地预览（可选）

安装 Node.js 22+，在项目目录执行：

    npm install
    npm run dev

查看所有视频 ID：

    npm run compositions

不必在老 Mac mini 上运行完整渲染。配音和音乐可放在 public/assets/ 中并用 staticFile() 引用。

## 项目说明

- .github/workflows/render.yml：手动选择视频和画质、生成 MP4。
- .github/workflows/check.yml：推送或PR后自动运行类型检查。
- src/index.ts、src/Root.tsx：Remotion 入口、视频注册。
- src/videos/：视频组件。AGENTS.md 是 Codex 可遵循的制作规范。
- GitHub Actions 安装 Noto CJK 中文字体，采用 H.264/yuv420p。
- 公共仓库不要提交 API Key、密码和私密素材。
- 当前使用 npm install（无 lockfile）；建议首次安装后提交 package-lock.json，并将 CI 改为 npm ci，提高可重复性。

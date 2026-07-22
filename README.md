# Motion Gallery

纯视频展示用途的沉浸式动态作品展厅。

## 已实现

- 13 个现有视频与缩略图直接复用
- 横屏、竖屏按真实画幅比例混合排版
- 全部 / 横屏 / 竖屏筛选
- 点击卡片进入全屏播放器
- 上一条、下一条、ESC 关闭、左右方向键和手机滑动切换
- 手机端只加载封面，点击作品后才请求正式视频
- 桌面端仅在作品数据配置低码率 `preview` 文件时启用悬停预览，不再使用原始视频预览
- 视频加载超时、失败提示和重新加载按钮
- 动态光雾、轻量粒子背景、鼠标光效与滚动入场
- 弱网、节省流量、触屏设备和减少动画模式自动降级
- 360px 至大屏响应式布局
- 基础 SEO、404、favicon、robots 与 sitemap

## 文件结构

- `index.html` 页面结构
- `assets/styles.css` 全站样式与响应式
- `assets/data.js` 作品数据；以后新增作品主要修改这里
- `assets/app.js` 画廊、筛选、播放器和动态效果
- `videos/` 正式视频目录
- `thumbnails/` 封面目录

## 新增作品

1. 将 MP4 放入 `videos/`。
2. 将封面放入 `thumbnails/`。
3. 在 `assets/data.js` 增加一条作品数据。
4. `orientation` 填写 `landscape` 或 `portrait`。
5. 如有单独制作的低码率预览视频，可增加 `preview: 'previews/文件名.mp4'`；不要将正式视频地址直接作为预览。

## 不备案部署建议

- GitHub 继续用于代码版本管理。
- 正式页面可部署到香港或亚洲节点的静态托管服务。
- 视频优先放到支持香港节点、HTTP Range 和长缓存的对象存储或视频点播服务。
- 域名统一使用 `https://works.devs.surf/`。

当前仓库仍可使用 GitHub Pages 发布：

`https://no9u93nuong2445-spec.github.io/my-video-portfolio/`

GitHub Pages 设置中选择从 `main` 分支根目录发布。合并优化分支后，现有地址会自动更新。

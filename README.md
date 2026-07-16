# Motion Gallery

纯视频展示用途的沉浸式动态作品展厅。

## 已实现

- 13个现有视频与缩略图直接复用
- 横屏、竖屏混合比例作品墙
- ALL / LANDSCAPE / PORTRAIT 筛选
- 点击卡片进入全屏播放器
- 上一条、下一条、ESC关闭、左右方向键和手机滑动切换
- 桌面端悬停静音预览，手机端不自动加载视频
- 动态光雾、粒子背景、鼠标视差、卡片3D倾斜与滚动入场
- 低性能与减少动画模式自动降级
- 360px至大屏响应式布局
- 基础SEO、404、favicon、robots与sitemap

## 文件结构

- `index.html` 页面结构
- `assets/styles.css` 全站样式与响应式
- `assets/data.js` 作品数据；以后新增作品主要修改这里
- `assets/app.js` 画廊、筛选、播放器和动态效果
- `videos/` 原视频目录，不需要变动
- `thumbnails/` 原封面目录，不需要变动

## 新增作品

1. 将MP4放入 `videos/`。
2. 将封面放入 `thumbnails/`。
3. 在 `assets/data.js` 增加一条作品数据。
4. `orientation` 填写 `landscape` 或 `portrait`。

## 部署

仓库继续使用GitHub Pages即可，免费地址：

`https://no9u93nuong2445-spec.github.io/my-video-portfolio/`

GitHub Pages设置中选择从 `main` 分支根目录发布。合并本次优化分支后，现有地址会自动更新。

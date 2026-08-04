# GitHub Pages 部署

1. 打开仓库 Settings → Pages。
2. Build and deployment 选择 Deploy from a branch。
3. Branch 选择 `main`，目录选择 `/ (root)`。
4. 保存后继续使用免费地址：

`https://no9u93nuong2445-spec.github.io/my-video-portfolio/`

合并到 `main` 后，页面会自动使用 `assets/data.js` 配置的 jsDelivr 边缘缓存播放 MP4；若 CDN 不可用，播放器会自动回退到 GitHub Pages 同路径资源。视频仍保留 HTTP Range 友好的 MP4 结构，国内不开代理也能直接访问页面和播放资源。

// Video delivery stays inside the current GitHub repository.
// We keep two jsDelivr network entry points plus the same-origin GitHub Pages URL.
// The player probes them in parallel and selects whichever actually responds first.
window.MOTION_ASSET_CDNS = [
  { name: 'fastly', base: 'https://fastly.jsdelivr.net/gh/no9u93nuong2445-spec/my-video-portfolio@main/' },
  { name: 'jsdelivr', base: 'https://cdn.jsdelivr.net/gh/no9u93nuong2445-spec/my-video-portfolio@main/' }
];
window.MOTION_ASSET_VERSION = '20260815-1';
window.MOTION_DEFAULT_QUALITY = 'smooth';

window.MOTION_WORKS = [
  { id: 1, title: '檐下听雨', subtitle: '电影感叙事短片', duration: '27.5', orientation: 'landscape', resolution: '1280×544', video: 'videos/1.mp4', thumbnail: 'thumbnails/1_thumb_v4.jpg?v=20260815-1' },
  { id: 2, title: '轻商务口播', subtitle: 'AI 数字人口播', duration: '30.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/2.mp4', thumbnail: 'thumbnails/2_thumb.jpg' },
  { id: 3, title: '产品开箱', subtitle: '商品视觉短片', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/3.mp4', thumbnail: 'thumbnails/3_thumb.jpg' },
  { id: 4, title: '城市轻装', subtitle: '男装动态展示', duration: '30.2', orientation: 'portrait', resolution: '720×1280', video: 'videos/4.mp4', thumbnail: 'thumbnails/4_thumb.jpg' },
  { id: 5, title: '黑色型格', subtitle: '服装种草短片', duration: '30.3', orientation: 'portrait', resolution: '720×1280', video: 'videos/5.mp4', thumbnail: 'thumbnails/5_thumb.jpg' },
  { id: 6, title: '通勤型格', subtitle: '场景化服装展示', duration: '30.2', orientation: 'portrait', resolution: '720×1280', video: 'videos/6.mp4', thumbnail: 'thumbnails/6_thumb.jpg' },
  { id: 7, title: '资讯播报', subtitle: '热点口播内容', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/7.mp4', thumbnail: 'thumbnails/7_thumb.jpg' },
  { id: 8, title: '双款讲解', subtitle: '服装销售口播', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/8.mp4', thumbnail: 'thumbnails/8_thumb.jpg' },
  { id: 9, title: '硬箱质感', subtitle: '产品广告短片', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/9.mp4', thumbnail: 'thumbnails/9_thumb.jpg' },
  { id: 10, title: '门店口播', subtitle: '本地商家内容', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/10.mp4', thumbnail: 'thumbnails/10_thumb.jpg' },
  { id: 11, title: '街角烟火', subtitle: '城市生活影像', duration: '15.0', orientation: 'portrait', resolution: '720×1280', video: 'videos/12.mp4', thumbnail: 'thumbnails/12_thumb.jpg' },
  { id: 12, title: '古韵入画', subtitle: '国风叙事短片', duration: '15.1', orientation: 'portrait', resolution: '720×1280', video: 'videos/13.mp4', thumbnail: 'thumbnails/13_thumb.jpg' },
  { id: 13, title: '烟雨江南', subtitle: '国风氛围短片', duration: '15.0', orientation: 'portrait', resolution: '720×1280', video: 'videos/14.mp4', thumbnail: 'thumbnails/14_thumb.jpg' },
  { id: 14, title: '夜色香氛', subtitle: '香水广告概念片', duration: '15.9', orientation: 'portrait', resolution: '720×1280', video: 'videos/15.mp4', thumbnail: 'thumbnails/15_thumb.jpg' },
  { id: 15, title: '电梯来电', subtitle: '都市悬疑叙事', duration: '40.0', orientation: 'portrait', resolution: '720×1280', video: 'videos/16.mp4', thumbnail: 'thumbnails/16_thumb.jpg' },
  { id: 16, title: '森息香氛', subtitle: '森系香氛概念片', duration: '56.9', orientation: 'portrait', resolution: '200×356', video: 'videos/17.mp4', thumbnail: 'thumbnails/17_thumb.jpg' },
  { id: 17, title: '风停以后', subtitle: '海岸情绪叙事', duration: '24.0', orientation: 'landscape', resolution: '320×180', video: 'videos/18.mp4', thumbnail: 'thumbnails/18_thumb.jpg' },
  { id: 18, title: '云海天境', subtitle: '东方奇幻概念片', duration: '33.8', orientation: 'landscape', resolution: '320×180', video: 'videos/19.mp4', thumbnail: 'thumbnails/19_thumb.jpg' }
];

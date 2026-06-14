<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const demos = [
  { path: '/demos/1', num: '01', title: 'FBI CLASSIFIED FILE', desc: '機密檔案夾風格　紅色 CLASSIFIED 印章　條碼裝飾　機密等級條', tag: '精緻感' },
  { path: '/demos/2', num: '02', title: 'FULL SCREEN HERO',   desc: '全螢幕背景　左右切換　側邊縮圖導航　極簡現代', tag: '電影感' },
  { path: '/demos/3', num: '03', title: 'CARD FLIP',          desc: '卡片翻轉動畫　正面人名　背面資料+數值條　格狀排列', tag: '互動感' },
  { path: '/demos/4', num: '04', title: 'TERMINAL HACK',      desc: '黑底綠字終端機　打字機動畫　CRT 掃描線　解密逐行效果', tag: '最 X 檔案' },
  { path: '/demos/5', num: '05', title: 'MATRIX RAIN',        desc: 'Canvas 數位雨特效　點擊角色名稱解鎖檔案　互動式畫面', tag: '動態感' },
  { path: '/demos/6', num: '06', title: 'CONSPIRACY BOARD',   desc: '軟木板陰謀關係圖　SVG 紅線連結　點擊圖釘顯示詳情', tag: '偵探感' },
  { path: '/demos/7', num: '07', title: 'SCROLL STORY',       desc: '全頁滾動敘事　IntersectionObserver 觸發入場動畫　四幕場景', tag: '沉浸感' },
  { path: '/demos/8', num: '08', title: 'HOLOGRAPHIC CARDS',  desc: '滑鼠追蹤 3D 透視翻轉　全息光澤效果　FBI 識別卡風格', tag: '科技感' },
]
</script>

<template>
  <div class="demos-index">
    <button class="back-btn" @click="router.push('/')">← 返回首頁</button>

    <div class="header">
      <h1 class="title">DESIGN DEMOS</h1>
      <p class="sub">選擇一個風格預覽 — 不影響現有頁面</p>
    </div>

    <div class="demo-grid">
      <div
        v-for="d in demos"
        :key="d.num"
        class="demo-card"
        @click="router.push(d.path)"
      >
        <div class="demo-num">{{ d.num }}</div>
        <div class="demo-tag">{{ d.tag }}</div>
        <h2 class="demo-title">{{ d.title }}</h2>
        <p class="demo-desc">{{ d.desc }}</p>
        <div class="enter">ENTER →</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demos-index {
  min-height: 100vh;
  background: #05050f;
  padding: 24px 24px;
  font-family: 'Courier New', monospace;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.back-btn {
  background: none;
  border: 1px solid rgba(255,255,255,0.15);
  color: #666;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  margin-bottom: 24px;
  display: block;
}
.back-btn:hover { color: #fff; }

.header { margin-bottom: 32px; }
.title {
  font-size: clamp(24px, 5vw, 40px);
  font-family: Georgia, serif;
  font-weight: 400;
  color: #fff;
  letter-spacing: 8px;
  margin: 0 0 8px;
}
.sub {
  font-size: 11px;
  letter-spacing: 3px;
  color: #445;
  margin: 0;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1120px;
}

.demo-card {
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.02);
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.demo-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(80,120,255,0.05) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}
.demo-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
.demo-card:hover::before { opacity: 1; }
.demo-card:hover .enter { color: #fff; }

.demo-num {
  font-size: 48px;
  font-family: Georgia, serif;
  color: rgba(255,255,255,0.05);
  position: absolute;
  top: 12px;
  right: 16px;
  line-height: 1;
}

.demo-tag {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 2px;
  color: #4488ff;
  border: 1px solid #2244aa;
  padding: 2px 8px;
  margin-bottom: 12px;
}

.demo-title {
  font-size: 14px;
  color: #ccd;
  letter-spacing: 3px;
  margin: 0 0 10px;
  font-weight: normal;
}

.demo-desc {
  font-size: 11px;
  color: #445;
  line-height: 1.8;
  margin: 0 0 16px;
  letter-spacing: 0.5px;
}

.enter {
  font-size: 11px;
  letter-spacing: 3px;
  color: #334;
  transition: color 0.2s;
}
</style>

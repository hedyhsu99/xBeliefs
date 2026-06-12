<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const chars = [
  { id: 'mulder', name: 'Fox Mulder', sub: 'FBI Special Agent', color: '#1a3a6a', bio: '福克斯‧穆德，英國牛津大學畢業，主修心理學。一心追求X檔案背後的真相，相信外星人存在於地球之上。' },
  { id: 'scully', name: 'Dana Scully', sub: 'FBI Special Agent / Medical Doctor', color: '#4a1a2a', bio: '黛娜．史卡利，醫學及科學背景，最初監視穆德，後成為他最信任的夥伴。' },
  { id: 'skinner', name: 'Walter Skinner', sub: 'FBI Assistant Director', color: '#1a2a1a', bio: 'FBI助理局長，外表嚴肅正直，在關鍵時刻暗中保護穆德與史卡利。' },
  { id: 'smoking', name: 'Smoking Man', sub: 'Unknown Agency', color: '#2a1a0a', bio: '神秘的抽菸男，幕後操控政府機密陰謀的核心人物。資料已遭政府銷毀。' },
  { id: 'krycek', name: 'Alex Krycek', sub: 'Former FBI Agent', color: '#2a0a2a', bio: '前FBI探員，雙重間諜，身份撲朔迷離，曾多次背叛各方勢力。' },
]

const idx = ref(0)
const current = ref(chars[0])

function goTo(i) {
  idx.value = i
  current.value = chars[i]
}
function prev() { goTo((idx.value - 1 + chars.length) % chars.length) }
function next() { goTo((idx.value + 1) % chars.length) }
</script>

<template>
  <div class="demo-hero" :style="`--accent: ${current.color}`">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="label-top">STYLE 02 — FULL SCREEN HERO</div>

    <!-- Hero 背景 -->
    <div class="hero-bg">
      <div class="hero-overlay" :style="`background: linear-gradient(135deg, ${current.color}dd 0%, #000000cc 100%)`"></div>
      <!-- 裝飾幾何 -->
      <div class="geo geo1"></div>
      <div class="geo geo2"></div>
      <svg class="x-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="10" x2="90" y2="90" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
        <line x1="90" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
      </svg>
    </div>

    <!-- 主內容 -->
    <div class="hero-content">
      <div class="char-number">0{{ idx + 1 }} / 0{{ chars.length }}</div>
      <h1 class="char-name">{{ current.name }}</h1>
      <p class="char-sub">{{ current.sub }}</p>
      <div class="divider-line"></div>
      <p class="char-bio">{{ current.bio }}</p>

      <div class="nav-arrows">
        <button class="arrow" @click="prev">←</button>
        <div class="dot-row">
          <span
            v-for="(c, i) in chars" :key="c.id"
            :class="['dot', { active: i === idx }]"
            @click="goTo(i)"
          ></span>
        </div>
        <button class="arrow" @click="next">→</button>
      </div>
    </div>

    <!-- 側邊縮圖列 -->
    <div class="thumb-bar">
      <div
        v-for="(c, i) in chars" :key="c.id"
        :class="['thumb', { active: i === idx }]"
        :style="`background: ${c.color}`"
        @click="goTo(i)"
      >
        <span class="thumb-initial">{{ c.name[0] }}</span>
        <span class="thumb-name">{{ c.name.split(' ')[0] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-hero {
  min-height: 100vh;
  background: #050510;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

.back-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 50;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.2);
  color: #aaa;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.back-btn:hover { color: #fff; }

.label-top {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 50;
  font-size: 10px;
  letter-spacing: 3px;
  color: rgba(255,255,255,0.3);
}

/* 背景 */
.hero-bg {
  position: absolute;
  inset: 0;
  background: #05050f;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  transition: background 0.6s ease;
}
.geo {
  position: absolute;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 50%;
}
.geo1 { width: 600px; height: 600px; top: -200px; right: -100px; }
.geo2 { width: 400px; height: 400px; bottom: -100px; left: -100px; }
.x-mark {
  position: absolute;
  right: 5%;
  top: 10%;
  width: 300px;
  height: 300px;
  opacity: 0.5;
}

/* 主內容 */
.hero-content {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 40px 120px;
  max-width: 600px;
}

.char-number {
  font-size: 11px;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.35);
  margin-bottom: 16px;
}

.char-name {
  font-size: clamp(32px, 6vw, 56px);
  font-family: Georgia, serif;
  font-weight: 400;
  color: #ffffff;
  letter-spacing: 4px;
  margin: 0 0 8px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.8);
  transition: all 0.4s;
}

.char-sub {
  font-size: 11px;
  letter-spacing: 3px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 20px;
  text-transform: uppercase;
}

.divider-line {
  width: 60px;
  height: 1px;
  background: rgba(255,255,255,0.3);
  margin-bottom: 20px;
}

.char-bio {
  font-size: 13px;
  line-height: 2;
  color: rgba(255,255,255,0.65);
  max-width: 480px;
}

/* 導航 */
.nav-arrows {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}
.arrow {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}
.arrow:hover { background: rgba(255,255,255,0.2); }

.dot-row { display: flex; gap: 8px; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.3s;
}
.dot.active { background: #fff; transform: scale(1.3); }

/* 側邊縮圖 */
.thumb-bar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 70px;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.thumb {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.3s;
  border-left: 2px solid transparent;
  gap: 4px;
}
.thumb:hover, .thumb.active {
  opacity: 1;
  border-left-color: rgba(255,255,255,0.6);
}
.thumb-initial {
  font-size: 20px;
  font-family: Georgia, serif;
  color: rgba(255,255,255,0.8);
}
.thumb-name {
  font-size: 8px;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.5);
  writing-mode: vertical-rl;
  text-transform: uppercase;
}

@media (max-width: 600px) {
  .thumb-bar { display: none; }
  .hero-content { padding: 80px 20px 100px; }
}
</style>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'patientsX/xBeliefs')
  script.setAttribute('data-repo-id', 'R_kgDOQ18_Ww')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', 'DIC_kwDOQ18_W84C0t5x')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-theme', 'dark_high_contrast')
  script.setAttribute('data-lang', 'zh-TW')
  script.crossOrigin = 'anonymous'
  script.async = true
  document.getElementById('giscus-container').appendChild(script)
})
</script>

<template>
  <div class="home">
    <!-- 背景：霧氣粒子 -->
    <div class="fog fog1"></div>
    <div class="fog fog2"></div>

    <!-- 手電筒光束 -->
    <div class="beam beam-left"></div>
    <div class="beam beam-right"></div>

    <!-- 人影剪影 -->
    <div class="silhouettes">
      <svg class="figure figure-left" viewBox="0 0 60 160" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="18" rx="12" ry="14" fill="#0a0a1a"/>
        <rect x="18" y="30" width="24" height="60" rx="4" fill="#0a0a1a"/>
        <rect x="10" y="35" width="10" height="45" rx="3" fill="#0a0a1a"/>
        <rect x="40" y="35" width="10" height="45" rx="3" fill="#0a0a1a" transform="rotate(15 45 60)"/>
        <rect x="15" y="88" width="12" height="55" rx="4" fill="#0a0a1a"/>
        <rect x="33" y="88" width="12" height="55" rx="4" fill="#0a0a1a"/>
      </svg>
      <svg class="figure figure-right" viewBox="0 0 60 160" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="18" rx="11" ry="13" fill="#0a0a1a"/>
        <rect x="18" y="30" width="22" height="58" rx="4" fill="#0a0a1a"/>
        <rect x="8" y="32" width="12" height="42" rx="3" fill="#0a0a1a" transform="rotate(-10 14 53)"/>
        <rect x="40" y="35" width="10" height="44" rx="3" fill="#0a0a1a"/>
        <rect x="15" y="86" width="11" height="56" rx="4" fill="#0a0a1a"/>
        <rect x="32" y="86" width="11" height="56" rx="4" fill="#0a0a1a"/>
      </svg>
    </div>

    <!-- 地板陰影 -->
    <div class="floor-shadow"></div>

    <!-- 主要文字內容 -->
    <div class="content">
      <div class="x-logo">
        <span class="x-letter">X</span>
      </div>
      <h1 class="title">THE X-FILES</h1>
      <p class="tagline blink">THE TRUTH IS OUT THERE</p>
      <p class="subtitle">— FANS CLUB —</p>

      <div class="nav-links">
        <button class="enter-btn" @click="router.push('/profiles')">
          [ ENTER THE ARCHIVE ]
        </button>
      </div>

      <p class="visitor-counter">
        You are visitor
        <img
          src="https://count.getloli.com/get/@xpatientsx-xbeliefs?theme=3d-num"
          alt="counter"
          class="counter-img"
        />
      </p>
    </div>

    <!-- 掃描線效果 -->
    <div class="scanlines"></div>

    <!-- 留言板 -->
    <div class="giscus-wrap">
      <p class="giscus-label">[ 通訊加密區 ]</p>
      <div id="giscus-container"></div>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: radial-gradient(ellipse at 30% 60%, #0d1a3a 0%, #050510 50%, #000000 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === 霧氣 === */
.fog {
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at center, rgba(30, 60, 120, 0.15) 0%, transparent 70%);
  animation: drift 18s ease-in-out infinite alternate;
  pointer-events: none;
}
.fog1 { top: -30%; left: -50%; animation-delay: 0s; }
.fog2 { top: 20%; left: -20%; animation-delay: -9s; opacity: 0.6; }

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(8%, 5%) scale(1.1); }
}

/* === 手電筒光束 === */
.beam {
  position: absolute;
  bottom: 28%;
  width: 0;
  height: 0;
  pointer-events: none;
  filter: blur(2px);
}

.beam-left {
  left: calc(50% - 180px);
  border-left: 22px solid transparent;
  border-right: 22px solid transparent;
  border-bottom: 340px solid rgba(150, 190, 255, 0.09);
  transform: rotate(-18deg);
  transform-origin: bottom center;
  animation: flicker-left 6s ease-in-out infinite alternate;
}

.beam-right {
  right: calc(50% - 180px);
  border-left: 22px solid transparent;
  border-right: 22px solid transparent;
  border-bottom: 340px solid rgba(150, 190, 255, 0.07);
  transform: rotate(18deg);
  transform-origin: bottom center;
  animation: flicker-right 7s ease-in-out infinite alternate;
}

@keyframes flicker-left {
  0%   { opacity: 0.7; transform: rotate(-18deg); }
  50%  { opacity: 1;   transform: rotate(-16deg); }
  100% { opacity: 0.6; transform: rotate(-20deg); }
}
@keyframes flicker-right {
  0%   { opacity: 0.5; transform: rotate(18deg); }
  50%  { opacity: 0.9; transform: rotate(20deg); }
  100% { opacity: 0.6; transform: rotate(17deg); }
}

/* === 人影剪影 === */
.silhouettes {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 60px;
  align-items: flex-end;
  pointer-events: none;
}

.figure {
  width: 55px;
  height: 160px;
  opacity: 0.75;
  filter: drop-shadow(0 0 18px rgba(80, 130, 255, 0.5));
}

.figure-left  { transform: scaleX(-1); }

/* === 地板陰影 === */
.floor-shadow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
  pointer-events: none;
}

/* === 主內容 === */
.content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: #ffffff;
  padding: 20px;
  margin-bottom: 120px;
}

.x-logo {
  margin-bottom: 8px;
}

.x-letter {
  font-size: 96px;
  font-weight: 900;
  font-family: 'Georgia', serif;
  color: transparent;
  -webkit-text-stroke: 2px rgba(100, 160, 255, 0.8);
  text-shadow:
    0 0 30px rgba(80, 140, 255, 0.6),
    0 0 80px rgba(50, 100, 220, 0.3);
  letter-spacing: -4px;
  display: inline-block;
  animation: pulse-x 4s ease-in-out infinite;
}

@keyframes pulse-x {
  0%, 100% { text-shadow: 0 0 30px rgba(80,140,255,0.6), 0 0 80px rgba(50,100,220,0.3); }
  50%       { text-shadow: 0 0 50px rgba(80,160,255,0.9), 0 0 120px rgba(50,120,255,0.5); }
}

.title {
  font-size: 32px;
  font-family: 'Courier New', monospace;
  letter-spacing: 12px;
  color: #c8d8ff;
  margin: 0 0 12px;
  text-shadow: 0 0 20px rgba(100, 160, 255, 0.4);
  font-weight: 400;
}

.tagline {
  font-size: 13px;
  font-family: 'Courier New', monospace;
  letter-spacing: 5px;
  color: #7090cc;
  margin: 0 0 6px;
}

.blink {
  animation: blinker 2.5s step-end infinite;
}
@keyframes blinker {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}

.subtitle {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  letter-spacing: 6px;
  color: #445580;
  margin: 0 0 40px;
}

.enter-btn {
  background: transparent;
  color: #7aadff;
  border: 1px solid #3a5aaa;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  letter-spacing: 3px;
  padding: 12px 28px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-block;
}

.enter-btn:hover {
  background: rgba(60, 100, 200, 0.2);
  border-color: #7aadff;
  color: #ffffff;
  box-shadow: 0 0 20px rgba(80, 140, 255, 0.3);
}

.visitor-counter {
  margin-top: 30px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: #445580;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.counter-img {
  height: 22px;
  vertical-align: middle;
}

/* === 掃描線 === */
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.08) 3px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 5;
}

/* === 留言板 === */
.giscus-wrap {
  position: relative;
  z-index: 10;
  max-width: 720px;
  margin: 0 auto 48px;
  padding: 0 16px;
}

.giscus-label {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  letter-spacing: 4px;
  color: #445580;
  margin-bottom: 12px;
  text-align: left;
}

/* === RWD === */
@media (max-width: 480px) {
  .x-letter { font-size: 72px; }
  .title { font-size: 22px; letter-spacing: 8px; }
  .tagline { letter-spacing: 3px; }
  .figure { width: 42px; height: 120px; }
  .silhouettes { gap: 30px; }
}
</style>

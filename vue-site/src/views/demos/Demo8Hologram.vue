<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const cards = [
  { id: 'mulder',   name: 'FOX MULDER',    code: 'AGENT-X1013',  clearance: 'LEVEL 5', status: 'ACTIVE',      color: '#4488ff', glow: 'rgba(68,136,255,0.6)',  detail: '英國牛津大學．心理學博士', tag: 'X-FILE INVESTIGATOR' },
  { id: 'scully',   name: 'DANA SCULLY',   code: 'AGENT-SC0823', clearance: 'LEVEL 5', status: 'ACTIVE',      color: '#ff4488', glow: 'rgba(255,68,136,0.6)',  detail: 'M.D. 量子力學實驗組', tag: 'FORENSIC SPECIALIST' },
  { id: 'smoking',  name: 'C.G.B. SPENDER',code: 'IDENT-UNKNOWN',clearance: 'LEVEL ∞', status: '[ REDACTED ]',color: '#ff8844', glow: 'rgba(255,136,68,0.6)',  detail: '資料已遭銷毀 ██████', tag: 'SHADOW OPERATIVE' },
  { id: 'krycek',   name: 'ALEX KRYCEK',   code: 'DOUBLE-AK1994',clearance: 'LEVEL 3', status: 'COMPROMISED', color: '#aa44ff', glow: 'rgba(170,68,255,0.6)',  detail: '前 FBI 探員 / 雙重間諜', tag: 'DOUBLE AGENT' },
]

const cardRefs = ref([])
const rotations = ref(cards.map(() => ({ x: 0, y: 0, shine: { x: 50, y: 50 } })))

function onMouseMove(e, idx) {
  const el = cardRefs.value[idx]
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = (e.clientX - cx) / (rect.width / 2)
  const dy = (e.clientY - cy) / (rect.height / 2)
  rotations.value[idx] = {
    x: -dy * 18,
    y: dx * 18,
    shine: { x: 50 + dx * 30, y: 50 + dy * 30 }
  }
}

function onMouseLeave(idx) {
  rotations.value[idx] = { x: 0, y: 0, shine: { x: 50, y: 50 } }
}

function cardStyle(idx) {
  const r = rotations.value[idx]
  return {
    transform: `perspective(800px) rotateX(${r.x}deg) rotateY(${r.y}deg)`,
    transition: rotations.value[idx].x === 0 ? 'transform 0.6s ease' : 'transform 0.1s ease',
  }
}

function shineStyle(idx) {
  const r = rotations.value[idx]
  return {
    background: `radial-gradient(circle at ${r.shine.x}% ${r.shine.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
  }
}
</script>

<template>
  <div class="demo-holo">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="page-label">STYLE 08 — HOLOGRAPHIC CARDS / 移動滑鼠感受全息效果</div>

    <div class="cards-grid">
      <div
        v-for="(c, i) in cards" :key="c.id"
        class="holo-wrap"
        @mousemove="onMouseMove($event, i)"
        @mouseleave="onMouseLeave(i)"
      >
        <div
          class="holo-card"
          :ref="el => cardRefs[i] = el"
          :style="[cardStyle(i), { '--gc': c.glow, '--cc': c.color }]"
        >
          <!-- 全息光澤 -->
          <div class="shine" :style="shineStyle(i)"></div>
          <!-- 彩虹條紋 -->
          <div class="rainbow"></div>

          <!-- 掃描線 -->
          <div class="scan-lines"></div>

          <!-- 角落裝飾 -->
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>

          <!-- 頂部條 -->
          <div class="card-top-bar">
            <span class="bar-label">FEDERAL BUREAU OF INVESTIGATION</span>
            <span class="bar-x">X</span>
          </div>

          <!-- 頭像區域 -->
          <div class="avatar-zone">
            <div class="avatar-ring">
              <div class="avatar-initial">{{ c.name[0] }}</div>
            </div>
            <div class="signal-bars">
              <div v-for="n in 4" :key="n" class="bar" :style="`height:${n*5+4}px; opacity:${n<=3?1:0.2}`"></div>
            </div>
          </div>

          <!-- 身份資訊 -->
          <div class="id-block">
            <div class="agent-tag">{{ c.tag }}</div>
            <h3 class="agent-name">{{ c.name }}</h3>
            <div class="agent-detail">{{ c.detail }}</div>
          </div>

          <!-- 資料列 -->
          <div class="data-rows">
            <div class="data-row">
              <span class="dr-key">AGENT CODE</span>
              <span class="dr-val">{{ c.code }}</span>
            </div>
            <div class="data-row">
              <span class="dr-key">CLEARANCE</span>
              <span class="dr-val" :style="`color: ${c.color}`">{{ c.clearance }}</span>
            </div>
            <div class="data-row">
              <span class="dr-key">STATUS</span>
              <span class="dr-val status-val">{{ c.status }}</span>
            </div>
          </div>

          <!-- 底部條碼區 -->
          <div class="barcode-row">
            <div class="barcode">
              <div v-for="n in 28" :key="n" class="bc-bar" :style="`height: ${8 + (n%3)*6}px; opacity: ${0.3 + (n%5)*0.12}`"></div>
            </div>
            <div class="chip-icon">
              <div v-for="r in 3" :key="r" class="chip-row">
                <div v-for="c in 3" :key="c" class="chip-cell"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="hint-text">在卡片上移動滑鼠以啟動全息投影</p>
  </div>
</template>

<style scoped>
.demo-holo {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 30%, #060d1f 0%, #020408 100%);
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 16px 40px;
  position: relative;
}

.back-btn {
  position: fixed;
  top: 12px; left: 12px;
  z-index: 100;
  background: rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.1);
  color: #556;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.back-btn:hover { color: #fff; }

.page-label {
  position: fixed;
  top: 14px; right: 14px;
  font-size: 9px;
  letter-spacing: 2px;
  color: #223;
  z-index: 100;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
  width: 100%;
  max-width: 1100px;
  margin-top: 20px;
}

.holo-wrap {
  perspective: 800px;
  cursor: pointer;
}

/* ── 全息卡片主體 ── */
.holo-card {
  position: relative;
  background: linear-gradient(135deg, #0a0f1e 0%, #060b18 50%, #0d1428 100%);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04),
    0 8px 32px rgba(0,0,0,0.8),
    0 0 40px var(--gc, rgba(68,136,255,0.3));
  will-change: transform;
  transform-style: preserve-3d;
}
.holo-card:hover {
  border-color: rgba(255,255,255,0.18);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.1),
    0 12px 48px rgba(0,0,0,0.9),
    0 0 60px var(--gc, rgba(68,136,255,0.5));
}

/* 光澤層 */
.shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  border-radius: 12px;
  transition: background 0.1s;
}

/* 彩虹條紋 */
.rainbow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255,100,100,0.03) 35%,
    rgba(255,200,50,0.03) 40%,
    rgba(50,255,100,0.03) 45%,
    rgba(50,150,255,0.03) 50%,
    rgba(180,50,255,0.03) 55%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 4;
  border-radius: 12px;
}

/* 掃描線 */
.scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(255,255,255,0.015) 2px,
    rgba(255,255,255,0.015) 3px
  );
  pointer-events: none;
  z-index: 3;
  border-radius: 12px;
}

/* 角落裝飾 */
.corner {
  position: absolute;
  width: 12px; height: 12px;
  border-color: var(--cc, #4488ff);
  border-style: solid;
  opacity: 0.5;
  z-index: 6;
}
.tl { top: 8px; left: 8px; border-width: 1px 0 0 1px; }
.tr { top: 8px; right: 8px; border-width: 1px 1px 0 0; }
.bl { bottom: 8px; left: 8px; border-width: 0 0 1px 1px; }
.br { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }

/* 頂部條 */
.card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: relative;
  z-index: 6;
}
.bar-label {
  font-size: 7px;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.2);
}
.bar-x {
  font-size: 18px;
  font-family: Georgia, serif;
  color: var(--cc);
  font-weight: bold;
  text-shadow: 0 0 10px var(--gc);
  opacity: 0.8;
}

/* 頭像區 */
.avatar-zone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 10px;
  position: relative;
  z-index: 6;
}
.avatar-ring {
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 1.5px solid var(--cc);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px var(--gc), inset 0 0 8px rgba(0,0,0,0.5);
  flex-shrink: 0;
}
.avatar-initial {
  font-size: 22px;
  font-family: Georgia, serif;
  color: var(--cc);
  text-shadow: 0 0 8px var(--gc);
}
.signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
}
.signal-bars .bar {
  width: 4px;
  background: var(--cc);
  border-radius: 1px;
  box-shadow: 0 0 4px var(--gc);
}

/* 身份資訊 */
.id-block {
  padding: 0 16px 10px;
  position: relative;
  z-index: 6;
}
.agent-tag {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--cc);
  opacity: 0.7;
  margin-bottom: 4px;
}
.agent-name {
  font-size: 15px;
  color: #fff;
  letter-spacing: 2px;
  margin: 0 0 4px;
  font-weight: normal;
  text-shadow: 0 0 8px rgba(255,255,255,0.3);
}
.agent-detail {
  font-size: 9px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 1px;
}

/* 資料列 */
.data-rows {
  padding: 8px 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: relative;
  z-index: 6;
}
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.dr-key {
  font-size: 8px;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.2);
}
.dr-val {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: rgba(255,255,255,0.7);
}
.status-val {
  color: rgba(80,255,120,0.8) !important;
}

/* 條碼區 */
.barcode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 14px;
  position: relative;
  z-index: 6;
}
.barcode {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
}
.bc-bar {
  width: 2px;
  background: rgba(255,255,255,0.3);
  border-radius: 1px;
}
.chip-icon {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chip-row {
  display: flex;
  gap: 2px;
}
.chip-cell {
  width: 5px;
  height: 5px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.03);
}

.hint-text {
  margin-top: 32px;
  font-size: 10px;
  letter-spacing: 3px;
  color: rgba(255,255,255,0.1);
}

@media (max-width: 600px) {
  .cards-grid { grid-template-columns: 1fr; max-width: 320px; }
}
</style>

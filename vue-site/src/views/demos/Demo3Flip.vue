<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const chars = [
  { id: 'mulder', name: 'Fox Mulder', role: 'FBI Special Agent', actor: 'David Duchovny', color: '#1a3a8a', bio: '一心追求X檔案真相的探員，相信外星人入侵地球。妹妹離奇失蹤是他最深的執念。', stats: { IQ: 85, DANGER: 60, TRUST: 40, FAITH: 95 } },
  { id: 'scully', name: 'Dana Scully', role: 'FBI Agent / MD', actor: 'Gillian Anderson', color: '#7a1a2a', bio: '科學理性的醫生探員，穆德最堅定的夥伴。理性與信仰之間永恆的掙扎。', stats: { IQ: 95, DANGER: 65, TRUST: 80, FAITH: 55 } },
  { id: 'skinner', name: 'Walter Skinner', role: 'Assistant Director', actor: 'Mitch Pileggi', color: '#1a4a2a', bio: '外表嚴肅的FBI助理局長，暗中保護穆德與史卡利，游走於正義與陰謀之間。', stats: { IQ: 78, DANGER: 70, TRUST: 65, FAITH: 50 } },
  { id: 'smoking', name: 'Smoking Man', role: 'Shadow Government', actor: 'William B. Davis', color: '#3a1a0a', bio: '神秘的幕後黑手，掌控政府機密陰謀。永遠手持一根菸，目光深不可測。', stats: { IQ: 99, DANGER: 98, TRUST: 5, FAITH: 10 } },
]

const flipped = ref({})
function toggle(id) {
  flipped.value = { ...flipped.value, [id]: !flipped.value[id] }
}
</script>

<template>
  <div class="demo-flip">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="page-header">
      <div class="label-top">STYLE 03 — CARD FLIP</div>
      <p class="hint">點擊卡片翻轉查看詳細資料</p>
    </div>

    <div class="card-grid">
      <div
        v-for="c in chars" :key="c.id"
        :class="['flip-card', { flipped: flipped[c.id] }]"
        @click="toggle(c.id)"
      >
        <div class="flip-inner">

          <!-- 正面 -->
          <div class="face front" :style="`--card-color: ${c.color}`">
            <div class="front-bg"></div>
            <div class="front-content">
              <div class="card-initial">{{ c.name[0] }}</div>
              <h3 class="card-name">{{ c.name }}</h3>
              <p class="card-role">{{ c.role }}</p>
              <div class="flip-hint">TAP TO OPEN FILE</div>
            </div>
            <div class="corner-mark top-left"></div>
            <div class="corner-mark top-right"></div>
            <div class="corner-mark bottom-left"></div>
            <div class="corner-mark bottom-right"></div>
          </div>

          <!-- 背面 -->
          <div class="face back" :style="`--card-color: ${c.color}`">
            <div class="back-header">
              <span class="back-label">SUBJECT FILE</span>
              <span class="back-id">{{ c.id.toUpperCase() }}</span>
            </div>
            <p class="back-bio">{{ c.bio }}</p>
            <div class="stats">
              <div v-for="(val, key) in c.stats" :key="key" class="stat-row">
                <span class="stat-key">{{ key }}</span>
                <div class="stat-bar">
                  <div class="stat-fill" :style="`width:${val}%; background: ${c.color === '#3a1a0a' ? '#cc3300' : '#4488ff'}`"></div>
                </div>
                <span class="stat-val">{{ val }}</span>
              </div>
            </div>
            <p class="back-actor">ACTOR: {{ c.actor }}</p>
            <div class="flip-hint">TAP TO CLOSE</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-flip {
  min-height: 100vh;
  background: #0a0a18;
  padding: 16px;
  font-family: 'Courier New', monospace;
}

.back-btn {
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: #888;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  margin-bottom: 8px;
}
.back-btn:hover { color: #fff; }

.page-header { margin-bottom: 24px; }
.label-top { font-size: 10px; letter-spacing: 3px; color: #555; }
.hint { font-size: 11px; color: #445; margin-top: 4px; letter-spacing: 1px; }

/* 卡片格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
}

.flip-card {
  height: 340px;
  perspective: 1000px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
}
.flip-card.flipped .flip-inner {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}

/* 正面 */
.front {
  background: linear-gradient(135deg, var(--card-color) 0%, #050510 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.front-bg {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px);
}

.front-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
}

.card-initial {
  font-size: 72px;
  font-family: Georgia, serif;
  color: rgba(255,255,255,0.15);
  line-height: 1;
  margin-bottom: 12px;
}
.card-name {
  font-size: 16px;
  color: #fff;
  letter-spacing: 2px;
  margin: 0 0 6px;
  font-weight: normal;
}
.card-role {
  font-size: 10px;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.45);
  margin: 0;
}

/* 四角裝飾 */
.corner-mark {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(255,255,255,0.2);
  border-style: solid;
}
.top-left     { top: 8px;    left: 8px;    border-width: 1px 0 0 1px; }
.top-right    { top: 8px;    right: 8px;   border-width: 1px 1px 0 0; }
.bottom-left  { bottom: 8px; left: 8px;    border-width: 0 0 1px 1px; }
.bottom-right { bottom: 8px; right: 8px;   border-width: 0 1px 1px 0; }

/* 背面 */
.back {
  background: #0d0d1a;
  transform: rotateY(180deg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 3px solid var(--card-color);
}

.back-header {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 2px;
  color: #556;
}

.back-bio {
  font-size: 11px;
  line-height: 1.7;
  color: #aab;
  margin: 0;
  flex: 1;
}

.stats { display: flex; flex-direction: column; gap: 5px; }
.stat-row { display: flex; align-items: center; gap: 6px; }
.stat-key { font-size: 9px; letter-spacing: 1px; color: #556; width: 44px; }
.stat-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); }
.stat-fill { height: 100%; transition: width 0.8s; }
.stat-val { font-size: 9px; color: #778; width: 24px; text-align: right; }

.back-actor { font-size: 9px; letter-spacing: 2px; color: #445; margin: 0; }

.flip-hint {
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.15);
  text-align: center;
  margin-top: auto;
}
</style>

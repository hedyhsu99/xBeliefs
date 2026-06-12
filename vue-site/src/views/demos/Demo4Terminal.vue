<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const chars = [
  { id: 'mulder',  name: 'FOX WILLIAM MULDER',    dob: '1960/10/11', status: 'MISSING',   clearance: 'LEVEL 5', hair: 'BROWN', bio: '福克斯‧穆德，英國牛津大學畢業，主修心理學。多年前在FBI服務時偶然發現了X檔案，一心追求事實的真相，認為妹妹珊曼莎的離奇失蹤與外星人入侵有關。最後穆德也離奇的消失在人群中…' },
  { id: 'scully',  name: 'DANA CATHERINE SCULLY', dob: '1964/02/23', status: 'ACTIVE',    clearance: 'LEVEL 4', hair: 'RED',   bio: '黛娜．史卡利，美國馬里蘭大學畢業，主修物理，選修醫學系。最初監視穆德，後成為他共同進退的好夥伴。竟奇蹟般的懷孕了。' },
  { id: 'skinner', name: 'WALTER S. SKINNER',      dob: '——/——/——',   status: 'ACTIVE',    clearance: 'LEVEL 6', hair: 'BLACK', bio: 'FBI助理局長，外表嚴肅，內心正義感強烈，曾多次在關鍵時刻暗中保護穆德與史卡利。游走於正義與陰謀之間。' },
  { id: 'smoking', name: 'C.G.B. SPENDER',         dob: '——/——/——',   status: 'CLASSIFIED', clearance: 'UNKNOWN', hair: 'GREY',  bio: '神秘的抽菸男，幕後操控政府機密陰謀的核心人物。永遠手持一根菸，目光深不可測。資料已遭政府銷毀。' },
]

const selectedId = ref('mulder')
const displayed = ref('')
const isTyping = ref(false)
let typingTimer = null

const current = ref(chars[0])
const lines = ref([])
const inputLine = ref('')
let lineTimer = null

function typeText(text, onDone) {
  displayed.value = ''
  isTyping.value = true
  let i = 0
  clearInterval(typingTimer)
  typingTimer = setInterval(() => {
    displayed.value += text[i]
    i++
    if (i >= text.length) {
      clearInterval(typingTimer)
      isTyping.value = false
      if (onDone) onDone()
    }
  }, 18)
}

function selectChar(c) {
  selectedId.value = c.id
  current.value = c
  displayed.value = ''
  lines.value = []
  runBootSequence(c)
}

function runBootSequence(c) {
  const seq = [
    { text: `> ACCESSING FBI DATABASE...`, delay: 0 },
    { text: `> AUTHENTICATION: ████████ OK`, delay: 500 },
    { text: `> LOCATING FILE: ${c.id.toUpperCase()}`, delay: 900 },
    { text: `> DECRYPTING...`, delay: 1300 },
    { text: `> STATUS: ${c.status}`, delay: 1800, class: c.status === 'MISSING' ? 'warn' : c.status === 'CLASSIFIED' ? 'danger' : 'ok' },
    { text: `> CLEARANCE: ${c.clearance}`, delay: 2100 },
    { text: `> SUBJECT: ${c.name}`, delay: 2400, class: 'highlight' },
    { text: `> DOB: ${c.dob}   HAIR: ${c.hair}`, delay: 2700 },
    { text: `──────────────────────────────────`, delay: 3000 },
  ]
  lines.value = []
  seq.forEach(s => {
    setTimeout(() => {
      lines.value.push({ text: s.text, cls: s.class || '' })
    }, s.delay)
  })
  setTimeout(() => {
    typeText(c.bio)
  }, 3300)
}

// 閃爍游標
const cursor = ref(true)
let cursorTimer = null

onMounted(() => {
  cursorTimer = setInterval(() => { cursor.value = !cursor.value }, 530)
  runBootSequence(chars[0])
})
onUnmounted(() => {
  clearInterval(cursorTimer)
  clearInterval(typingTimer)
})
</script>

<template>
  <div class="demo-terminal">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>

    <!-- 終端機視窗 -->
    <div class="terminal-window">
      <!-- 視窗頂欄 -->
      <div class="win-bar">
        <div class="win-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="win-title">FBI DATABASE — X-FILES DIVISION — TERMINAL v2.4</span>
      </div>

      <!-- 主體 -->
      <div class="terminal-body">
        <!-- 左側：選擇面板 -->
        <div class="sidebar">
          <div class="sidebar-label">> SELECT SUBJECT</div>
          <button
            v-for="c in chars" :key="c.id"
            :class="['subject-btn', { active: selectedId === c.id }]"
            @click="selectChar(c)"
          >
            <span class="btn-arrow">{{ selectedId === c.id ? '▶' : ' ' }}</span>
            {{ c.name.split(' ').slice(-1)[0] }}
          </button>
          <div class="sidebar-divider"></div>
          <div class="sidebar-note">STYLE 04<br>TERMINAL</div>
        </div>

        <!-- 右側：輸出區 -->
        <div class="output">
          <div class="scanline"></div>

          <!-- boot lines -->
          <div v-for="(l, i) in lines" :key="i" :class="['line', l.cls]">{{ l.text }}</div>

          <!-- 打字傳記 -->
          <div v-if="displayed" class="line bio-line">
            {{ displayed }}<span v-if="isTyping" class="caret">█</span>
          </div>

          <!-- 待機游標 -->
          <div v-if="!isTyping && displayed" class="line prompt">
            > _<span :style="cursor ? 'opacity:1' : 'opacity:0'">█</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-terminal {
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  font-family: 'Courier New', monospace;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: 1px solid #333;
  color: #555;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  margin-bottom: 12px;
}
.back-btn:hover { color: #0f0; }

/* 終端機視窗 */
.terminal-window {
  width: 100%;
  max-width: 860px;
  border: 1px solid #1a3a1a;
  box-shadow: 0 0 40px rgba(0, 255, 0, 0.08), inset 0 0 40px rgba(0, 0, 0, 0.8);
}

.win-bar {
  background: #0a1a0a;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #1a3a1a;
}
.win-dots { display: flex; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.red    { background: #3a0a0a; }
.dot.yellow { background: #3a3a0a; }
.dot.green  { background: #0a3a0a; }
.win-title {
  font-size: 10px;
  letter-spacing: 2px;
  color: #2a5a2a;
  flex: 1;
  text-align: center;
}

.terminal-body {
  display: flex;
  min-height: 460px;
}

/* 側邊 */
.sidebar {
  width: 140px;
  background: #050e05;
  border-right: 1px solid #0f2a0f;
  padding: 12px 8px;
  flex-shrink: 0;
}
.sidebar-label {
  font-size: 9px;
  letter-spacing: 1px;
  color: #2a5a2a;
  margin-bottom: 10px;
}
.subject-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #3a7a3a;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  text-align: left;
  padding: 5px 4px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.subject-btn:hover { color: #7aff7a; }
.subject-btn.active { color: #00ff41; font-weight: bold; }
.btn-arrow { display: inline-block; width: 12px; }
.sidebar-divider { border-top: 1px solid #0f2a0f; margin: 12px 0; }
.sidebar-note {
  font-size: 8px;
  letter-spacing: 1px;
  color: #1a3a1a;
  line-height: 1.6;
}

/* 輸出區 */
.output {
  flex: 1;
  background: #050e05;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
}

/* CRT 掃描線 */
.scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 3px
  );
  pointer-events: none;
  z-index: 5;
}

.line {
  font-size: 12px;
  line-height: 1.9;
  color: #3a8a3a;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}
.line.ok       { color: #00cc44; }
.line.warn     { color: #ccaa00; }
.line.danger   { color: #cc3300; }
.line.highlight{ color: #00ff41; font-weight: bold; }
.line.bio-line { color: #5aaa5a; line-height: 2; margin-top: 8px; }
.line.prompt   { color: #2a6a2a; margin-top: 8px; }

.caret {
  animation: blink 0.8s step-end infinite;
  color: #00ff41;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@media (max-width: 600px) {
  .sidebar { width: 90px; }
  .subject-btn { font-size: 9px; }
  .win-title { font-size: 8px; letter-spacing: 1px; }
}
</style>

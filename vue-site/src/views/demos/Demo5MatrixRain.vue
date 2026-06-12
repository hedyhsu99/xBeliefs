<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const canvasRef = ref(null)
const infoRef = ref(null)
const selected = ref(null)
let animId = null

const chars = [
  { id: 'mulder',  label: 'MULDER',  name: 'Fox William Mulder',   bio: '英國牛津大學畢業，主修心理學。一心追求X檔案背後的真相。',   color: '#4488ff' },
  { id: 'scully',  label: 'SCULLY',  name: 'Dana Catherine Scully', bio: '醫學及科學背景。最初監視穆德，後成為他最信任的夥伴。',      color: '#ff4488' },
  { id: 'smoking', label: 'SMOKING', name: 'C.G.B. Spender',        bio: '神秘的幕後黑手。掌控政府機密陰謀。資料已遭政府銷毀。',      color: '#ff8844' },
]

const hotspots = []

onMounted(() => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    initColumns()
  }

  const FONT_SIZE = 14
  let columns = []

  const rainChars = 'XFILESABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコ'.split('')

  function initColumns() {
    const cols = Math.floor(canvas.width / FONT_SIZE)
    columns = Array.from({ length: cols }, () => ({
      y: Math.random() * -canvas.height,
      speed: 1 + Math.random() * 2,
      char: () => rainChars[Math.floor(Math.random() * rainChars.length)],
      bright: Math.random() > 0.97,
    }))
  }

  // 角色名稱熱點
  const charCols = {}
  function placeCharLabels() {
    hotspots.length = 0
    chars.forEach((c, i) => {
      const x = Math.floor((canvas.width / (chars.length + 1)) * (i + 1))
      const y = 80 + i * 60
      hotspots.push({ x, y, char: c })
    })
  }

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = `${FONT_SIZE}px "Courier New", monospace`

    columns.forEach((col, i) => {
      const x = i * FONT_SIZE
      const ch = col.char()

      if (col.bright) {
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 8
        ctx.shadowColor = '#00ff41'
      } else {
        ctx.fillStyle = `rgba(0,${120 + Math.random()*80},${40 + Math.random()*40},0.9)`
        ctx.shadowBlur = 0
      }

      ctx.fillText(ch, x, col.y)
      col.y += col.speed * FONT_SIZE

      if (col.y > canvas.height && Math.random() > 0.975) {
        col.y = 0
        col.bright = Math.random() > 0.97
      }
    })

    ctx.shadowBlur = 0

    // 繪製角色名稱熱點
    hotspots.forEach(h => {
      const isSelected = selected.value?.id === h.char.id
      ctx.font = `bold 15px "Courier New", monospace`
      ctx.shadowBlur = isSelected ? 20 : 10
      ctx.shadowColor = h.char.color
      ctx.fillStyle = isSelected ? '#ffffff' : h.char.color
      ctx.fillText(`[ ${h.char.label} ]`, h.x - 40, h.y)
      ctx.shadowBlur = 0
    })

    animId = requestAnimationFrame(draw)
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const h of hotspots) {
      if (Math.abs(mx - h.x) < 60 && Math.abs(my - h.y) < 16) {
        selected.value = h.char
        return
      }
    }
    selected.value = null
  }

  resize()
  placeCharLabels()
  draw()
  window.addEventListener('resize', () => { resize(); placeCharLabels() })
  canvas.addEventListener('click', onClick)
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})
</script>

<template>
  <div class="demo-matrix">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="label">STYLE 05 — MATRIX RAIN / 點擊角色名稱</div>

    <canvas ref="canvasRef" class="matrix-canvas"></canvas>

    <!-- 角色資訊卡 -->
    <Transition name="fade">
      <div v-if="selected" class="info-card" :style="`border-color: ${selected.color}`">
        <div class="info-id" :style="`color: ${selected.color}`">[ {{ selected.id.toUpperCase() }} ]</div>
        <h2 class="info-name">{{ selected.name }}</h2>
        <p class="info-bio">{{ selected.bio }}</p>
        <button class="close-btn" @click="selected = null">✕ CLOSE</button>
      </div>
    </Transition>

    <p class="hint">點擊畫面中的 [ 名稱 ] 解鎖檔案</p>
  </div>
</template>

<style scoped>
.demo-matrix {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
}

.back-btn {
  position: absolute;
  top: 12px; left: 12px;
  z-index: 20;
  background: rgba(0,0,0,0.7);
  border: 1px solid #1a3a1a;
  color: #3a7a3a;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.back-btn:hover { color: #0f0; }

.label {
  position: absolute;
  top: 14px; right: 14px;
  z-index: 20;
  font-size: 9px;
  letter-spacing: 2px;
  color: #1a4a1a;
}

.matrix-canvas {
  width: 100%;
  flex: 1;
  display: block;
  cursor: crosshair;
}

.info-card {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 440px;
  background: rgba(0,0,0,0.92);
  border: 1px solid;
  padding: 20px 24px;
  z-index: 30;
}
.info-id { font-size: 10px; letter-spacing: 4px; margin-bottom: 8px; }
.info-name { font-size: 16px; color: #fff; letter-spacing: 3px; margin: 0 0 10px; font-weight: normal; }
.info-bio { font-size: 12px; color: #8a8; line-height: 1.8; margin: 0 0 12px; }
.close-btn {
  background: none;
  border: 1px solid #333;
  color: #555;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 3px 10px;
  cursor: pointer;
}
.close-btn:hover { color: #0f0; border-color: #0f0; }

.hint {
  position: absolute;
  bottom: 16px;
  width: 100%;
  text-align: center;
  font-size: 10px;
  letter-spacing: 3px;
  color: #1a4a1a;
  z-index: 20;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>

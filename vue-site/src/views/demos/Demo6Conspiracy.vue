<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const selected = ref(null)

const nodes = ref([
  { id: 'mulder',   label: 'FOX MULDER',    role: 'FBI AGENT',          x: 20,  y: 15,  color: '#4488ff', pinColor: '#ff4444', bio: '英國牛津大學畢業，主修心理學。一心相信X檔案背後的外星陰謀。妹妹珊曼莎是他最深的執念。' },
  { id: 'scully',   label: 'DANA SCULLY',   role: 'FBI AGENT / MD',     x: 65,  y: 12,  color: '#ff6688', pinColor: '#ff4444', bio: '醫學及科學背景的FBI探員。最初監視穆德，後成為他最堅定的夥伴。' },
  { id: 'skinner',  label: 'W. SKINNER',    role: 'ASST. DIRECTOR',     x: 42,  y: 40,  color: '#44cc88', pinColor: '#ffaa00', bio: 'FBI助理局長，游走於正義與陰謀之間，暗中保護穆德與史卡利。' },
  { id: 'smoking',  label: 'SMOKING MAN',   role: '??? AGENCY',         x: 15,  y: 65,  color: '#ff8844', pinColor: '#ff4444', bio: '神秘幕後黑手，掌控政府陰謀，永遠手持一根菸。資料已遭銷毀。' },
  { id: 'krycek',   label: 'ALEX KRYCEK',   role: 'DOUBLE AGENT',       x: 60,  y: 62,  color: '#aa44ff', pinColor: '#ffaa00', bio: '前FBI探員，雙重間諜，身份撲朔迷離，曾多次背叛各方勢力。' },
  { id: 'samantha', label: 'SAMANTHA M.',   role: 'ABDUCTED / MISSING', x: 80,  y: 35,  color: '#ffdd44', pinColor: '#ff4444', bio: '穆德的妹妹，12歲時離奇失蹤。是穆德追查X檔案的最初動機。' },
  { id: 'syndicate',label: 'THE SYNDICATE', role: 'SHADOW GOVERNMENT',  x: 38,  y: 75,  color: '#cc4444', pinColor: '#ff0000', bio: '神秘影子政府組織，與外星人秘密協商地球命運，成員身份皆為機密。' },
])

const strings = [
  { from: 'mulder',    to: 'scully',    label: '搭檔',    color: 'rgba(100,180,255,0.5)' },
  { from: 'mulder',    to: 'samantha',  label: '妹妹',    color: 'rgba(255,220,50,0.5)'  },
  { from: 'mulder',    to: 'skinner',   label: '上司',    color: 'rgba(80,200,140,0.4)'  },
  { from: 'smoking',   to: 'syndicate', label: '成員',    color: 'rgba(255,80,50,0.5)'   },
  { from: 'smoking',   to: 'skinner',   label: '控制?',   color: 'rgba(255,100,50,0.3)'  },
  { from: 'krycek',    to: 'smoking',   label: '合謀',    color: 'rgba(180,80,255,0.4)'  },
  { from: 'krycek',    to: 'mulder',    label: '背叛',    color: 'rgba(180,80,255,0.3)'  },
  { from: 'syndicate', to: 'samantha',  label: '綁架',    color: 'rgba(255,80,50,0.4)'   },
  { from: 'scully',    to: 'skinner',   label: '聯絡',    color: 'rgba(255,100,140,0.3)' },
]

function getNode(id) { return nodes.value.find(n => n.id === id) }

function midStr(a, b) {
  const na = getNode(a), nb = getNode(b)
  return { x: (na.x + nb.x) / 2, y: (na.y + nb.y) / 2 }
}
</script>

<template>
  <div class="demo-conspiracy">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="board-label">STYLE 06 — CONSPIRACY BOARD / 點擊圖釘查看資料</div>

    <!-- 公告板 -->
    <div class="board">
      <!-- 紅線 SVG -->
      <svg class="strings-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          v-for="(s, i) in strings" :key="i"
          :x1="getNode(s.from).x + '%'"
          :y1="getNode(s.from).y + '%'"
          :x2="getNode(s.to).x + '%'"
          :y2="getNode(s.to).y + '%'"
          :stroke="s.color"
          stroke-width="0.3"
        />
      </svg>

      <!-- 關係標籤 -->
      <div
        v-for="(s, i) in strings" :key="`lbl-${i}`"
        class="string-label"
        :style="`left:${midStr(s.from, s.to).x}%; top:${midStr(s.from, s.to).y}%`"
      >{{ s.label }}</div>

      <!-- 圖釘節點 -->
      <div
        v-for="n in nodes" :key="n.id"
        class="pin-node"
        :class="{ active: selected?.id === n.id }"
        :style="`left:${n.x}%; top:${n.y}%; --nc: ${n.color}; --pc: ${n.pinColor}`"
        @click="selected = selected?.id === n.id ? null : n"
      >
        <div class="pin-head" :style="`background: ${n.pinColor}`"></div>
        <div class="pin-card">
          <div class="pin-name">{{ n.label }}</div>
          <div class="pin-role">{{ n.role }}</div>
        </div>
      </div>
    </div>

    <!-- 資訊面板 -->
    <Transition name="slide-up">
      <div v-if="selected" class="detail-panel" :style="`border-top: 3px solid ${selected.color}`">
        <div class="dp-header">
          <span class="dp-label" :style="`color: ${selected.color}`">[ {{ selected.id.toUpperCase() }} ]</span>
          <span class="dp-role">{{ selected.role }}</span>
        </div>
        <h3 class="dp-name">{{ selected.label }}</h3>
        <p class="dp-bio">{{ selected.bio }}</p>
        <button class="dp-close" @click="selected = null">CLOSE FILE ✕</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.demo-conspiracy {
  min-height: 100vh;
  background: #1a1208;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 10px; left: 10px;
  z-index: 50;
  background: rgba(0,0,0,0.5);
  border: 1px solid #4a3a10;
  color: #8a7a40;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.back-btn:hover { color: #ffd; }

.board-label {
  position: absolute;
  top: 12px; right: 12px;
  font-size: 9px; letter-spacing: 2px;
  color: #4a3a10; z-index: 50;
}

/* 公告板 */
.board {
  flex: 1;
  position: relative;
  min-height: 70vh;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(180,140,60,0.06) 39px, rgba(180,140,60,0.06) 40px),
    repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(180,140,60,0.06) 39px, rgba(180,140,60,0.06) 40px),
    radial-gradient(ellipse at 40% 40%, #2a1e08 0%, #120e04 100%);
  border-bottom: 2px solid #3a2a08;
}

.strings-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.string-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 8px;
  letter-spacing: 1px;
  color: rgba(200,160,60,0.5);
  pointer-events: none;
  white-space: nowrap;
  text-shadow: 0 0 4px #000;
}

/* 圖釘節點 */
.pin-node {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  transition: z-index 0s;
}

.pin-head {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin: 0 auto 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.8), 0 0 8px var(--pc);
  transition: transform 0.2s, box-shadow 0.2s;
}
.pin-node:hover .pin-head,
.pin-node.active .pin-head {
  transform: scale(1.3);
  box-shadow: 0 2px 12px rgba(0,0,0,0.9), 0 0 16px var(--pc);
}

.pin-card {
  background: rgba(20,14,4,0.9);
  border: 1px solid var(--nc);
  padding: 4px 8px;
  text-align: center;
  min-width: 80px;
  transition: all 0.2s;
  box-shadow: 0 0 6px rgba(0,0,0,0.8);
}
.pin-node:hover .pin-card,
.pin-node.active .pin-card { box-shadow: 0 0 12px var(--nc); }

.pin-name {
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--nc);
  font-weight: bold;
}
.pin-role {
  font-size: 7px;
  letter-spacing: 1px;
  color: rgba(200,160,60,0.5);
  margin-top: 2px;
}

/* 詳細資訊面板 */
.detail-panel {
  background: #0e0a02;
  padding: 16px 20px;
  z-index: 40;
}
.dp-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.dp-label { font-size: 10px; letter-spacing: 3px; }
.dp-role { font-size: 9px; letter-spacing: 2px; color: #6a5a20; }
.dp-name { font-size: 15px; color: #e8d890; letter-spacing: 3px; margin: 0 0 8px; font-weight: normal; }
.dp-bio { font-size: 12px; color: #8a7a40; line-height: 1.8; margin: 0 0 10px; }
.dp-close {
  background: none; border: 1px solid #3a2a08;
  color: #5a4a18; font-family: 'Courier New', monospace;
  font-size: 10px; letter-spacing: 2px;
  padding: 3px 10px; cursor: pointer;
}
.dp-close:hover { color: #ffd; border-color: #8a7a40; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>

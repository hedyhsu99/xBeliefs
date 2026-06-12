<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const sections = [
  { id: 'intro',   bg: 'radial-gradient(ellipse at 50% 80%, #0a1a3a 0%, #000 100%)', label: '01', title: 'THE TRUTH IS OUT THERE', sub: '真相就在那裡', text: '1993年，Fox Mulder 踏入了FBI的X檔案部門。從此，他的人生再也無法回頭。', symbol: 'X' },
  { id: 'mulder',  bg: 'radial-gradient(ellipse at 20% 50%, #0d2a5a 0%, #020510 100%)', label: '02', title: 'FOX MULDER', sub: 'Special Agent', text: '英國牛津大學心理學畢業。十二歲那年妹妹珊曼莎離奇失蹤，從此成為他畢生追查的執念。', symbol: '?' },
  { id: 'scully',  bg: 'radial-gradient(ellipse at 80% 50%, #3a0a1a 0%, #050205 100%)', label: '03', title: 'DANA SCULLY', sub: 'Special Agent / MD', text: '以科學理性對抗未知。她不相信超自然，直到親身經歷改變了一切。', symbol: '✚' },
  { id: 'enemy',   bg: 'radial-gradient(ellipse at 50% 20%, #2a0808 0%, #050000 100%)', label: '04', title: 'TRUST NO ONE', sub: '不要相信任何人', text: '政府有秘密。有些真相比謊言更危險。X檔案背後，有一雙眼睛始終在監視。', symbol: '👁' },
]

const visible = ref({})
const observer = ref(null)

onMounted(() => {
  observer.value = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.value[e.target.dataset.id] = true
    })
  }, { threshold: 0.3 })

  document.querySelectorAll('.scroll-section').forEach(el => {
    observer.value.observe(el)
  })
})

onUnmounted(() => observer.value?.disconnect())
</script>

<template>
  <div class="demo-scroll">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>

    <div
      v-for="s in sections" :key="s.id"
      class="scroll-section"
      :data-id="s.id"
      :style="`background: ${s.bg}`"
    >
      <!-- 大型背景符號 -->
      <div class="bg-symbol">{{ s.symbol }}</div>

      <!-- 內容 -->
      <div :class="['section-content', { visible: visible[s.id] }]">
        <div class="sec-num">{{ s.label }}</div>
        <h2 class="sec-title">{{ s.title }}</h2>
        <p class="sec-sub">{{ s.sub }}</p>
        <div class="divider"></div>
        <p class="sec-text">{{ s.text }}</p>
      </div>

      <!-- 滾動提示 -->
      <div v-if="s.id !== 'enemy'" class="scroll-hint">▾ SCROLL</div>
    </div>
  </div>
</template>

<style scoped>
.demo-scroll {
  font-family: 'Courier New', monospace;
  position: relative;
}

.back-btn {
  position: fixed;
  top: 12px; left: 12px;
  z-index: 100;
  background: rgba(0,0,0,0.8);
  border: 1px solid rgba(255,255,255,0.15);
  color: #888;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.back-btn:hover { color: #fff; }

.scroll-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* 背景大字符 */
.bg-symbol {
  position: absolute;
  font-size: clamp(200px, 40vw, 360px);
  color: rgba(255,255,255,0.03);
  user-select: none;
  pointer-events: none;
  right: -2%;
  bottom: -5%;
  line-height: 1;
}

/* 內容動畫 */
.section-content {
  position: relative;
  z-index: 1;
  max-width: 520px;
  padding: 40px 24px;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.section-content.visible {
  opacity: 1;
  transform: translateY(0);
}

.sec-num {
  font-size: 10px;
  letter-spacing: 5px;
  color: rgba(255,255,255,0.2);
  margin-bottom: 16px;
}

.sec-title {
  font-size: clamp(22px, 5vw, 40px);
  font-family: Georgia, serif;
  font-weight: 400;
  color: #fff;
  letter-spacing: 6px;
  margin: 0 0 8px;
  text-shadow: 0 0 40px rgba(80,140,255,0.3);
}

.sec-sub {
  font-size: 10px;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.35);
  margin: 0 0 20px;
  text-transform: uppercase;
}

.divider {
  width: 40px;
  height: 1px;
  background: rgba(255,255,255,0.2);
  margin-bottom: 20px;
}

.sec-text {
  font-size: 14px;
  line-height: 2;
  color: rgba(255,255,255,0.55);
}

/* 滾動提示 */
.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.15);
  animation: bob 2s ease-in-out infinite;
}
@keyframes bob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(6px); }
}
</style>

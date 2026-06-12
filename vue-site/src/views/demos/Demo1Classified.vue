<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const active = ref('mulder')
const characters = [
  {
    id: 'mulder',
    name: 'Fox William Mulder',
    birthday: '1960/10/11',
    marriage: 'Single',
    tall: '183cm',
    hair: 'Brown',
    actor: 'David Duchovny',
    clearance: 5,
    status: 'MISSING',
    location: 'CLASSIFIED',
    photo: null,
    bio: '福克斯‧穆德，英國牛津大學畢業，主修心理學。多年前在FBI服務時偶然發現了X檔案，一心追求事實的真相，認為妹妹珊曼莎的離奇失蹤與外星人入侵有關。最後穆德也離奇的消失在人群中…',
  },
  {
    id: 'scully',
    name: 'Dana Catherine Scully',
    birthday: '1964/02/23',
    marriage: 'Single',
    tall: '157cm',
    hair: 'Red',
    actor: 'Gillian Anderson',
    clearance: 4,
    status: 'ACTIVE',
    location: 'WASHINGTON D.C.',
    photo: null,
    bio: '黛娜．史卡利，美國馬里蘭大學畢業，主修物理，選修醫學系。最初派遣與穆德合作以監視X檔案部門，後成為穆德共同進退的好夥伴。竟奇蹟般的懷孕了。',
  },
  {
    id: 'skinner',
    name: 'Walter S. Skinner',
    birthday: '—',
    marriage: 'Divorced',
    tall: '—',
    hair: 'Black',
    actor: 'Mitch Pileggi',
    clearance: 6,
    status: 'ACTIVE',
    location: 'FBI HQ',
    photo: null,
    bio: 'FBI助理局長，穆德與史卡利的直屬上司。外表嚴肅，內心正義感強烈，曾多次在關鍵時刻暗中保護兩人。',
  },
]

const current = ref(characters[0])
function select(c) {
  active.value = c.id
  current.value = c
}
</script>

<template>
  <div class="demo-classified">
    <button class="back-btn" @click="router.push('/demos')">← 返回示範選單</button>
    <div class="label-top">STYLE 01 — FBI CLASSIFIED FILE</div>

    <!-- 角色選擇 Tab -->
    <div class="char-tabs">
      <button
        v-for="c in characters" :key="c.id"
        :class="['ctab', { active: active === c.id }]"
        @click="select(c)"
      >{{ c.name.split(' ')[0] }} {{ c.name.split(' ')[1] }}</button>
    </div>

    <!-- 主檔案卡 -->
    <div class="file-card">
      <!-- 頂部：機密標籤 -->
      <div class="file-header">
        <span class="file-tag">TOP SECRET</span>
        <span class="file-id">CASE NO. X-{{ current.id.toUpperCase() }}-{{ current.birthday.replace(/\//g, '') }}</span>
        <span class="file-tag red">FBI</span>
      </div>

      <div class="file-body">
        <!-- 左側：照片 + 印章 -->
        <div class="photo-section">
          <div class="photo-frame">
            <div class="photo-placeholder">
              <div class="photo-icon">👤</div>
              <div class="photo-name">{{ current.name.split(' ').slice(-1)[0].toUpperCase() }}</div>
            </div>
            <div class="stamp">CLASSIFIED</div>
          </div>
          <div class="clearance-bar">
            <span class="clearance-label">CLEARANCE LV.{{ current.clearance }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="`width:${current.clearance * 16.6}%`"></div>
            </div>
          </div>
        </div>

        <!-- 右側：資料 -->
        <div class="info-section">
          <h2 class="subject-name">{{ current.name }}</h2>
          <div class="divider"></div>
          <table class="data-table">
            <tr><td>BIRTHDAY</td><td>{{ current.birthday }}</td></tr>
            <tr><td>MARRIAGE</td><td>{{ current.marriage }}</td></tr>
            <tr><td>HEIGHT</td><td>{{ current.tall }}</td></tr>
            <tr><td>HAIR</td><td>{{ current.hair }}</td></tr>
            <tr><td>ACTOR</td><td>{{ current.actor }}</td></tr>
            <tr>
              <td>STATUS</td>
              <td :class="['status', current.status === 'ACTIVE' ? 'green' : 'red']">{{ current.status }}</td>
            </tr>
            <tr><td>LOCATION</td><td>{{ current.location }}</td></tr>
          </table>
          <div class="divider"></div>
          <p class="bio-text">{{ current.bio }}</p>
        </div>
      </div>

      <!-- 底部：條碼裝飾 -->
      <div class="file-footer">
        <div class="barcode">
          <span v-for="i in 40" :key="i" :style="`width:${Math.random()>0.5?2:1}px`"></span>
        </div>
        <span class="footer-text">FEDERAL BUREAU OF INVESTIGATION — X-FILES DIVISION</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-classified {
  min-height: 100vh;
  background: #f0ede6;
  padding: 16px;
  font-family: 'Courier New', monospace;
}

.back-btn {
  background: none;
  border: 1px solid #888;
  color: #555;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  margin-bottom: 12px;
}
.back-btn:hover { background: #ddd; }

.label-top {
  font-size: 10px;
  letter-spacing: 3px;
  color: #999;
  margin-bottom: 16px;
}

.char-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.ctab {
  background: #d4c9a8;
  border: 1px solid #b0a070;
  color: #5a4a20;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 6px 14px;
  cursor: pointer;
  border-radius: 2px;
}
.ctab.active, .ctab:hover {
  background: #8b1a1a;
  color: #fff;
  border-color: #6b0a0a;
}

/* 主檔案卡 */
.file-card {
  max-width: 720px;
  margin: 0 auto;
  background: #faf6ee;
  border: 1px solid #c8b88a;
  box-shadow: 4px 4px 0 #c8b88a, 8px 8px 0 #b8a87a;
  position: relative;
}

.file-header {
  background: #2a1a0a;
  color: #f0d080;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 11px;
  letter-spacing: 2px;
}
.file-tag {
  background: #f0d080;
  color: #2a1a0a;
  padding: 2px 8px;
  font-weight: bold;
  font-size: 10px;
}
.file-tag.red {
  background: #cc2200;
  color: #fff;
}

.file-body {
  display: flex;
  gap: 24px;
  padding: 20px;
}

/* 左側照片 */
.photo-section { width: 160px; flex-shrink: 0; }

.photo-frame {
  position: relative;
  border: 2px solid #8b7355;
  background: #e8e0d0;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 10px;
}
.photo-placeholder {
  text-align: center;
  color: #8b7355;
}
.photo-icon { font-size: 60px; }
.photo-name { font-size: 11px; letter-spacing: 3px; margin-top: 4px; }

.stamp {
  position: absolute;
  bottom: 12px;
  right: -8px;
  background: transparent;
  border: 3px solid rgba(180,0,0,0.6);
  color: rgba(180,0,0,0.7);
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 2px;
  padding: 4px 8px;
  transform: rotate(-20deg);
  white-space: nowrap;
}

.clearance-bar { font-size: 10px; color: #666; }
.clearance-label { display: block; margin-bottom: 4px; letter-spacing: 1px; }
.bar-track { height: 6px; background: #ddd; border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #8b1a1a, #cc3300); transition: width 0.5s; }

/* 右側資料 */
.info-section { flex: 1; }
.subject-name {
  font-size: 18px;
  color: #2a1a0a;
  letter-spacing: 2px;
  margin: 0 0 8px;
  font-weight: bold;
}
.divider { border: none; border-top: 1px dashed #c8b88a; margin: 10px 0; }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table td { padding: 4px 8px 4px 0; color: #444; vertical-align: top; }
.data-table td:first-child { color: #8b7355; letter-spacing: 1px; width: 90px; font-size: 10px; }
.status.green { color: #1a7a1a; font-weight: bold; }
.status.red   { color: #aa1a1a; font-weight: bold; }

.bio-text { font-size: 12px; line-height: 1.8; color: #555; }

/* 底部條碼 */
.file-footer {
  border-top: 1px solid #c8b88a;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f5f0e8;
}
.barcode {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 28px;
}
.barcode span {
  display: block;
  height: 100%;
  background: #2a1a0a;
}
.footer-text { font-size: 9px; letter-spacing: 2px; color: #999; }
</style>

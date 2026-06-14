<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { characters, actors } from '../data/profiles.js'

const route = useRoute()
const router = useRouter()

const BASE = import.meta.env.BASE_URL

const activeId = ref(route.params.id || 'mulder')
const mode = ref('character') // 'character' | 'actor'

const current = computed(() =>
  mode.value === 'character'
    ? characters.find(c => c.id === activeId.value) || characters[0]
    : actors.find(a => a.id === activeId.value) || actors[0]
)

function selectCharacter(id) {
  mode.value = 'character'
  activeId.value = id
  router.replace(`/profiles/${id}`)
}

function selectActor(id) {
  mode.value = 'actor'
  activeId.value = id
}

watch(() => route.params.id, id => {
  if (id) activeId.value = id
})
</script>

<template>
  <div class="page-bg">
  <div class="page">

    <!-- 上方導航：角色 -->
    <nav class="tab-row top">
      <button
        v-for="c in characters"
        :key="c.id"
        :class="['tab-btn', { active: mode === 'character' && activeId === c.id }]"
        @click="selectCharacter(c.id)"
      >{{ c.label }}</button>
    </nav>

    <!-- 主要內容卡片 -->
    <div class="card">
      <div class="card-inner">
        <!-- 左側：FBI 證件照 -->
        <div class="photo-col" :style="`background-image: url('${BASE}images/archives.jpg')`">
          <img
            v-if="current.photo"
            :src="`${BASE}${current.photo}`"
            :alt="current.name"
            class="agent-photo"
          />
          <div v-else class="no-photo">[ 檔案圖片未提供 ]</div>
        </div>

        <!-- 右側：資料 + 傳記 -->
        <div class="info-col" :style="current.bg ? `background-image: url('${BASE}${current.bg}'); background-size: cover; background-position: center;` : ''">
          <table class="info-table">
            <tbody>
              <tr>
                <td class="label">Name</td>
                <td>{{ current.name }}</td>
              </tr>
              <tr v-if="current.birthday">
                <td class="label">Birthday</td>
                <td>{{ current.birthday }}</td>
              </tr>
              <tr v-if="current.jobPosition">
                <td class="label">Job Position</td>
                <td>{{ current.jobPosition }}</td>
              </tr>
              <tr v-if="current.marriage">
                <td class="label">Marital status</td>
                <td>{{ current.marriage }}</td>
              </tr>
              <tr v-if="current.tall">
                <td class="label">Tall</td>
                <td>{{ current.tall }}</td>
              </tr>
              <tr v-if="current.hairColor">
                <td class="label">Hair color</td>
                <td>{{ current.hairColor }}</td>
              </tr>
              <tr v-if="mode === 'character'">
                <td class="label">Truly Identify</td>
                <td>
                  <a href="#" @click.prevent="selectActor(current.trulyIdentifyId)" class="actor-link">
                    {{ current.trulyIdentify }}
                  </a>
                </td>
              </tr>
              <tr v-if="mode === 'actor'">
                <td class="label">Playing</td>
                <td>
                  <a href="#" @click.prevent="selectCharacter(current.roleId)" class="actor-link">
                    {{ current.role }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="bio">{{ current.bio }}</p>
        </div>
      </div>
    </div>

    <!-- 下方導航：演員 -->
    <nav class="tab-row bottom">
      <button
        v-for="a in actors"
        :key="a.id"
        :class="['tab-btn', { active: mode === 'actor' && activeId === a.id }]"
        @click="selectActor(a.id)"
      >{{ a.label }}</button>
    </nav>

    <!-- 頁腳連結 -->
    <footer class="footer">
      <span>Characters</span>
      <span class="sep">|</span>
      <RouterLink to="/">Home</RouterLink>
      <span class="sep">|</span>
      <a href="mailto:hedy.hsu99@gmail.com">Email</a>
    </footer>
  </div>
  </div>
</template>

<style scoped>
.page-bg {
  background: #ffffff;
  min-height: 100vh;
}

.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 12px 0 24px;
}

@media (min-width: 1024px) {
  .page { max-width: 760px; }
  .photo-col { width: 220px; }
  .agent-photo { width: 160px; }
  .info-col { padding: 20px 28px; }
  .info-table { font-size: 13px; }
  .bio { font-size: 13px; }
}

/* === Tab 導航列 === */
.tab-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-bottom: 0;
  background-color: #394994;
  padding: 6px 6px 0;
}

.tab-btn {
  flex: 1;
  background-color: #314194;
  color: #ffffff;
  border: none;
  padding: 7px 4px;
  font-size: 12px;
  font-family: Tahoma, Arial, sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 10px 10px 0 0;
  min-width: 0;
}

.tab-btn:hover {
  background-color: #5566cc;
  color: #ffffcc;
}

.tab-btn.active {
  background-color: #394994;
  color: #ffffff;
  font-weight: bold;
}

/* === 主卡片 === */
.card {
  background: #ffffff;
  border: 3px solid #314194;
  margin-bottom: 0;
}

.card-inner {
  display: flex;
  min-height: 320px;
}

/* 左側照片欄 */
.photo-col {
  width: 200px;
  min-width: 160px;
  background-color: #dde0ee;
  background-repeat: repeat;
  background-size: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.agent-photo {
  width: 140px;
  height: auto;
  border: 2px solid #314194;
  display: block;
}

.no-photo {
  color: #888;
  font-size: 11px;
  text-align: center;
}

/* 右側資料欄 */
.info-col {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #f5f7ff;
}

.info-table {
  border-collapse: collapse;
  font-size: 13px;
  font-family: 'Century Gothic', Tahoma, Arial, sans-serif;
}

.info-table td {
  padding: 3px 12px 3px 0;
  vertical-align: top;
  color: #222222;
}

.info-table td:first-child {
  color: #314194;
}

.info-table .label {
  font-weight: bold;
  white-space: nowrap;
  color: #314194;
  padding-right: 16px;
}

.actor-link {
  color: #0000cc;
  text-decoration: underline;
}

.actor-link:hover {
  color: #cc0000;
}

.bio {
  font-size: 13px;
  line-height: 1.8;
  color: #222;
  font-family: '新細明體', 'MingLiu', serif;
  border-top: 1px dashed #aab;
  padding-top: 12px;
}

/* === 底部導航 === */
.bottom {
  background-color: #394994;
  border-top: 3px solid #314194;
  padding: 0 6px 6px;
  margin-top: 0;
}

.bottom .tab-btn {
  border: none;
  border-radius: 0 0 10px 10px;
}

.bottom .tab-btn.active {
  background-color: #394994;
  color: #ffffff;
  font-weight: bold;
}

/* === 頁腳 === */
.footer {
  margin-top: 16px;
  text-align: center;
  font-size: 11px;
  color: #888;
}

.footer a {
  color: #4466cc;
}

.footer a:hover {
  color: #cc0000;
}

.sep {
  margin: 0 6px;
  color: #bbb;
}

/* === 手機 RWD === */
@media (max-width: 600px) {
  .card-inner {
    flex-direction: column;
  }

  .photo-col {
    width: 100%;
    border-right: none;
    border-bottom: 3px solid #314194;
    min-height: 180px;
  }

  .tab-btn {
    flex: 1 1 auto;
    font-size: 11px;
    padding: 5px 8px;
  }
}
</style>

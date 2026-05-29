<template>
  <div class="amap-address-field">
    <div class="amap-input-row" @keydown.esc="showPanel = false">
      <t-input
        v-model="inputValue"
        class="amap-text-input"
        :placeholder="placeholder"
        clearable
        :status="loadError ? 'error' : undefined"
        :tips="loadError ? '高德地图未配置或加载失败：请在 .env 中设置 VITE_AMAP_KEY' : undefined"
        @input="onInput"
        @clear="onClear"
        @focus="onFocus"
        @blur="onBlur"
      />
      <t-button class="amap-map-btn" theme="default" variant="outline" :disabled="!amapKey" @click="openMapDialog">
        <template #icon><t-icon name="map" /></template>
        地图选点
      </t-button>
    </div>
    <div v-show="showPanel && suggestList.length" class="amap-suggest-wrap amap-suggest-wrap--cards">
      <div
        v-for="(item, i) in suggestList"
        :key="i"
        class="amap-poi-card"
        @mousedown.prevent="selectSuggest(item)"
      >
        <div class="amap-poi-thumb">
          <t-icon name="location" class="amap-poi-thumb-icon" />
          <img
            v-if="item.photoUrl"
            class="amap-poi-img"
            :src="item.photoUrl"
            alt=""
            @error="onPoiThumbError"
          />
        </div>
        <div class="amap-poi-text">
          <div class="amap-poi-title">{{ item.name }}</div>
          <div class="amap-poi-line">地址：{{ formatPoiAddressLine(item) }}</div>
          <div v-if="item.tel" class="amap-poi-line">电话：{{ item.tel }}</div>
        </div>
      </div>
    </div>

    <t-dialog
      v-model:visible="mapVisible"
      class="amap-pick-dialog"
      header="地图选点"
      width="min(90vw, 900px)"
      :close-on-overlay-click="false"
      :destroy-on-close="true"
    >
      <p class="amap-pick-tips">输入关键字后点「检索」定位到列表结果，或拖动图钉/点击地图；确定后按坐标逆地理编码填写企业办公地址与所在地区</p>
      <div class="amap-pick-search">
        <div class="amap-pick-search-row">
          <t-input
            v-model="mapSearchKeyword"
            class="amap-pick-search-input"
            clearable
            placeholder="输入关键字，如城市、站点、道路等"
            @clear="onMapSearchClear"
            @focus="onMapSearchFocus"
            @blur="onMapSearchBlur"
            @keyup.enter="handleMapSearch"
          />
          <t-button theme="primary" class="amap-pick-search-btn" :loading="mapSearchLoading" @click="handleMapSearch">
            检索
          </t-button>
        </div>
        <div
          v-show="mapSuggestVisible && (mapSearchLoading || mapSuggestList.length > 0)"
          class="amap-pick-suggest amap-pick-suggest--scroll"
        >
          <template v-if="mapSearchLoading && mapSuggestList.length === 0">
            <div class="amap-pick-loading">检索中…</div>
          </template>
          <template v-else>
            <div
              v-for="(item, i) in mapSuggestList"
              :key="i"
              class="amap-poi-card"
              @mousedown.prevent="selectMapSuggest(item)"
            >
              <div class="amap-poi-thumb">
                <t-icon name="location" class="amap-poi-thumb-icon" />
                <img
                  v-if="item.photoUrl"
                  class="amap-poi-img"
                  :src="item.photoUrl"
                  alt=""
                  @error="onPoiThumbError"
                />
              </div>
              <div class="amap-poi-text">
                <div class="amap-poi-title">{{ item.name }}</div>
                <div class="amap-poi-line">地址：{{ formatPoiAddressLine(item) }}</div>
                <div v-if="item.tel" class="amap-poi-line">电话：{{ item.tel }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div ref="mapContainerRef" class="amap-pick-canvas" />
      <template #footer>
        <t-button theme="default" @click="mapVisible = false">取消</t-button>
        <t-button theme="primary" :disabled="!markerLnglat" :loading="geocodeLoading" @click="confirmMapPick">
          确 定
        </t-button>
      </template>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import debounce from 'lodash/debounce';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onUnmounted, ref, watch } from 'vue';

import { loadAmap, useAmapPlugins } from '@/utils/amapLoad';
import { findCascaderPathByAdcode } from '@/utils/regionFromAdcode';

type PoiItem = {
  name: string;
  address: string;
  district: string;
  adcode?: string;
  lng: number;
  lat: number;
  /** 高德 POI 缩略图 */
  photoUrl?: string;
  /** 电话，多个时分号分隔 */
  tel?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    /** 省市区级联，选点/选 POI 后尝试按 adcode 回写 */
    region?: (string | number)[];
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    region: () => [],
    placeholder: '输入关键字检索企业办公地址，或点击「地图选点」在地图上选点',
  },
);

const emit = defineEmits<{
  'update:modelValue': [string];
  'update:region': [string[]];
}>();

const amapKey = (import.meta.env.VITE_AMAP_KEY as string | undefined) || '';
const inputValue = ref(props.modelValue);
const showPanel = ref(false);
const suggestList = ref<PoiItem[]>([]);
const loadError = ref(false);
const mapVisible = ref(false);
const mapContainerRef = ref<HTMLDivElement | null>(null);
const markerLnglat = ref<{ lng: number; lat: number } | null>(null);
const geocodeLoading = ref(false);
/** 地图弹窗内地点搜索 */
const mapSearchKeyword = ref('');
const mapSuggestList = ref<PoiItem[]>([]);
const mapSuggestVisible = ref(false);
const mapSearchLoading = ref(false);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let aMap: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geocoder: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapInstance: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapMarker: any;

watch(
  () => props.modelValue,
  (v) => {
    if (v !== inputValue.value) inputValue.value = v || '';
  },
);

function normalizePois(pois: unknown[] | undefined): PoiItem[] {
  if (!Array.isArray(pois)) return [];
  return (pois as unknown[])
    .map((raw) => {
      const p = raw as Record<string, unknown>;
      const loc = p.location as
        | { getLng?: () => number; getLat?: () => number; lng?: number; lat?: number }
        | undefined;
      let lng = 0;
      let lat = 0;
      if (loc) {
        if (typeof loc.getLng === 'function') {
          lng = loc.getLng() ?? 0;
          lat = loc.getLat?.() ?? 0;
        } else {
          lng = Number(loc.lng) || 0;
          lat = Number(loc.lat) || 0;
        }
      }
      const adcode = p.adcode != null ? String(p.adcode) : undefined;
      const name = String(p.name ?? '');
      const address = String(p.address ?? '');
      const district = [p.pname, p.cityname, p.adname].filter(Boolean).join(' ');
      let photoUrl: string | undefined;
      const photos = p.photos;
      if (Array.isArray(photos) && photos.length > 0) {
        const ph0 = photos[0] as Record<string, unknown>;
        const u = ph0?.url ?? ph0?.urlPath ?? (typeof photos[0] === 'string' ? photos[0] : '');
        if (u) photoUrl = String(u);
      } else if (p.photo) {
        photoUrl = String(p.photo);
      }
      const telRaw = p.tel != null ? String(p.tel) : '';
      const tel = telRaw ? telRaw.split(/[;；]/).map((s) => s.trim()).filter(Boolean).join('；') : undefined;
      return { name, address, district, adcode, lng, lat, photoUrl, tel };
    })
    .filter((x) => x.name);
}

function formatPoiAddressLine(item: PoiItem): string {
  const a = (item.address || '').trim();
  if (a) return a;
  const d = (item.district || '').trim();
  if (d) return d;
  return '—';
}

function onPoiThumbError(e: Event) {
  const el = e.target as HTMLImageElement;
  if (el) el.style.display = 'none';
}

async function ensureAmap() {
  if (aMap && geocoder) return;
  if (!amapKey) {
    loadError.value = true;
    return;
  }
  try {
    if (amapKey && !import.meta.env.VITE_AMAP_SECURITY_JS_CODE && import.meta.env.DEV) {
      console.warn(
        '[Amap] 未配置 VITE_AMAP_SECURITY_JS_CODE。自 2021 年起新申请的 Key 需在高德控制台的 Key 同页填写「安全密钥」到 .env，否则常出现有 Logo、地图灰底无瓦片。',
      );
    }
    aMap = await loadAmap(amapKey);
    await useAmapPlugins(aMap, ['AMap.PlaceSearch', 'AMap.Geocoder']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder = new (aMap as any).Geocoder();
    loadError.value = false;
  } catch (e) {
    console.error(e);
    aMap = undefined;
    geocoder = undefined;
    loadError.value = true;
  }
}

const runSearch = debounce(async (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) {
    suggestList.value = [];
    return;
  }
  await ensureAmap();
  if (!aMap) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const A = aMap as any;
  // 全国检索：若用表单「所在地区」做 city + citylimit，跨省搜地址会被限制在已选城市（如北京），导致搜不到外省
  const placeSearch = new A.PlaceSearch({
    pageSize: 12,
    city: '全国',
    citylimit: false,
  });
  placeSearch.search(keyword.trim(), (status: string, result: { poiList?: { pois?: unknown[] } }) => {
    if (status === 'error' || !result?.poiList?.pois) {
      suggestList.value = [];
      return;
    }
    suggestList.value = normalizePois(result.poiList.pois);
    showPanel.value = suggestList.value.length > 0;
  });
}, 400);

async function handleMapSearch() {
  const keyword = mapSearchKeyword.value.trim();
  if (keyword.length < 2) {
    MessagePlugin.warning('请至少输入 2 个字再点击「检索」');
    return;
  }
  mapSuggestVisible.value = true;
  mapSearchLoading.value = true;
  mapSuggestList.value = [];
  await ensureAmap();
  if (!aMap) {
    mapSearchLoading.value = false;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const A = aMap as any;
  const placeSearch = new A.PlaceSearch({
    pageSize: 20,
    city: '全国',
    citylimit: false,
  });
  placeSearch.search(keyword, (status: string, result: { poiList?: { pois?: unknown[] } }) => {
    mapSearchLoading.value = false;
    if (status === 'error') {
      mapSuggestList.value = [];
      MessagePlugin.warning('检索失败，请稍后重试');
      return;
    }
    const pois = result?.poiList?.pois;
    const list = normalizePois(Array.isArray(pois) ? pois : []);
    mapSuggestList.value = list;
    if (list.length === 0) {
      MessagePlugin.info('未检索到相关地点，可更换关键字再试');
      return;
    }
    const first = list.find((p) => p.lng && p.lat);
    if (first) {
      moveMapToPoi(first, { closeSuggest: false, syncKeyword: false });
    }
  });
}

function onInput() {
  emit('update:modelValue', inputValue.value);
  void runSearch(inputValue.value);
}

function onClear() {
  suggestList.value = [];
  showPanel.value = false;
  emit('update:modelValue', '');
}

function onFocus() {
  if (suggestList.value.length) showPanel.value = true;
}

function onBlur() {
  window.setTimeout(() => {
    showPanel.value = false;
  }, 200);
}

function applyPoi(
  name: string,
  address: string,
  adcode: string | undefined,
  _opts?: { lng: number; lat: number },
) {
  const line = [name, address].filter(Boolean).join(' ').trim();
  inputValue.value = line;
  emit('update:modelValue', line);
  if (adcode) {
    const path = findCascaderPathByAdcode(adcode);
    if (path) emit('update:region', path);
  }
  showPanel.value = false;
  suggestList.value = [];
}

function selectSuggest(item: PoiItem) {
  applyPoi(item.name, item.address, item.adcode, { lng: item.lng, lat: item.lat });
}

function onMapSearchClear() {
  mapSuggestList.value = [];
  mapSuggestVisible.value = false;
  mapSearchLoading.value = false;
}

function onMapSearchFocus() {
  if (mapSuggestList.value.length) mapSuggestVisible.value = true;
}

function onMapSearchBlur() {
  window.setTimeout(() => {
    mapSuggestVisible.value = false;
  }, 200);
}

function moveMapToPoi(
  item: PoiItem,
  opts?: { closeSuggest?: boolean; syncKeyword?: boolean },
) {
  if (!mapInstance || !mapMarker) return;
  if (!item.lng || !item.lat) return;
  const { lng, lat } = item;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mapInstance as any).setZoomAndCenter(17, [lng, lat]);
  mapMarker.setPosition([lng, lat]);
  markerLnglat.value = { lng, lat };
  scheduleMapResize();
  if (opts?.closeSuggest !== false) {
    mapSuggestVisible.value = false;
  }
  if (opts?.syncKeyword) {
    mapSearchKeyword.value = [item.name, item.address].filter(Boolean).join(' ').trim();
  }
}

function selectMapSuggest(item: PoiItem) {
  moveMapToPoi(item, { closeSuggest: true, syncKeyword: true });
}

function openMapDialog() {
  if (!amapKey) {
    loadError.value = true;
    return;
  }
  mapSearchKeyword.value = inputValue.value || '';
  mapSuggestList.value = [];
  mapSuggestVisible.value = false;
  mapVisible.value = true;
  markerLnglat.value = null;
}

function destroyMap() {
  if (mapInstance) {
    try {
      mapInstance.destroy();
    } catch {
      /* ignore */
    }
  }
  mapInstance = null;
  mapMarker = null;
  markerLnglat.value = null;
}

function runMapResize() {
  if (!mapInstance) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance as any).resize();
  } catch {
    /* ignore */
  }
}

function scheduleMapResize() {
  runMapResize();
  requestAnimationFrame(() => runMapResize());
  setTimeout(() => runMapResize(), 80);
  setTimeout(() => runMapResize(), 320);
}

watch(mapVisible, async (visible) => {
  if (!visible) {
    mapSearchKeyword.value = '';
    mapSuggestList.value = [];
    mapSuggestVisible.value = false;
    mapSearchLoading.value = false;
    destroyMap();
    return;
  }
  await ensureAmap();
  if (!aMap) return;
  await nextTick();
  // 弹层打开后需等版心宽高稳定，否则地图实例尺寸为 0 导致瓦片不刷；略大于常见动画时间
  await new Promise<void>((r) => setTimeout(r, 360));
  if (!mapContainerRef.value) return;
  destroyMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const A = aMap as any;
  const center: [number, number] = [116.397428, 39.90923];
  mapInstance = new A.Map(mapContainerRef.value, {
    viewMode: '2D',
    zoom: 15,
    center,
  });
  mapMarker = new A.Marker({
    position: center,
    map: mapInstance,
    draggable: true,
  });
  markerLnglat.value = { lng: center[0], lat: center[1] };
  mapInstance.on('click', (e: { lnglat: { getLng: () => number; getLat: () => number; lng: number; lat: number } }) => {
    const ll = e.lnglat;
    const lng = typeof ll.getLng === 'function' ? ll.getLng() : Number(ll.lng);
    const lat = typeof ll.getLat === 'function' ? ll.getLat() : Number(ll.lat);
    mapMarker.setPosition([lng, lat]);
    markerLnglat.value = { lng, lat };
  });
  mapMarker.on('dragend', () => {
    const p = mapMarker.getPosition();
    const lng = typeof p.getLng === 'function' ? p.getLng() : Number(p.lng);
    const lat = typeof p.getLat === 'function' ? p.getLat() : Number(p.lat);
    markerLnglat.value = { lng, lat };
  });
  scheduleMapResize();
});

function confirmMapPick() {
  if (!geocoder || !aMap || !markerLnglat.value) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const A = aMap as any;
  const ll = new A.LngLat(markerLnglat.value.lng, markerLnglat.value.lat);
  geocodeLoading.value = true;
  geocoder.getAddress(
    ll,
    (status: string, result: { regeocode?: { formattedAddress?: string; addressComponent?: { adcode?: string } } }) => {
      geocodeLoading.value = false;
      if (status === 'complete' && result.regeocode) {
        const f = result.regeocode.formattedAddress || '';
        const ad = result.regeocode.addressComponent?.adcode;
        inputValue.value = f;
        emit('update:modelValue', f);
        if (ad) {
          const path = findCascaderPathByAdcode(String(ad));
          if (path) emit('update:region', path);
        }
      }
      mapVisible.value = false;
    },
  );
}

onUnmounted(() => {
  destroyMap();
  aMap = undefined;
  geocoder = undefined;
});
</script>

<style scoped lang="less">
.amap-address-field {
  position: relative;
  width: 100%;
}
.amap-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
}
.amap-text-input {
  flex: 1;
  min-width: 0;
}
.amap-map-btn {
  flex-shrink: 0;
}
.amap-suggest-wrap {
  position: absolute;
  z-index: 2000;
  left: 0;
  right: 88px;
  top: 100%;
  margin-top: 4px;
  background: #fff;
  border: 1px solid var(--td-border-level-1-color, #e7e7e7);
  border-radius: var(--td-radius-default, 4px);
  box-shadow: var(--td-shadow-2, 0 2px 8px rgba(0, 0, 0, 0.08));
}
.amap-suggest-wrap--cards {
  max-height: 360px;
  overflow: auto;
}
.amap-poi-card {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--td-border-level-2-color, #f0f0f0);
  align-items: flex-start;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: var(--td-bg-color-container-hover, #f3f3f3);
  }
}
.amap-poi-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer, #f0f0f0);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.amap-poi-thumb-icon {
  color: var(--td-text-color-placeholder, #bbb);
  font-size: 24px;
}
.amap-poi-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}
.amap-poi-text {
  min-width: 0;
  flex: 1;
}
.amap-poi-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  line-height: 1.3;
}
.amap-poi-line {
  font-size: 12px;
  color: var(--td-text-color-secondary, rgba(0, 0, 0, 0.6));
  margin-top: 4px;
  line-height: 1.4;
  word-break: break-all;
}
.amap-pick-tips {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
.amap-pick-search {
  position: relative;
  z-index: 10;
  margin-bottom: 12px;
}
.amap-pick-search-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 100%;
}
.amap-pick-search-input {
  flex: 1;
  min-width: 0;
}
.amap-pick-search-btn {
  flex-shrink: 0;
  min-width: 72px;
}
.amap-pick-suggest {
  position: relative;
  margin-top: 8px;
  background: #fff;
  border: 1px solid var(--td-border-level-1-color, #e7e7e7);
  border-radius: var(--td-radius-default, 4px);
  box-shadow: var(--td-shadow-2, 0 2px 8px rgba(0, 0, 0, 0.08));
}
.amap-pick-suggest--scroll {
  max-height: 320px;
  overflow-y: auto;
}
.amap-pick-loading {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}
.amap-pick-canvas {
  width: 100%;
  height: 420px;
  border-radius: var(--td-radius-default);
  overflow: hidden;
  background: #e8ecf0;
}
</style>

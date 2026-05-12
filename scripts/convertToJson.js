/**  
 * ✅ 유통 필수취급 RAW → JSON 변환  
 * - Long format (점포-SKU 세로형) 파싱  
 * - 조직: 영업부서(R) → FL/MD팀장  
 * - 취급여부: col19 (1=취급, 0=미취급)  
 * - 카테고리: 두부/콩나물/계란 자동 감지  
 */  
  
const XLSX = require('xlsx');  
const fs = require('fs');  
const path = require('path');  
  
const DATA_DIR = path.join(__dirname, '../public/data');  
const xlsxFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.xlsx'));  
  
if (xlsxFiles.length === 0) {  
  console.error('❌ public/data/ 폴더에 xlsx 파일이 없습니다.');  
  process.exit(1);  
}  
  
// 여러 개면 최신 파일 자동 선택  
const XLSX_FILE = xlsxFiles.sort().reverse()[0];  
const XLSX_PATH = path.join(DATA_DIR, XLSX_FILE);  
console.log(`📂 사용 파일: ${XLSX_FILE}`);  
  
// 파일명에서 날짜 자동 추출 (YYYYMMDD 패턴)  
const dateMatch = XLSX_FILE.match(/(\d{4})(\d{2})(\d{2})/);  
const lastUpdate = dateMatch  
  ? {  
      date:      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`,  
      version:   `${dateMatch[2]}/${dateMatch[3]} 업데이트`,  
      updatedBy: '이동현',  
    }  
  : {  
      date:      new Date().toISOString().slice(0, 10),  
      version:   '업데이트',  
      updatedBy: '이동현',  
    };  
console.log(`📅 업데이트 날짜: ${lastUpdate.date}`);  
const OUTPUT_DIR = path.join(__dirname, '../public/data/asa');  
const META_PATH = path.join(__dirname, '../public/data/meta.json');  
  
const HEADER_ROW = 5; // 0-indexed Row5  
const DATA_START = 8; // 0-indexed Row8  
  
// ── 컬럼 인덱스 (Row5 기준) ──────────────────────────────────────  
const COL = {  
  ORG:        1,   // 영업부서/MD조직 (강서R 등)  
  TEAM:       2,   // 하위부서명  
  HQ:         3,   // 본부 (LS/GS)  
  MD:         4,   // FL/MD팀장명  
  FOCUS:      5,   // 집중관리 점포  
  MD_IN:      6,   // MD투입  
  OPERATION:  7,   // 운영(개·폐점)  
  STORE_CODE: 8,   // 소본점코드  
  STORE_NAME: 9,   // 소본점명  
  BARCODE:    10,  // 바코드  
  SALES:      11,  // 실적  
  CATEGORY:   16,  // 자재구분 (두부/콩나물/계란)  
  SKU_CODE:   17,  // 자재코드  
  SKU_NAME:   18,  // 자재명  
  HANDLED:    19,  // 취급) 실적 (1=취급, 0=미취급)  
};  
  
// ── 헤더행 동적 탐지 ─────────────────────────────────────────────  
const findHeaderRowIdx = (raw2d) => {  
  for (let r = 0; r < Math.min(raw2d.length, 20); r++) {  
    const row = raw2d[r] || [];  
    const hasStoreCode = row.some((c) => String(c || '').trim().includes('소본점코드'));  
    const hasHandled = row.some((c) => String(c || '').trim().includes('취급'));  
    if (hasStoreCode && hasHandled) return r;  
  }  
  return HEADER_ROW; // 기본값  
};  
  
// ── 컬럼 위치 동적 탐지 ─────────────────────────────────────────  
const buildColMap = (headerRow) => {  
  const map = { ...COL };  
  headerRow.forEach((cell, idx) => {  
    const v = String(cell || '').trim();  
    if (v.includes('소본점코드'))                    map.STORE_CODE = idx;  
    else if (v.includes('소본점명'))                 map.STORE_NAME = idx;  
    else if (v.includes('영업부서') || v.includes('MD조직')) map.ORG = idx;  
    else if (v.includes('하위부서'))                 map.TEAM = idx;  
    else if (v === '본부')                           map.HQ = idx;  
    else if (v.includes('FL') || v.includes('팀장')) map.MD = idx;  
    else if (v.includes('집중관리'))                 map.FOCUS = idx;  
    else if (v.includes('MD투입'))                   map.MD_IN = idx;  
    else if (v.includes('운영'))                     map.OPERATION = idx;  
    else if (v === '바코드')                         map.BARCODE = idx;  
    else if (v === '실적')                           map.SALES = idx;  
    else if (v === '자재구분')                       map.CATEGORY = idx;  
    else if (v === '자재코드')                       map.SKU_CODE = idx;  
    else if (v === '자재명')                         map.SKU_NAME = idx;  
    else if (v === '취급) 실적')                     map.HANDLED = idx;  
  });  
  return map;  
};  
  
// ── 시트 파싱 ────────────────────────────────────────────────────  
const parseSheet = (raw2d, sheetName) => {  
  const headerRowIdx = findHeaderRowIdx(raw2d);  
  const headerRow = raw2d[headerRowIdx] || [];  
  const colMap = buildColMap(headerRow);  
  const dataStart = headerRowIdx + 3; // 헤더 + 2개 서브헤더 + 1  
  
  // ① SKU 목록 자동 추출 (전체 데이터에서 고유값)  
  const skuMap = {};  
  for (let r = dataStart; r < raw2d.length; r++) {  
    const row = raw2d[r];  
    if (!row) continue;  
    const skuCode = String(row[colMap.SKU_CODE] ?? '').trim();  
    const skuName = String(row[colMap.SKU_NAME] ?? '').trim();  
    const category = String(row[colMap.CATEGORY] ?? '').trim();  
    if (skuCode && skuName && !skuMap[skuCode]) {  
      skuMap[skuCode] = { code: skuCode, name: skuName, category, sheet: sheetName };  
    }  
  }  
  const skus = Object.values(skuMap);  
  const categories = [...new Set(skus.map((s) => s.category).filter(Boolean))].sort();  
  
  // ② 점포별 데이터 그룹핑  
  const storeMap = {};  
  for (let r = dataStart; r < raw2d.length; r++) {  
    const row = raw2d[r];  
    if (!row) continue;  
  
    const storeCode = String(row[colMap.STORE_CODE] ?? '').trim();  
    const storeName = String(row[colMap.STORE_NAME] ?? '').trim();  
    if (!storeCode || !storeName) continue;  
  
    const org = String(row[colMap.ORG] ?? '').trim();  
    const team = String(row[colMap.TEAM] ?? '').trim();  
    const hq = String(row[colMap.HQ] ?? '').trim();  
    const md = String(row[colMap.MD] ?? '').trim();  
    const focus = String(row[colMap.FOCUS] ?? '').trim();  
    const mdIn = String(row[colMap.MD_IN] ?? '').trim();  
    const operation= String(row[colMap.OPERATION] ?? '').trim();  
    const skuCode = String(row[colMap.SKU_CODE] ?? '').trim();  
    const handled = row[colMap.HANDLED] === 1 || row[colMap.HANDLED] === '1' ? 1 : 0;  
  
    if (!storeMap[storeCode]) {  
      storeMap[storeCode] = {  
        storeCode,  
        name: storeName,  
        org,  
        team,  
        hq,  
        md,           // ✅ FL/MD팀장 = ASA 역할  
        focus,  
        mdIn,  
        operation,  
        sheet: sheetName,  
        handling: {},  
      };  
    }  
    if (skuCode) {  
      storeMap[storeCode].handling[skuCode] = handled;  
    }  
  }  
  
  // ③ 점포별 취급률 계산 (전체 SKU 36개 기준)  
const stores = Object.values(storeMap).map((store) => {  
  const allSkuCodes = skus.map((s) => s.code);  
  
  // ✅ RAW에 없는 SKU → 미취급(0)으로 처리  
  const handled = allSkuCodes.filter((c) => store.handling[c] === 1);  
  const rate = allSkuCodes.length > 0  
    ? Math.round(handled.length / allSkuCodes.length * 1000) / 10  
    : 0;  
  
  // 카테고리별 취급률 (전체 기준)  
  const catRates = {};  
  categories.forEach((cat) => {  
    const catSkus = skus.filter((s) => s.category === cat).map((s) => s.code);  
    const catHand = catSkus.filter((c) => store.handling[c] === 1);  
    catRates[cat] = catSkus.length > 0  
      ? Math.round(catHand.length / catSkus.length * 1000) / 10  
      : null;  
  });  
  
  return {  
    ...store,  
    rate,  
    catRates,  
    handledTotal:  handled.length,        // ✅ 취급 SKU 수  
    requiredTotal: allSkuCodes.length,    // ✅ 전체 SKU 수 (36개)  
  };  
});  
  
  return { stores, skus, categories };  
};  
  
// ── 메인 실행 ────────────────────────────────────────────────────  
const main = () => {  
  console.log('📊 유통 XLSX → JSON 변환 시작...');  
  
  if (!fs.existsSync(XLSX_PATH)) {  
    console.error(`❌ 파일 없음: ${XLSX_PATH}`);  
    process.exit(1);  
  }  
  
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });  
  
  const wb = XLSX.readFile(XLSX_PATH);  
  
  const metaMDs = {};  // MD팀장별 메타 (ASA 역할)  
  let totalStores = 0;  
  let totalMD = 0;  
  
  wb.SheetNames.forEach((sheetName) => {  
    try {  
      const ws = wb.Sheets[sheetName];  
      const raw2d = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });  
      const { stores, skus, categories } = parseSheet(raw2d, sheetName);  
  
      console.log(` 📄 [${sheetName}] 점포 ${stores.length}개, SKU ${skus.length}개`);  
      console.log(` 카테고리: ${categories.join(', ')}`);  
  
      // MD팀장(ASA)별 그룹핑  
      const mdGroups = {};  
      stores.forEach((store) => {  
        const key = `${sheetName}__${store.org}__${store.md}`;  
        if (!mdGroups[key]) {  
          mdGroups[key] = {  
            sheet: sheetName,  
            org:   store.org,  
            md:    store.md,  
            stores: [],  
            skus,  
            categories,  
          };  
        }  
        mdGroups[key].stores.push(store);  
      });  
  
      // MD팀장별 JSON 저장  
      Object.entries(mdGroups).forEach(([key, data]) => {  
        const safeName = `${sheetName}_${data.org}_${data.md}`.replace(/[/\\?%*:|"<>]/g, '_');  
        const fileName = `${safeName}.json`;  
        const filePath = path.join(OUTPUT_DIR, fileName);  
        fs.writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');  
  
        const avgRate = data.stores.length  
          ? Math.round(data.stores.reduce((s, d) => s + d.rate, 0) / data.stores.length * 10) / 10  
          : 0;  
  
        if (!metaMDs[data.org]) metaMDs[data.org] = {};  
        if (!metaMDs[data.org][data.md]) {  
          metaMDs[data.org][data.md] = [];  
          totalMD++;  
        }  
        metaMDs[data.org][data.md].push({  
          sheet:      sheetName,  
          storeCount: data.stores.length,  
          avgRate,  
          fileName,  
        });  
        totalStores += data.stores.length;  
      });  
  
    } catch (err) {  
      console.warn(` ⚠️ [${sheetName}] 파싱 실패: ${err.message}`);  
    }  
  });  
  
  // meta.json 저장  
  const meta = {  
    sheets: wb.SheetNames,  
    orgs: Object.entries(metaMDs).map(([org, mds]) => ({  
      org,  
      mds: Object.entries(mds).map(([md, sheets]) => ({  
        md,  
        sheets,  
        totalStores: sheets.reduce((s, d) => s + d.storeCount, 0),  
        avgRate: Math.round(  
          sheets.reduce((s, d) => s + d.avgRate, 0) / sheets.length * 10  
        ) / 10,  
      })),  
    })),  
  };  
  
    // ✅ 파일명에서 추출한 날짜 자동 반영  
  meta.lastUpdate = lastUpdate;  
  
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 0), 'utf8');  
  
  console.log(`\n✅ 변환 완료!`);  
  console.log(` - 영업부서(R): ${Object.keys(metaMDs).length}개`);  
  console.log(` - MD팀장: ${totalMD}명`);  
  console.log(` - 점포: ${totalStores}개\n`);  
};  // ← main 함수 닫는 괄호  
  
main();  // ← main 함수 호출  
 

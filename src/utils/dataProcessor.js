/**  
 * ✅ 유통 필수취급 데이터 프로세서  
 * - Long format JSON 기반  
 * - 조직: 영업부서(R) → MD팀장  
 * - 취급여부: 1/0  
 */  
  
export const getUnique = (arr) =>  
  [...new Set(arr.filter(Boolean))].sort();  
  
export const applyFilters = (stores, { org, md, category, search }) =>  
  stores.filter((s) => {  
    if (org && org !== '전체' && s.org !== org)      return false;  
    if (md && md !== '전체' && s.md !== md)       return false;  
    if (search && !s.name.includes(search) &&  
                    !s.org.includes(search)  &&  
                    !s.md.includes(search))                      return false;  
    return true;  
  });  
  
// 점포 SKU 상세  
export const getStoreSkuDetail = (store, skus, categoryFilter = '전체') =>  
  skus  
    .filter((sku) => {  
      if (categoryFilter !== '전체' && sku.category !== categoryFilter) return false;  
      return true;  
    })  
    .map((sku) => {  
      const val = store.handling[sku.code];  
      return {  
        ...sku,  
        value:      val,  
        handled:    val === 1,  
        notHandled: val === 0,  
      };  
    });  

import React, { useState } from 'react';  
import { getStoreSkuDetail } from '../utils/dataProcessor';  
  
const rateColor = (r) => (r >= 80 ? '#388E3C' : r >= 60 ? '#F57C00' : '#D32F2F');  
const hqColor = (h) => h === 'LS' ? '#1565C0' : h === 'GS' ? '#2E7D32' : '#888';  
  
const StoreDetail = ({ store, skus, categories }) => {  
  const [catFilter,    setCatFilter] = useState('전체');  
  const [statusFilter, setStatusFilter] = useState('전체');  
  const [skuSearch,    setSkuSearch] = useState('');  
  
  const allDetail = getStoreSkuDetail(store, skus, '전체');  
  const filtered = getStoreSkuDetail(store, skus, catFilter).filter((d) => {  
    if (statusFilter === '취급'   && !d.handled)  return false;  
    if (statusFilter === '미취급' &&  d.handled)  return false;  
    if (skuSearch && !d.name.includes(skuSearch) &&  
                     !d.code.includes(skuSearch)) return false;  
    return true;  
  });  
  
  const handledAll = allDetail.filter((d) => d.handled).length;  
  const totalAll = allDetail.length;  
  
  // 카테고리별 취급 현황  
  const catSummary = categories.map((cat) => {  
    const catSkus = allDetail.filter((d) => d.category === cat);  
    const catHandled = catSkus.filter((d) => d.handled).length;  
    const catTotal = catSkus.length;  
    const catRate = catTotal > 0 ? Math.round(catHandled / catTotal * 1000) / 10 : 0;  
    return { cat, handled: catHandled, total: catTotal, rate: catRate };  
  });  
  
  return (  
    <div className="dashboard">  
      {/* 점포 정보 */}  
      <div className="card store-summary">  
        <div className="store-info-row">  
          <div>  
            <span className="info-label">본부</span>  
            <span className="info-val" style={{ color: hqColor(store.hq) }}>  
              {store.hq}  
            </span>  
          </div>  
          <div>  
            <span className="info-label">영업부서</span>  
            <span className="info-val">{store.org}</span>  
          </div>  
          <div>  
            <span className="info-label">팀</span>  
            <span className="info-val">{store.team}</span>  
          </div>  
          <div>  
            <span className="info-label">MD팀장</span>  
            <span className="info-val">{store.md}</span>  
          </div>  
        </div>  
  
        {/* 점포 뱃지 */}  
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>  
          {store.focus === 'Y' && (  
            <span style={{  
              fontSize: 11, fontWeight: 700,  
              background: '#FFF8E1', color: '#F57F17',  
              padding: '3px 8px', borderRadius: 8,  
            }}>⭐ 집중관리 점포</span>  
          )}  
          {store.mdIn === '투입' && (  
            <span style={{  
              fontSize: 11, fontWeight: 700,  
              background: '#E8F5E9', color: '#2E7D32',  
              padding: '3px 8px', borderRadius: 8,  
            }}>✅ MD투입</span>  
          )}  
          {store.operation && (  
            <span style={{  
              fontSize: 11, fontWeight: 700,  
              background: '#F3E5F5', color: '#7B1FA2',  
              padding: '3px 8px', borderRadius: 8,  
            }}>{store.operation}</span>  
          )}  
        </div>  
  
        {/* 취급률 요약 */}  
        <div className="store-summary-row">  
          <div className="store-stat">  
            <span className="stat-val" style={{ color: '#1565C0' }}>{totalAll}</span>  
            <span className="stat-label">필수SKU</span>  
          </div>  
          <div className="store-stat">  
            <span className="stat-val" style={{ color: '#388E3C' }}>{handledAll}</span>  
            <span className="stat-label">취급</span>  
          </div>  
          <div className="store-stat">  
            <span className="stat-val" style={{ color: '#D32F2F' }}>{totalAll - handledAll}</span>  
            <span className="stat-label">미취급</span>  
          </div>  
          <div className="store-stat">  
            <span className="stat-val" style={{ color: rateColor(store.rate) }}>  
              {store.rate}%  
            </span>  
            <span className="stat-label">취급률</span>  
          </div>  
        </div>  
  
        {/* 카테고리별 취급률 */}  
        {catSummary.length > 1 && (  
          <div className="cat-summary-row">  
            {catSummary.map(({ cat, handled, total, rate }) => (  
              <div  
                key={cat}  
                className="cat-summary-item"  
                style={{  
                  borderColor: catFilter === cat ? '#1565C0' : '#eee',  
                  background:  catFilter === cat ? '#E3F2FD' : '#fff',  
                }}  
                onClick={() => setCatFilter(catFilter === cat ? '전체' : cat)}  
              >  
                <span className="cat-name">{cat}</span>  
                <span className="cat-rate" style={{ color: rateColor(rate) }}>{rate}%</span>  
                <span className="cat-count">{handled}/{total}</span>  
              </div>  
            ))}  
          </div>  
        )}  
      </div>  
  
      {/* 필터 */}  
      <div className="card filter-bar">  
        {/* 카테고리 칩 */}  
        {categories.length > 1 && (  
          <div className="chip-row">  
            {['전체', ...categories].map((c) => (  
              <button  
                key={c}  
                className={`chip ${catFilter === c ? 'chip-active' : ''}`}  
                style={catFilter === c ? { background: '#1565C0' } : {}}  
                onClick={() => setCatFilter(c)}  
              >{c}</button>  
            ))}  
          </div>  
        )}  
  
        {/* 취급 상태 */}  
        <div className="chip-row" style={{ marginTop: 8 }}>  
          {['전체', '취급', '미취급'].map((v) => (  
            <button  
              key={v}  
              className={`chip ${statusFilter === v ? 'chip-active' : ''}`}  
              style={statusFilter === v ? {  
                background:  
                  v === '미취급' ? '#D32F2F' :  
                  v === '취급'   ? '#388E3C' : '#1565C0',  
              } : {}}  
              onClick={() => setStatusFilter(v)}  
            >{v}</button>  
          ))}  
        </div>  
  
        {/* SKU 검색 */}  
        <div className="filter-item full-width" style={{ marginTop: 8 }}>  
          <input  
            type="text"  
            placeholder="SKU명 또는 자재코드 검색..."  
            value={skuSearch}  
            onChange={(e) => setSkuSearch(e.target.value)}  
          />  
        </div>  
      </div>  
  
      {/* SKU 목록 */}  
      <div className="card">  
        <h2 className="section-title">  
          SKU 상세 ({filtered.length}개)  
          {catFilter !== '전체' && (  
            <span className="cat-badge">{catFilter}</span>  
          )}  
        </h2>  
        <div className="sku-list">  
          {filtered.length === 0 && <p className="empty-msg">조건에 맞는 SKU 없음</p>}  
          {filtered.map((sku, i) => (  
            <div key={i} className={`sku-row ${sku.handled ? 'handled' : 'not-handled'}`}>  
              <div className="sku-left">  
                <span className="sku-status">{sku.handled ? '✅' : '❌'}</span>  
                <div>  
                  <div className="sku-name">  
                    {sku.code && <span className="sku-code-inline">{sku.code} / </span>}  
                    {sku.name}  
                  </div>  
                  <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>  
                    {sku.category && (  
                      <span className="cat-tag">{sku.category}</span>  
                    )}  
                  </div>  
                </div>  
              </div>  
              <div className={`sku-tag ${sku.handled ? 'tag-ok' : 'tag-no'}`}>  
                {sku.handled ? '취급' : '미취급'}  
              </div>  
            </div>  
          ))}  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default StoreDetail;  

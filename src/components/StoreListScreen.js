import React, { useState } from 'react';  
  
const rateColor = (r) => (r >= 80 ? '#388E3C' : r >= 60 ? '#F57C00' : '#D32F2F');  
const hqColor = (h) => h === 'LS' ? '#1565C0' : h === 'GS' ? '#2E7D32' : '#888';  
  
const StoreListScreen = ({ stores, org, md, onSelectStore }) => {  
  const [hqFilter,    setHqFilter] = useState('전체');  
  const [catFilter,   setCatFilter] = useState('전체');  
  const [focusFilter, setFocusFilter] = useState('전체');  
  const [search,      setSearch] = useState('');  
  const [sortBy,      setSortBy] = useState('rate_asc');  
  
  const myStores = stores.filter((s) => s.org === org && s.md === md);  
  
  // 동적 필터 옵션  
  const hqList = [...new Set(myStores.map((s) => s.hq).filter(Boolean))].sort();  
  const allCats = [...new Set(  
    myStores.flatMap((s) => Object.keys(s.catRates || {}))  
  )].sort();  
  
  const filtered = myStores.filter((s) => {  
    if (hqFilter !== '전체' && s.hq !== hqFilter)       return false;  
    if (focusFilter === 'Y'    && s.focus !== 'Y')             return false;  
    if (search && !s.name.includes(search))                    return false;  
    return true;  
  });  
  
  const sorted = [...filtered].sort((a, b) => {  
    if (sortBy === 'rate_asc')  return a.rate - b.rate;  
    if (sortBy === 'rate_desc') return b.rate - a.rate;  
    if (sortBy === 'name')      return a.name.localeCompare(b.name);  
    return 0;  
  });  
  
  const avg = myStores.length  
    ? Math.round(myStores.reduce((s, d) => s + d.rate, 0) / myStores.length * 10) / 10 : 0;  
  const under60 = myStores.filter((s) => s.rate < 60).length;  
  const above80 = myStores.filter((s) => s.rate >= 80).length;  
  const focusCount = myStores.filter((s) => s.focus === 'Y').length;  
  
  return (  
    <div className="storelist-screen">  
  
      {/* KPI */}  
      <div className="summary-cards">  
        <div className="summary-card">  
          <span className="card-icon">🏪</span>  
          <span className="card-label">담당 점포</span>  
          <span className="card-value" style={{ color: '#1565C0' }}>  
            {myStores.length}<span className="card-unit">개</span>  
          </span>  
        </div>  
        <div className="summary-card">  
          <span className="card-icon">📊</span>  
          <span className="card-label">평균 취급률</span>  
          <span className="card-value" style={{ color: rateColor(avg) }}>  
            {avg}<span className="card-unit">%</span>  
          </span>  
        </div>  
        <div className="summary-card">  
          <span className="card-icon">⚠️</span>  
          <span className="card-label">미달성 60%↓</span>  
          <span className="card-value" style={{ color: '#D32F2F' }}>  
            {under60}<span className="card-unit">개</span>  
          </span>  
        </div>  
        <div className="summary-card">  
          <span className="card-icon">⭐</span>  
          <span className="card-label">집중관리 점포</span>  
          <span className="card-value" style={{ color: '#F57F17' }}>  
            {focusCount}<span className="card-unit">개</span>  
          </span>  
        </div>  
      </div>  
  
      {/* 본부 분포 */}  
      {hqList.length > 0 && (  
        <div className="card grade-dist">  
          <span className="section-title-sm">본부 분포</span>  
          <div className="grade-chips">  
            {hqList.map((h) => {  
              const cnt = myStores.filter((s) => s.hq === h).length;  
              return (  
                <span key={h} className="grade-chip" style={{ background: hqColor(h) }}>  
                  {h} <strong>{cnt}</strong>  
                </span>  
              );  
            })}  
          </div>  
        </div>  
      )}  
  
      {/* 필터 */}  
      <div className="card filter-bar">  
        <div className="filter-row">  
          {/* 본부 */}  
          <div className="filter-item">  
            <label>🏦 본부</label>  
            <select value={hqFilter} onChange={(e) => setHqFilter(e.target.value)}>  
              <option value="전체">전체</option>  
              {hqList.map((h) => <option key={h} value={h}>{h}</option>)}  
            </select>  
          </div>  
          {/* 정렬 */}  
          <div className="filter-item">  
            <label>↕️ 정렬</label>  
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>  
              <option value="rate_asc">취급률 낮은순</option>  
              <option value="rate_desc">취급률 높은순</option>  
              <option value="name">점포명순</option>  
            </select>  
          </div>  
        </div>  
  
        {/* 집중관리 필터 */}  
        <div className="chip-row" style={{ marginBottom: 8 }}>  
          {['전체', 'Y'].map((v) => (  
            <button  
              key={v}  
              className={`chip ${focusFilter === v ? 'chip-active' : ''}`}  
              style={focusFilter === v ? { background: '#F57F17' } : {}}  
              onClick={() => setFocusFilter(v)}  
            >  
              {v === 'Y' ? '⭐ 집중관리만' : '📦 전체'}  
            </button>  
          ))}  
        </div>  
  
        {/* 검색 */}  
        <div className="filter-item full-width">  
          <label>🔍 점포 검색</label>  
          <input  
            type="text"  
            placeholder="점포명 검색..."  
            value={search}  
            onChange={(e) => setSearch(e.target.value)}  
          />  
        </div>  
      </div>  
  
      {/* 점포 목록 */}  
      <div className="card">  
        <h2 className="section-title">  
          점포 목록  
          <span style={{ fontSize: 13, fontWeight: 400, color: '#888', marginLeft: 6 }}>  
            {filtered.length}/{myStores.length}개  
          </span>  
        </h2>  
        <p className="hint-text">탭하면 SKU 취급 현황 확인 →</p>  
        <div className="store-list">  
          {sorted.length === 0 && <p className="empty-msg">조건에 맞는 점포 없음</p>}  
          {sorted.map((store, i) => (  
            <div key={i} className="store-row" onClick={() => onSelectStore(store)}>  
              <div className="store-row-left">  
                {/* 본부 뱃지 */}  
                <span className="grade-badge" style={{ background: hqColor(store.hq) }}>  
                  {store.hq}  
                </span>  
                <div>  
                  <div className="store-name">{store.name}</div>  
                  <div className="store-sub">  
                    {store.storeCode}  
                    {store.focus === 'Y' && (  
                      <span style={{  
                        fontSize: 10, fontWeight: 600,  
                        background: '#FFF8E1', color: '#F57F17',  
                        padding: '1px 5px', borderRadius: 5, marginLeft: 4,  
                      }}>⭐ 집중</span>  
                    )}  
                    {store.mdIn === '투입' && (  
                      <span style={{  
                        fontSize: 10, fontWeight: 600,  
                        background: '#E8F5E9', color: '#2E7D32',  
                        padding: '1px 5px', borderRadius: 5, marginLeft: 4,  
                      }}>MD투입</span>  
                    )}  
                  </div>  
                </div>  
              </div>  
              <div className="store-row-right">  
                <div>  
                  <div className="store-rate" style={{ color: rateColor(store.rate) }}>  
                    {store.rate}%  
                  </div>  
                  <div className="store-rate-sub">  
                    {store.handledTotal}/{store.requiredTotal}  
                  </div>  
                </div>  
                <div className="mini-bar">  
                  <div className="mini-fill"  
                    style={{ width: `${store.rate}%`, background: rateColor(store.rate) }} />  
                </div>  
                <span className="arrow">›</span>  
              </div>  
            </div>  
          ))}  
        </div>  
      </div>  
    </div>  
  );  
};  
  
export default StoreListScreen;  

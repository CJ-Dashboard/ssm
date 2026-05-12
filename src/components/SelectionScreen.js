import React, { useState } from 'react';  
  
const rateColor = (r) => (r >= 80 ? '#388E3C' : r >= 60 ? '#F57C00' : '#D32F2F');  
  
const SelectionScreen = ({ meta, onConfirm, isLoading, error }) => {  
  const [org,       setOrg] = useState('');  
  const [md,        setMd] = useState('');  
  const [orgSearch, setOrgSearch] = useState('');  
  
  const orgList = meta.orgs.map((o) => o.org);  
  const filteredOrgList = orgSearch  
    ? orgList.filter((o) => o.includes(orgSearch))  
    : orgList;  
  const selectedOrgData = meta.orgs.find((o) => o.org === org);  
  const mdList = selectedOrgData?.mds || [];  
  const selectedMdData = mdList.find((m) => m.md === md);  
  
  const handleOrgSelect = (o) => {  
    if (org === o) { setOrg(''); setMd(''); }  
    else { setOrg(o); setMd(''); setOrgSearch(''); }  
  };  
  
  const handleConfirm = () => {  
    if (!org || !md || !selectedMdData) return;  
    const sheetFiles = selectedMdData.sheets.map((s) => ({  
      sheet: s.sheet, fileName: s.fileName,  
    }));  
    onConfirm(org, md, sheetFiles);  
  };  
  
  const canConfirm = org && md && !isLoading;  
  
  return (  
    <div className="selection-screen">  
  
      {meta.lastUpdate && (  
        <div className="update-banner">  
          <span className="update-banner-icon">📅</span>  
          <div>  
            <div className="update-banner-date">{meta.lastUpdate.date} 업데이트</div>  
            <div className="update-banner-version">  
              {meta.lastUpdate.version} · {meta.lastUpdate.updatedBy}  
            </div>  
          </div>  
        </div>  
      )}  
  
      {error && <div className="error-box">⚠️ {error}</div>}  
  
      <div className="selection-hero">  
        <span className="selection-emoji">👋</span>  
        <h2>안녕하세요!</h2>  
        <p>영업부서와 MD팀장을 선택해 주세요</p>  
      </div>  
  
      {/* STEP 1: 영업부서 선택 */}  
      <div className="selection-card">  
        <div className="step-label">  
          <span className="step-num">1</span>  
          <span>영업부서 선택</span>  
          {org && (  
            <button className="change-btn" onClick={() => { setOrg(''); setMd(''); }}>  
              변경  
            </button>  
          )}  
        </div>  
  
        {!org ? (  
          <>  
            <div className="dealer-search-wrap">  
              <input  
                className="dealer-search-input"  
                type="text"  
                placeholder={`🔍 영업부서 검색... (총 ${orgList.length}개)`}  
                value={orgSearch}  
                onChange={(e) => setOrgSearch(e.target.value)}  
              />  
            </div>  
            <div className="dealer-list">  
              {filteredOrgList.length === 0 && (  
                <p className="empty-msg" style={{ padding: '16px 0' }}>검색 결과 없음</p>  
              )}  
              {filteredOrgList.map((o) => {  
                const oData = meta.orgs.find((x) => x.org === o);  
                return (  
                  <button key={o} className="dealer-item" onClick={() => handleOrgSelect(o)}>  
                    <span className="dealer-item-name">🏢 {o}</span>  
                    <span className="dealer-item-count">{oData?.mds.length || 0}명</span>  
                  </button>  
                );  
              })}  
            </div>  
          </>  
        ) : (  
          <div className="dealer-selected">  
            <span className="dealer-selected-icon">🏢</span>  
            <span className="dealer-selected-name">{org}</span>  
            <span className="dealer-selected-count">  
              {selectedOrgData?.mds.length || 0}명  
            </span>  
          </div>  
        )}  
      </div>  
  
      {/* STEP 2: MD팀장 선택 */}  
      <div className={`selection-card ${!org ? 'card-disabled' : ''}`}>  
        <div className="step-label">  
          <span className={`step-num ${!org ? 'step-num-disabled' : ''}`}>2</span>  
          <span>  
            MD팀장 선택  
            {org && <span className="step-sub">— {org}</span>}  
          </span>  
        </div>  
        {!org ? (  
          <p className="disabled-hint">① 먼저 영업부서를 선택해 주세요</p>  
        ) : (  
          <div className="asa-list">  
            {mdList.map((m) => (  
              <button  
                key={m.md}  
                className={`asa-item ${md === m.md ? 'asa-item-active' : ''}`}  
                onClick={() => setMd(m.md)}  
              >  
                <div className="asa-item-left">  
                  <span className="asa-icon">👤</span>  
                  <div>  
                    <div className="asa-name">{m.md}</div>  
                    <div className="asa-store-count">{m.totalStores}개 점포</div>  
                  </div>  
                </div>  
                <div className="asa-rate" style={{ color: rateColor(m.avgRate) }}>  
                  {m.avgRate}%  
                </div>  
              </button>  
            ))}  
          </div>  
        )}  
      </div>  
  
      {/* 미리보기 */}  
      {canConfirm && selectedMdData && (  
        <div className="preview-card">  
          <div className="preview-title">📋 선택 확인</div>  
          <div className="preview-info">  
            <div className="preview-row">  
              <span className="preview-label">영업부서</span>  
              <span className="preview-val">{org}</span>  
            </div>  
            <div className="preview-row">  
              <span className="preview-label">MD팀장</span>  
              <span className="preview-val">{md}</span>  
            </div>  
            <div className="preview-row">  
              <span className="preview-label">점포 수</span>  
              <span className="preview-val">  
                <strong style={{ color: '#1565C0' }}>{selectedMdData.totalStores}개</strong>  
              </span>  
            </div>  
            <div className="preview-row">  
              <span className="preview-label">평균 취급률</span>  
              <span className="preview-val"  
                style={{ color: rateColor(selectedMdData.avgRate), fontWeight: 700 }}>  
                {selectedMdData.avgRate}%  
              </span>  
            </div>  
          </div>  
        </div>  
      )}  
  
      <button  
        className={`confirm-btn ${canConfirm ? 'confirm-btn-active' : ''}`}  
        disabled={!canConfirm}  
        onClick={handleConfirm}  
      >  
        {isLoading ? '⏳ 데이터 불러오는 중...'  
          : canConfirm ? `✅ ${md} MD팀장으로 시작하기`  
          : '영업부서와 MD팀장을 선택해 주세요'}  
      </button>  
    </div>  
  );  
};  
  
export default SelectionScreen;  

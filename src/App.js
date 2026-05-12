import React, { useState, useEffect } from 'react';  
import SelectionScreen from './components/SelectionScreen';  
import StoreListScreen from './components/StoreListScreen';  
import StoreDetail from './components/StoreDetail';  
import './App.css';  
  
function App() {  
  const [step, setStep] = useState('loading');  
  const [meta, setMeta] = useState(null);  
  const [mdData, setMdData] = useState(null);  
  const [selection, setSelection] = useState({ org: '', md: '' });  
  const [selectedStore, setSelectedStore] = useState(null);  
  const [isLoadingMd, setIsLoadingMd] = useState(false);  
  const [error, setError] = useState('');  
  
  // meta.json 로드  
  useEffect(() => {  
    const load = async () => {  
      try {  
        const res = await fetch(`/data/meta.json?t=${Date.now()}`);  
        if (!res.ok) throw new Error('데이터를 불러올 수 없습니다.');  
        const data = await res.json();  
        setMeta(data);  
        setStep('select');  
      } catch (err) {  
        setError(err.message);  
        setStep('error');  
      }  
    };  
    load();  
  }, []);  
  
  // MD팀장 선택 → JSON 로드  
  const handleSelectionConfirm = async (org, md, sheetFiles) => {  
    setIsLoadingMd(true);  
    setError('');  
    setSelection({ org, md });  
    try {  
      const results = await Promise.all(  
        sheetFiles.map(async ({ sheet, fileName }) => {  
          const res = await fetch(  
            `/data/asa/${encodeURIComponent(fileName)}?t=${Date.now()}`  
          );  
          if (!res.ok) throw new Error(`${fileName} 로드 실패`);  
          return res.json();  
        })  
      );  
  
      const allStores = [];  
      const allSkus = [];  
      const sheets = [];  
      const categoriesBySheet = {};  
  
      results.forEach((data) => {  
        allStores.push(...data.stores);  
        allSkus.push(...data.skus);  
        sheets.push(data.sheet);  
        categoriesBySheet[data.sheet] = data.categories;  
      });  
  
      setMdData({ stores: allStores, skus: allSkus, sheets, categoriesBySheet });  
      setStep('storelist');  
    } catch (err) {  
      setError(err.message);  
    } finally {  
      setIsLoadingMd(false);  
    }  
  };  
  
  const handleSelectStore = (store) => {  
    setSelectedStore(store);  
    setStep('storedetail');  
  };  
  
  const handleBack = () => {  
    if (step === 'storedetail') setStep('storelist');  
    else if (step === 'storelist') {  
      setStep('select');  
      setMdData(null);  
      setSelection({ org: '', md: '' });  
    }  
  };  
  
  const headerTitle = () => {  
    if (step === 'loading')     return '📊 유통 필수취급 대시보드';  
    if (step === 'select')      return '📊 유통 필수취급 대시보드';  
    if (step === 'storelist')   return `👤 ${selection.md}`;  
    if (step === 'storedetail') return selectedStore?.name || '';  
    return '📊 유통 필수취급 대시보드';  
  };  
  
  const headerSub = () => {  
    if (step === 'storelist')   return `🏢 ${selection.org}`;  
    if (step === 'storedetail')  
      return `${selectedStore?.hq} · ${selectedStore?.org} · ${selectedStore?.team} · ${selectedStore?.rate}%`;  
    if (meta?.lastUpdate && step === 'select')  
      return `📅 ${meta.lastUpdate.date} ${meta.lastUpdate.version} 기준`;  
    return '';  
  };  
  
  return (  
    <div className="app">  
      <header className="app-header">  
        <div className="header-left">  
          {(step === 'storelist' || step === 'storedetail') && (  
            <button className="back-btn" onClick={handleBack}>←</button>  
          )}  
          <div>  
            <h1>{headerTitle()}</h1>  
            {headerSub() && <span className="file-name">{headerSub()}</span>}  
          </div>  
        </div>  
      </header>  
  
      <main className="app-main">  
        {step === 'loading' && (  
          <div className="loading-screen">  
            <div className="loading-inner">  
              <span style={{ fontSize: 56 }}>📊</span>  
              <h2>유통 필수취급 대시보드</h2>  
              <div className="spinner" style={{ margin: '20px auto 0' }} />  
              <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>불러오는 중...</p>  
            </div>  
          </div>  
        )}  
        {step === 'error' && (  
          <div className="loading-screen">  
            <div className="loading-inner">  
              <span style={{ fontSize: 48 }}>⚠️</span>  
              <h2 style={{ color: '#C62828', marginTop: 8 }}>데이터 오류</h2>  
              <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>{error}</p>  
            </div>  
          </div>  
        )}  
        {step === 'select' && meta && (  
          <SelectionScreen  
            meta={meta}  
            onConfirm={handleSelectionConfirm}  
            isLoading={isLoadingMd}  
            error={error}  
          />  
        )}  
        {step === 'storelist' && mdData && (  
          <StoreListScreen  
            stores={mdData.stores}  
            sheets={mdData.sheets}  
            org={selection.org}  
            md={selection.md}  
            onSelectStore={handleSelectStore}  
          />  
        )}  
        {step === 'storedetail' && selectedStore && mdData && (  
          <StoreDetail  
            store={selectedStore}  
            skus={mdData.skus}  
            categories={mdData.categoriesBySheet[selectedStore.sheet] || []}  
          />  
        )}  
      </main>  
    </div>  
  );  
}  
  
export default App;  

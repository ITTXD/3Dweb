import { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

let modelIdCounter = 0;

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('upload');
  const [pendingFile, setPendingFile] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [price, setPrice] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [transformMode, setTransformMode] = useState('translate');

  const [settings, setSettings] = useState({
    infill: 20,
    layerHeight: 0.20,
    wallCount: 2,
    support: false,
    quantity: 1,
    material: 'PLA',
    color: '#2C2C2C',
  });

  const fetchAbortRef = useRef(null);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const addModel = useCallback((geometry, fileName, stlFile = null) => {
    const id = ++modelIdCounter;
    const model = {
      id,
      geometry,
      fileName,
      stlFile,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    };
    setModels(prev => [...prev, model]);
    setSelectedModelId(id);
    return id;
  }, []);

  const updateModelPosition = useCallback((id, position) => {
    setModels(prev => prev.map(m =>
      m.id === id ? { ...m, position } : m
    ));
  }, []);

  const updateModelRotation = useCallback((id, rotation) => {
    setModels(prev => prev.map(m =>
      m.id === id ? { ...m, rotation } : m
    ));
  }, []);

  const updateModelGeometry = useCallback((id, geometry) => {
    setModels(prev => prev.map(m =>
      m.id === id ? { ...m, geometry, position: [0, 0, 0], rotation: [0, 0, 0] } : m
    ));
  }, []);

  const removeModel = useCallback((id) => {
    setModels(prev => prev.filter(m => m.id !== id));
    setSelectedModelId(prev => (prev === id ? null : prev));
  }, []);

  const clearModels = useCallback(() => {
    setModels([]);
    setSelectedModelId(null);
  }, []);

  const fetchPrice = useCallback(async (volume, currentSettings) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume, settings: currentSettings }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Estimate failed');
      const data = await res.json();
      setPrice(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Price fetch error:', err);
      }
    }
  }, []);

  const reset = useCallback(() => {
    fetchAbortRef.current?.abort();
    setScreen('upload');
    setPendingFile(null);
    setModels([]);
    setSelectedModelId(null);
    setPrice(null);
    setDrawerOpen(false);
    setShowOrderForm(false);
    setOrderSuccess(false);
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      pendingFile, setPendingFile,
      models, addModel, updateModelPosition, updateModelRotation, updateModelGeometry, removeModel, clearModels,
      selectedModelId, setSelectedModelId,
      settings, updateSetting,
      drawerOpen, setDrawerOpen,
      showOrderForm, setShowOrderForm,
      orderSuccess, setOrderSuccess,
      price, setPrice,
      autoRotate, setAutoRotate,
      wireframe, setWireframe,
      transformMode, setTransformMode,
      fetchPrice,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

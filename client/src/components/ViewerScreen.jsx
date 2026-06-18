import { useEffect, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { useApp } from '../context/AppContext';
import Viewer3D from './Viewer3D';
import { autoOrient } from '../utils/autoOrient';
import { arrangeModels, getPlateSize } from '../utils/autoArrange';
import { computeVolume } from '../utils/volume';
import { loadStlFile } from '../utils/stlLoader';

function getModelDimensions(geo) {
  geo.computeBoundingBox();
  const size = new THREE.Vector3();
  geo.boundingBox.getSize(size);
  return { x: size.x.toFixed(1), y: size.y.toFixed(1), z: size.z.toFixed(1) };
}

function orientFaceDown(geometry, localNormal) {
  const normal = localNormal.clone().normalize();
  const target = new THREE.Vector3(0, -1, 0);
  if (normal.dot(target) > 0.999) {
    geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    geometry.boundingBox.getCenter(c);
    geometry.translate(-c.x, 0, -c.z);
    geometry.computeBoundingBox();
    geometry.translate(0, -geometry.boundingBox.min.y, 0);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    return geometry;
  }
  const quat = new THREE.Quaternion().setFromUnitVectors(normal, target);
  const pos = geometry.attributes.position;
  const vec = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    vec.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    vec.applyQuaternion(quat);
    pos.setXYZ(i, vec.x, vec.y, vec.z);
  }
  pos.needsUpdate = true;
  geometry.computeBoundingBox();
  const c = new THREE.Vector3();
  geometry.boundingBox.getCenter(c);
  geometry.translate(-c.x, 0, -c.z);
  geometry.computeBoundingBox();
  geometry.translate(0, -geometry.boundingBox.min.y, 0);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export default function ViewerScreen() {
  const {
    pendingFile, setPendingFile,
    reset, addModel, models,
    updateModelPosition, updateModelGeometry, removeModel,
    settings, setDrawerOpen, fetchPrice,
    autoRotate, setAutoRotate, wireframe, setWireframe,
    transformMode, setTransformMode,
    selectedModelId, setSelectedModelId,
  } = useApp();

  const [totalVolume, setTotalVolume] = useState(0);
  const [totalTriangles, setTotalTriangles] = useState(0);
  const fileInputRef = useRef(null);
  const faceClickFnRef = useRef(null);

  faceClickFnRef.current = (localNormal, modelId) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    const newGeo = orientFaceDown(model.geometry.clone(), localNormal);
    updateModelGeometry(modelId, newGeo);
  };
  const onFaceClick = useCallback((...args) => faceClickFnRef.current(...args), []);

  const importStlFile = useCallback(async (file) => {
    if (!file?.name?.toLowerCase().endsWith('.stl')) return;
    const geometry = await loadStlFile(file);
    addModel(geometry, file.name, file);
  }, [addModel]);

  useEffect(() => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    importStlFile(file).catch(console.error);
  }, [pendingFile, setPendingFile, importStlFile]);

  useEffect(() => {
    let vol = 0;
    let tris = 0;
    for (const m of models) {
      vol += computeVolume(m.geometry);
      tris += m.geometry.attributes.position.count / 3;
    }
    setTotalVolume(vol);
    setTotalTriangles(tris);

    if (vol <= 0) return undefined;
    const timer = setTimeout(() => {
      fetchPrice(vol * settings.quantity, settings);
    }, 300);
    return () => clearTimeout(timer);
  }, [models, settings, fetchPrice]);

  const handleAutoArrange = () => {
    const arranged = arrangeModels(models);
    for (const { id, position } of arranged) {
      updateModelPosition(id, [position.x, 0, position.z]);
    }
  };

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (f) {
      try {
        await importStlFile(f);
      } catch (err) {
        console.error(err);
      }
    }
    e.target.value = '';
  };

  const handleDeleteSelected = () => {
    if (selectedModelId) {
      removeModel(selectedModelId);
    }
  };

  const handleReorient = (id) => {
    const model = models.find(m => m.id === id);
    if (!model) return;
    const newGeo = autoOrient(model.geometry.clone());
    updateModelGeometry(id, newGeo);
  };

  const handleSettingsClick = () => {
    setDrawerOpen(true);
  };

  const selectedModel = models.find(m => m.id === selectedModelId);
  const selectedDims = selectedModel ? getModelDimensions(selectedModel.geometry) : null;

  return (
    <div className="screen viewer-screen">
      <div className="top-bar">
        <div className="top-bar-left">
          <button className="icon-btn" onClick={reset} title="กลับ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="file-badge">
            <span className="file-badge-icon">📦</span>
            <span className="file-badge-name">{models.length} model{models.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="top-bar-center">
          <span className="logo-sm">3D<span className="text-red">Print</span></span>
        </div>
        <div className="top-bar-right">
          <button
            className="icon-btn"
            onClick={() => {
              document.documentElement.classList.toggle('dark');
              localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            }}
            title="สลับโหมดมืด/สว่าง"
          >
            {document.documentElement.classList.contains('dark') ? (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                <circle cx="12" cy="12" r="5" fill="#E8A87C" stroke="#E8A87C" />
                <line x1="12" y1="1" x2="12" y2="3" stroke="#E8A87C" />
                <line x1="12" y1="21" x2="12" y2="23" stroke="#E8A87C" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#E8A87C" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#E8A87C" />
                <line x1="1" y1="12" x2="3" y2="12" stroke="#E8A87C" />
                <line x1="21" y1="12" x2="23" y2="12" stroke="#E8A87C" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#E8A87C" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#E8A87C" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#7BA7C9" stroke="#7BA7C9" />
              </svg>
            )}
          </button>
          <button className="icon-btn" onClick={handleAddMore} title="เพิ่ม model">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          {models.length > 1 && (
            <button className="icon-btn" onClick={handleAutoArrange} title="จัดเรียงอัตโนมัติ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
          )}
          <button
            className={`icon-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'หยุดหมุน' : 'หมุนอัตโนมัติ'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
          <button
            className={`icon-btn ${wireframe ? 'active' : ''}`}
            onClick={() => setWireframe(!wireframe)}
            title={wireframe ? 'โหมดทึบ' : 'โหมดโครงร่าง'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      <Viewer3D onFaceClick={onFaceClick} />

      <div className="plate-info">
        Build Plate: {getPlateSize()} × {getPlateSize()} mm
      </div>

      <div className="transform-toolbar">
        <button
          className={`transform-btn ${transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => setTransformMode('translate')}
          title="เลื่อน"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        </button>
        <button
          className={`transform-btn ${transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => setTransformMode('rotate')}
          title="หมุน"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
        </button>
        <button
          className={`transform-btn ${transformMode === 'scale' ? 'active' : ''}`}
          onClick={() => setTransformMode('scale')}
          title="ปรับขนาด"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      {selectedModel && (
        <div className="model-info-panel">
          <div className="model-info-header">
            <span className="model-info-name">{selectedModel.fileName}</span>
            <button className="model-delete-btn" onClick={handleDeleteSelected} title="ลบ model">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
          {selectedDims && (
            <div className="model-info-dims">
              {selectedDims.x} × {selectedDims.z} × {selectedDims.y} mm
            </div>
          )}
          <button
            className="model-reorient-btn"
            onClick={() => handleReorient(selectedModel.id)}
            title="วางด้านที่ดีที่สุดลงเพลท"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            วางด้านที่ดีที่สุด
          </button>
        </div>
      )}

      <div className="viewer-stats">
        <span>△ {totalTriangles.toLocaleString()}</span>
        <span>📐 {totalVolume.toFixed(2)} cm³</span>
      </div>

      <button className="settings-fab" onClick={handleSettingsClick}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="22" height="22">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span>ตั้งค่า & ราคา</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".stl"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}

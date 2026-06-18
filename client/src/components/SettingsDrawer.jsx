import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { subscribeMaterials } from '../firebase/db';
import { MATERIAL_OPTIONS, FALLBACK_COLORS } from '../constants/materials';

export default function SettingsDrawer() {
  const { drawerOpen, setDrawerOpen, settings, updateSetting, price, models, setShowOrderForm } = useApp();
  const [dbColors, setDbColors] = useState([]);

  useEffect(() => {
    const unsub = subscribeMaterials((items) => {
      setDbColors(items);
    });
    return unsub;
  }, []);

  const filteredColors = dbColors.filter(c => c.material === settings.material);
  const COLORS = filteredColors.length > 0
    ? filteredColors.map(c => ({ id: c.id, value: c.hex, name: c.name, available: c.available }))
    : FALLBACK_COLORS.map((c, i) => ({ id: `fallback-${i}`, ...c, available: true }));

  return (
    <>
      <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">⚙️ ตั้งค่าการปริ้น</h2>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* Infill */}
          <div className="setting-group">
            <label className="setting-label">
              Infill (ความหนาแน่นภายใน)
              <span className="setting-value">{settings.infill}%</span>
            </label>
            <div className="infill-options">
              {[5, 10, 20, 40, 60, 80, 100].map(v => (
                <button
                  key={v}
                  className={`opt-btn ${settings.infill === v ? 'active' : ''}`}
                  onClick={() => updateSetting('infill', v)}
                >{v}%</button>
              ))}
            </div>
            <div className="infill-bar">
              <div className="infill-fill" style={{ width: `${settings.infill}%` }} />
            </div>
          </div>

          {/* Layer Height */}
          <div className="setting-group">
            <label className="setting-label">
              Layer Height (ความสูงชั้น)
              <span className="setting-value">{settings.layerHeight.toFixed(2)} mm</span>
            </label>
            <div className="layer-options">
              {[
                { v: 0.10, top: 'Ultra Fine', bot: '0.10mm' },
                { v: 0.15, top: 'Fine', bot: '0.15mm' },
                { v: 0.20, top: 'Standard', bot: '0.20mm' },
                { v: 0.25, top: 'Fast', bot: '0.25mm' },
                { v: 0.30, top: 'Draft', bot: '0.30mm' },
              ].map(o => (
                <button
                  key={o.v}
                  className={`opt-btn-col ${settings.layerHeight === o.v ? 'active' : ''}`}
                  onClick={() => updateSetting('layerHeight', o.v)}
                >
                  <span className="opt-top">{o.top}</span>
                  <span className="opt-bot">{o.bot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wall Count */}
          <div className="setting-group">
            <label className="setting-label">
              Wall Count (จำนวนผนัง)
              <span className="setting-value">{settings.wallCount}</span>
            </label>
            <div className="wall-options">
              {[
                { v: 2, big: '2', bot: 'มาตรฐาน' },
                { v: 3, big: '3', bot: 'แข็งแรง' },
                { v: 4, big: '4', bot: 'แข็งแรงมาก' },
              ].map(o => (
                <button
                  key={o.v}
                  className={`opt-btn-col ${settings.wallCount === o.v ? 'active' : ''}`}
                  onClick={() => updateSetting('wallCount', o.v)}
                >
                  <span className="opt-big">{o.big}</span>
                  <span className="opt-bot">{o.bot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="setting-group">
            <label className="setting-label">Support (ฐานรองรับ)</label>
            <div className="toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.support}
                  onChange={(e) => updateSetting('support', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="toggle-label">{settings.support ? 'เปิด' : 'ปิด'}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="setting-group">
            <label className="setting-label">
              จำนวนชิ้น
              <span className="setting-value">{settings.quantity} ชิ้น</span>
            </label>
            <div className="qty-row">
              <button className="qty-btn" onClick={() => updateSetting('quantity', Math.max(1, settings.quantity - 1))}>−</button>
              <span className="qty-value">{settings.quantity}</span>
              <button className="qty-btn" onClick={() => updateSetting('quantity', Math.min(100, settings.quantity + 1))}>+</button>
            </div>
          </div>

          <hr className="setting-divider" />

          {/* Material */}
          <div className="setting-group">
            <label className="setting-label">
              Material (วัสดุ)
              <span className="setting-value">{settings.material}</span>
            </label>
            <div className="material-options">
              {MATERIAL_OPTIONS.map(m => (
                <button
                  key={m.value}
                  className={`mat-btn ${settings.material === m.value ? 'active' : ''}`}
                  onClick={() => updateSetting('material', m.value)}
                >
                  <span className="mat-name">{m.name}</span>
                  <span className="mat-desc">{m.desc}</span>
                  <span className="mat-price">{m.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="setting-group">
            <label className="setting-label">
              Color (สี)
              <span className="setting-value">
                {COLORS.find(c => c.value === settings.color)?.name || 'แดง'}
              </span>
            </label>
            <div className="color-options">
              {COLORS.map(c => (
                <button
                  key={c.id || c.value}
                  className={`color-swatch ${settings.color === c.value ? 'active' : ''} ${c.available === false ? 'oos' : ''}`}
                  style={{ '--sw': c.value }}
                  title={c.available !== false ? c.name : `${c.name} (หมด)`}
                  disabled={c.available === false}
                  onClick={() => updateSetting('color', c.value)}
                >
                  {c.available === false && <span className="swatch-oos">หมด</span>}
                </button>
              ))}
            </div>
          </div>

          <hr className="setting-divider" />

          {/* Price */}
          <div className="price-section">
            <h3 className="price-title">💰 ราคาประเมิน</h3>
            {settings.quantity > 1 && (
              <div className="price-qty-badge">
                {settings.quantity} ชิ้น × {price ? `฿ ${(parseFloat(price.total) / settings.quantity).toFixed(2)}` : '—'}/ชิ้น
              </div>
            )}
            <div className="price-grid">
              <div className="price-row">
                <span>ปริมาตรทั้งหมด</span>
                <span>{price ? `${price.volume} cm³` : '— cm³'}</span>
              </div>
              <div className="price-row">
                <span>น้ำหนักวัสดุ</span>
                <span>{price ? `${price.weight} g` : '— g'}</span>
              </div>
              <div className="price-row">
                <span>เวลาปริ้น</span>
                <span>{price?.printTime || '—'}</span>
              </div>
              <div className="price-row">
                <span>ค่าวัสดุ</span>
                <span>{price ? `฿ ${price.materialCost}` : '฿ —'}</span>
              </div>
              <div className="price-row">
                <span>ค่าแรงงาน</span>
                <span>{price ? `฿ ${price.laborCost}` : '฿ —'}</span>
              </div>
              <div className="price-row">
                <span>ค่าเครื่อง</span>
                <span>{price ? `฿ ${price.machineCost}` : '฿ —'}</span>
              </div>
              <div className="price-row">
                <span>ค่าดำเนินการ</span>
                <span>{price ? `฿ ${price.overhead}` : '฿ —'}</span>
              </div>
              <div className="price-row">
                <span>ค่าจัดส่ง</span>
                <span>{price ? `฿ ${price.shipping}` : '฿ —'}</span>
              </div>
            </div>
            <div className="price-total-box">
              <span>รวมทั้งหมด {settings.quantity > 1 ? `(${settings.quantity} ชิ้น)` : ''}</span>
              <span className="price-total">{price ? `฿ ${price.total}` : '฿ —'}</span>
            </div>
            <p className="price-note">* ราคาประเมินเบื้องต้น อาจมีการเปลี่ยนแปลง</p>
            {models.length > 0 && price && (
              <button
                className="btn btn-primary btn-order"
                onClick={() => { setDrawerOpen(false); setShowOrderForm(true); }}
              >
                ส่งคำสั่งพิมพ์
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

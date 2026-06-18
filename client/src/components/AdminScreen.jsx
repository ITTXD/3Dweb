import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeMaterials, addMaterial, updateMaterial, deleteMaterial } from '../firebase/db';
import { deleteOrder } from '../firebase/db';

const ADMIN_USERNAME = 'fotokuki';
const ADMIN_PASSWORD = '1234';
const ADMIN_SESSION_KEY = 'fotokuki_admin_session';

function formatDate(value) {
  if (!value?.toDate) return '-';
  const date = value.toDate();
  return date.toLocaleString('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value) {
  const num = Number(value || 0);
  return `฿${num.toFixed(2)}`;
}

function normalizeOrder(order) {
  return {
    customerName: order.customer?.name || order.customerName || '-',
    customerPhone: order.customer?.phone || order.customerPhone || '-',
    customerAddress: order.customer?.address || order.customerAddress || '-',
    customerNotes: order.customer?.notes || order.customerNotes || '',
    fileName: order.model?.fileName || order.fileName || '-',
    fileURL: order.model?.fileURL || order.fileURL || '',
    fileURLs: order.model?.fileURLs || (order.model?.fileURL ? [order.model.fileURL] : []),
    modelCount: order.model?.count || order.modelCount || 1,
    modelVolume: order.model?.volume || order.modelVolume || '0',
    material: order.settings?.material || '-',
    color: order.settings?.color || '-',
    quantity: order.settings?.quantity || 1,
    infill: order.settings?.infill ?? '-',
    layerHeight: order.settings?.layerHeight ?? '-',
    support: order.settings?.support ? 'มี' : 'ไม่มี',
    total: order.pricing?.total || order.price || 0,
    printTime: order.pricing?.printTime || order.printTime || '-',
    status: order.status || 'pending',
    assignee: order.assignee || '',
    createdAt: order.createdAt,
    modelThumbnail: order.model?.thumbnail || order.modelThumbnail || '',
    trackingCarrier: order.trackingCarrier || '',
    trackingNumber: order.trackingNumber || '',
  };
}

const STATUS_MAP = {
  pending: { label: 'รอตรวจสอบ', color: '#ffb703' },
  printing: { label: 'กำลังพิมพ์', color: '#76c6ff' },
  completed: { label: 'เสร็จแล้ว', color: '#52d29b' },
};

/* ─── Detail Modal ─── */
function OrderDetailModal({ order, onClose, onStatusChange, onAssigneeChange, onUpdateTracking, onDelete }) {
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [savingTrack, setSavingTrack] = useState(false);

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) return;
    setSavingTrack(true);
    await onUpdateTracking(order.id, trackingCarrier, trackingNumber.trim());
    setSavingTrack(false);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <div className="admin-order-id">ออเดอร์ ID: {order.id.toUpperCase()}</div>
            <h2 className="admin-modal-title">รายละเอียดข้อมูลงาน</h2>
          </div>
          <button className="admin-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="admin-modal-body">
          {/* Status Dropdown */}
          <div className="admin-modal-status-section">
            <span className="admin-order-label">อัปเดตสถานะการปริ้น</span>
            <select
              className="admin-status-select"
              value={order.status}
              onChange={(event) => onStatusChange(order.id, event.target.value)}
            >
              <option value="pending">รอตรวจสอบ</option>
              <option value="printing">กำลังพิมพ์</option>
              <option value="completed">เสร็จแล้ว</option>
            </select>
          </div>

          {/* Assignee Dropdown */}
          <div className="admin-modal-status-section">
            <span className="admin-order-label">ผู้รับงาน</span>
            <select
              className="admin-status-select"
              value={order.assignee || ''}
              onChange={(event) => onAssigneeChange(order.id, event.target.value)}
            >
              <option value="">ยังไม่ระบุ</option>
              <option value="ภูมิ">ภูมิ</option>
              <option value="โฟโต้">โฟโต้</option>
              <option value="อิด">อิด</option>
            </select>
          </div>

          {/* Tracking Number Section */}
          <div className="admin-modal-tracking-section">
            <span className="admin-order-label">เลขพัสดุ (Shipping Tracking)</span>
            <div className="tracking-input-row">
              <select
                className="admin-tracking-select"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
              >
                <option value="">เลือกขนส่ง</option>
                <option value="Flash Express">Flash Express</option>
                <option value="Kerry Express">Kerry Express</option>
                <option value="Thailand Post">ไปรษณีย์ไทย</option>
                <option value="J&T Express">J&T Express</option>
                <option value="DHL">DHL</option>
                <option value="Nim Express">Nim Express</option>
                <option value="Alpha Fast">Alpha Fast</option>
                <option value="其他">อื่นๆ</option>
              </select>
              <input
                type="text"
                className="admin-tracking-input"
                placeholder="กรอกเลขพัสดุ"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <button
                className="admin-tracking-save"
                onClick={handleSaveTracking}
                disabled={savingTrack || !trackingNumber.trim()}
              >
                {savingTrack ? '...' : 'บันทึก'}
              </button>
            </div>
            {order.trackingNumber && (
              <div className="tracking-current">
                ปัจจุบัน: <strong>{order.trackingCarrier}</strong> — <span className="tracking-num">{order.trackingNumber}</span>
              </div>
            )}
          </div>

          <div className="admin-modal-grid">
            {/* Customer Section */}
            <div className="admin-modal-block">
              <h3 className="admin-block-title">👤 ข้อมูลผู้สั่งซื้อ</h3>
              <div className="admin-info-row">
                <span className="info-label">ชื่อลูกค้า:</span>
                <span className="info-val font-semibold">{order.customerName}</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">เบอร์โทรศัพท์:</span>
                <span className="info-val">
                  <a href={`tel:${order.customerPhone}`} className="phone-link">{order.customerPhone}</a>
                </span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">ที่อยู่จัดส่ง:</span>
                <span className="info-val">{order.customerAddress}</span>
              </div>
              {order.customerNotes && (
                <div className="admin-info-row">
                  <span className="info-label">หมายเหตุ:</span>
                  <span className="info-val note-val">{order.customerNotes}</span>
                </div>
              )}
            </div>

            {/* Model & Print Settings Section */}
            <div className="admin-modal-block">
              <h3 className="admin-block-title">📦 รายละเอียดงานและตัวเลือกพิมพ์</h3>
              {order.modelThumbnail && (
                <div className="admin-modal-thumbnail-wrapper">
                  <img src={order.modelThumbnail} alt="3D Model Preview" className="admin-modal-thumbnail" />
                </div>
              )}
              <div className="admin-info-row">
                <span className="info-label">ชื่อไฟล์งาน:</span>
                <span className="info-val filename-val">{order.fileName}</span>
              </div>
              {order.fileURLs?.length > 0 ? (
                <div className="admin-info-row">
                  <span className="info-label">ดาวน์โหลด STL:</span>
                  <span className="info-val admin-download-list">
                    {order.fileURLs.map((url, index) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-download-btn"
                      >
                        ไฟล์ {index + 1}
                      </a>
                    ))}
                  </span>
                </div>
              ) : order.fileURL && (
                <div className="admin-info-row">
                  <span className="info-label">ดาวน์โหลด STL:</span>
                  <span className="info-val">
                    <a
                      href={order.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-download-btn"
                    >
                      คลิกเพื่อดาวน์โหลด
                    </a>
                  </span>
                </div>
              )}
              <div className="admin-info-row">
                <span className="info-label">ปริมาตรโมเดล:</span>
                <span className="info-val">{order.modelVolume} cm³</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">จำนวนไฟล์:</span>
                <span className="info-val">{order.modelCount} ไฟล์</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">วัสดุที่เลือก:</span>
                <span className="info-val font-semibold">{order.material}</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">สีที่เลือก:</span>
                <span className="info-val flex-center gap-6">
                  <span className="color-indicator" style={{ backgroundColor: order.color }} />
                  {order.color}
                </span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">จำนวนพิมพ์ (Qty):</span>
                <span className="info-val font-bold text-red">{order.quantity} ชิ้น</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Infill (ความหนาแน่น):</span>
                <span className="info-val">{order.infill}%</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">ความสูงชั้น (Layer):</span>
                <span className="info-val">{order.layerHeight} mm</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">ตัวประคอง (Support):</span>
                <span className="info-val">{order.support}</span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="admin-modal-block full-width">
              <h3 className="admin-block-title">💰 สรุปราคาและเวลาพิมพ์</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-item">
                  <span className="price-item-lbl">เวลาปริ้นโดยประมาณ</span>
                  <span className="price-item-val highlight">{order.printTime}</span>
                </div>
                <div className="admin-pricing-item">
                  <span className="price-item-lbl">ราคารวมประเมิน</span>
                  <span className="price-item-val highlight text-red">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="admin-delete-btn-footer" onClick={() => onDelete(order.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            ลบออเดอร์
          </button>
          <button className="admin-close-btn-footer" onClick={onClose}>ปิดหน้าต่างนี้</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Materials Tab ─── */
const DEFAULT_COLORS = [
  { name: 'ขาว', hex: '#f1faee', material: 'PLA' },
  { name: 'ดำ', hex: '#1a1a1a', material: 'PLA' },
  { name: 'น้ำเงิน', hex: '#457b9d', material: 'PLA' },
  { name: 'เขียว', hex: '#2d6a4f', material: 'PLA' },
  { name: 'เหลือง', hex: '#ffb703', material: 'PLA' },
  { name: 'ส้ม', hex: '#fb8500', material: 'PLA' },
  { name: 'เทา', hex: '#6c757d', material: 'PLA' },
];

function MaterialsTab({ materials, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHex, setFormHex] = useState('#ffffff');
  const [formMaterial, setFormMaterial] = useState('PLA');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = {};
    for (const m of materials) {
      const key = m.material || 'อื่นๆ';
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return Object.entries(map);
  }, [materials]);

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name: formName.trim(), hex: formHex, material: formMaterial, available: true });
      setFormName('');
      setFormHex('#ffffff');
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, current) => {
    await onUpdate(id, { available: !current });
  };

  const handleDelete = async (id) => {
    if (confirm('ลบสีนี้?')) await onDelete(id);
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      for (const c of DEFAULT_COLORS) {
        await onAdd({ ...c, available: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="materials-tab">
      <div className="materials-header">
        <h2 className="materials-title">จัดการวัสดุและสี</h2>
        <div className="materials-actions">
          {materials.length === 0 && (
            <button className="admin-primary-btn" onClick={handleSeed} disabled={saving} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}>
              {saving ? 'กำลังเพิ่ม...' : 'เพิ่มสีเริ่มต้น'}
            </button>
          )}
          <button className="admin-primary-btn" onClick={() => setShowForm(!showForm)} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}>
            {showForm ? 'ยกเลิก' : '+ เพิ่มสีใหม่'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="material-add-form">
          <div className="material-form-row">
            <label>
              <span>ชื่อสี</span>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="เช่น ขาว, ชมพู" />
            </label>
            <label>
              <span>รหัสสี</span>
              <div className="hex-input-row">
                <input type="color" value={formHex} onChange={e => setFormHex(e.target.value)} className="hex-picker" />
                <input type="text" value={formHex} onChange={e => setFormHex(e.target.value)} placeholder="#ffffff" className="hex-text" />
              </div>
            </label>
            <label>
              <span>วัสดุ</span>
              <select value={formMaterial} onChange={e => setFormMaterial(e.target.value)}>
                <option value="PLA">PLA</option>
                <option value="ABS">ABS</option>
                <option value="ASA">ASA</option>
                <option value="PETG">PETG</option>
                <option value="TPU">TPU</option>
                <option value="Nylon">Nylon</option>
              </select>
            </label>
            <button className="admin-primary-btn" onClick={handleAdd} disabled={saving || !formName.trim()} style={{ width: 'auto', padding: '8px 20px', fontSize: '0.82rem', alignSelf: 'flex-end' }}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="admin-empty-state">
          <div className="empty-icon">🎨</div>
          <h3>ยังไม่มีสีในระบบ</h3>
          <p>กด &quot;เพิ่มสีเริ่มต้น&quot; หรือ &quot;+ เพิ่มสีใหม่&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        grouped.map(([matName, items]) => (
          <div className="material-group" key={matName}>
            <div className="material-group-header">
              <span className="material-group-name">{matName}</span>
              <span className="material-group-count">{items.length} สี</span>
            </div>
            <div className="material-grid">
              {items.map(m => (
                <div className={`material-card ${!m.available ? 'out-of-stock' : ''}`} key={m.id}>
                  <div className="material-card-color" style={{ background: m.hex }}>
                    {!m.available && <span className="oos-badge">หมด</span>}
                  </div>
                  <div className="material-card-info">
                    <span className="material-card-name">{m.name}</span>
                    <span className="material-card-hex">{m.hex}</span>
                  </div>
                  <div className="material-card-actions">
                    <button
                      className={`toggle-available ${m.available ? 'on' : ''}`}
                      onClick={() => handleToggle(m.id, m.available)}
                      title={m.available ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                    >
                      {m.available ? 'ใช้ได้' : 'หมด'}
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(m.id)} title="ลบ">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Main Admin Component ─── */
export default function AdminScreen() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  useEffect(() => {
    const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
    setIsLoggedIn(session === 'true');
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setOrders([]);
      return undefined;
    }

    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const nextOrders = snapshot.docs.map((item) => ({
        id: item.id,
        ...normalizeOrder(item.data()),
      }));
      setOrders(nextOrders);
    });

    return unsubscribe;
  }, [isLoggedIn]);

  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMaterials([]);
      return undefined;
    }
    return subscribeMaterials(setMaterials);
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    const summary = {
      total: orders.length,
      pending: 0,
      printing: 0,
      completed: 0,
      revenue: 0,
    };

    for (const order of orders) {
      if (order.status === 'printing') summary.printing += 1;
      else if (order.status === 'completed') summary.completed += 1;
      else summary.pending += 1;
      summary.revenue += Number(order.total || 0);
    }

    return summary;
  }, [orders]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        throw new Error('INVALID_CREDENTIALS');
      }
      window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsLoggedIn(true);
      setPassword('');
      setUsername('');
    } catch (error) {
      console.error(error);
      setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsLoggedIn(false);
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      setSelectedOrder((prev) => {
        if (prev && prev.id === orderId) {
          return { ...prev, status };
        }
        return prev;
      });
    } catch (error) {
      console.error(error);
      alert('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  const handleAssigneeChange = async (orderId, assignee) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { assignee });
      setSelectedOrder((prev) => {
        if (prev && prev.id === orderId) {
          return { ...prev, assignee };
        }
        return prev;
      });
    } catch (error) {
      console.error(error);
      alert('อัปเดตผู้รับงานไม่สำเร็จ');
    }
  };

  const handleUpdateTracking = async (orderId, carrier, number) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        trackingCarrier: carrier,
        trackingNumber: number,
      });
      setSelectedOrder((prev) => {
        if (prev && prev.id === orderId) {
          return { ...prev, trackingCarrier: carrier, trackingNumber: number };
        }
        return prev;
      });
    } catch (error) {
      console.error(error);
      alert('บันทึกเลขพัสดุไม่สำเร็จ');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('ลบออเดอร์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return;
    try {
      await deleteOrder(orderId);
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
      alert('ลบออเดอร์ไม่สำเร็จ');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesMaterial = materialFilter === 'all' || order.material === materialFilter;
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesMaterial && matchesSearch;
    });
  }, [orders, statusFilter, materialFilter, searchTerm]);

  const availableMaterials = useMemo(() => {
    const set = new Set();
    for (const o of orders) {
      if (o.material && o.material !== '-') set.add(o.material);
    }
    return Array.from(set).sort();
  }, [orders]);

  const groupedOrders = useMemo(() => {
    const groups = {};
    for (const order of filteredOrders) {
      let dateKey = 'ไม่ทราบวันที่';
      if (order.createdAt?.toDate) {
        const d = order.createdAt.toDate();
        dateKey = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      } else if (order.createdAt) {
        const d = new Date(order.createdAt);
        if (!isNaN(d.getTime())) {
          dateKey = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    }
    return Object.entries(groups);
  }, [filteredOrders]);

  /* ─── Auth Loading ─── */
  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-bg-grid" />
        <div className="admin-auth-shell">
          <div className="admin-auth-card">
            <div className="admin-spinner" />
            <p className="admin-auth-help">กำลังโหลดหน้าแอดมิน...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Login Screen ─── */
  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-bg-grid" />
        <div className="admin-auth-shell">
          <form className="admin-auth-card" onSubmit={handleLogin}>
            <div className="admin-auth-badge">Admin Mode</div>
            <h1 className="admin-auth-title">เข้าสู่ระบบหลังบ้าน</h1>
            <p className="admin-auth-help">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าถึงระบบสรุปออเดอร์</p>

            <label className="admin-field">
              <span>ชื่อผู้ใช้</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="fotokuki"
                autoComplete="username"
              />
            </label>

            <label className="admin-field">
              <span>รหัสผ่าน</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
              />
            </label>

            {loginError && <p className="admin-login-error">{loginError}</p>}

            <button className="admin-primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าใช้งานหลังบ้าน'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── Dashboard ─── */
  return (
    <div className="admin-page">
      <div className="admin-bg-grid" />

      {/* ── Navbar ── */}
      <nav className="admin-navbar">
        <div className="admin-navbar-container">
          <div className="admin-navbar-logo">
            <span className="logo-icon-sm">📦</span>
            <span className="logo-text">P3D <span className="logo-highlight">Admin</span></span>
          </div>

          <div className="admin-navbar-tabs">
            <button
              className={`navbar-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              ออเดอร์
            </button>
            <button
              className={`navbar-tab ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
              วัสดุ
            </button>
          </div>

          <div className="admin-navbar-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, ไฟล์งาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-navbar-right">
            <button className="theme-toggle" onClick={toggleDark} title={darkMode ? 'โหมดสว่าง' : 'โหมดมืด'} style={{ marginRight: '16px' }}>
              {darkMode ? (
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
            <div className="admin-user-chip">
              <span className="user-dot" />
              {ADMIN_USERNAME}
            </div>
            <button className="admin-logout-btn" onClick={handleLogout} title="ออกจากระบบ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              ออก
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="admin-main-content">
        {activeTab === 'orders' ? (
          <>
            {/* Mini stat pills */}
            <div className="admin-stat-pills">
              <div className="stat-pill">
                <span className="stat-pill-dot" style={{ background: '#fff' }} />
                <span>ทั้งหมด</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-dot" style={{ background: '#ffb703' }} />
                <span>รอตรวจสอบ</span>
                <strong>{stats.pending}</strong>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-dot" style={{ background: '#76c6ff' }} />
                <span>กำลังพิมพ์</span>
                <strong>{stats.printing}</strong>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-dot" style={{ background: '#52d29b' }} />
                <span>เสร็จแล้ว</span>
                <strong>{stats.completed}</strong>
              </div>
              <div className="stat-pill stat-pill-revenue">
                <span>💰</span>
                <strong>{formatPrice(stats.revenue)}</strong>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="admin-filter-row">
              <div className="admin-filter-bar">
                {['all', 'pending', 'printing', 'completed'].map((key) => (
                  <button
                    key={key}
                    className={`ftab ${statusFilter === key ? 'active' : ''} ${key !== 'all' ? `ftab-${key}` : ''}`}
                    onClick={() => setStatusFilter(key)}
                  >
                    {key === 'all' ? 'ทั้งหมด' : STATUS_MAP[key].label}
                  </button>
                ))}
              </div>
              {availableMaterials.length > 0 && (
                <div className="admin-filter-bar">
                  <button
                    className={`ftab ftab-material ${materialFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMaterialFilter('all')}
                  >
                    ทุกวัสดุ
                  </button>
                  {availableMaterials.map((mat) => (
                    <button
                      key={mat}
                      className={`ftab ftab-material ${materialFilter === mat ? 'active' : ''}`}
                      onClick={() => setMaterialFilter(mat)}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Task Card Grid */}
            {filteredOrders.length === 0 ? (
              <div className="admin-empty-state">
                <div className="empty-icon">📂</div>
                <h3>ไม่พบรายการงาน</h3>
                <p>ไม่มีงานที่ตรงกับเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="task-groups">
                {groupedOrders.map(([dateLabel, dateOrders]) => (
                  <div className="task-group" key={dateLabel}>
                    <div className="task-group-header">
                      <span className="task-group-date">{dateLabel}</span>
                      <span className="task-group-count">{dateOrders.length} งาน</span>
                    </div>
                    <div className="task-list">
                      {dateOrders.map((order) => {
                        const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                        return (
                          <div
                            className="task-card"
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="task-card-top">
                              <div className="task-card-thumb">
                                {order.modelThumbnail ? (
                                  <img src={order.modelThumbnail} alt="" />
                                ) : (
                                  <span className="task-card-thumb-ph">📦</span>
                                )}
                              </div>
                              <div className="task-card-info">
                                <span className="task-card-file" title={order.fileName}>{order.fileName}</span>
                                <span className="task-card-customer">{order.customerName}</span>
                                <span className="task-card-date">{formatDate(order.createdAt)}</span>
                              </div>
                              <span className="task-card-status-dot" style={{ background: st.color }} />
                            </div>

                            <div className="task-card-bottom">
                              <span className="task-card-price">{formatPrice(order.total)}</span>
                              <select
                                className="task-card-select"
                                value={order.assignee || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleAssigneeChange(order.id, e.target.value)}
                              >
                                <option value="">ไม่ระบุ</option>
                                <option value="ภูมิ">ภูมิ</option>
                                <option value="โฟโต้">โฟโต้</option>
                                <option value="อิด">อิด</option>
                              </select>
                              <select
                                className="task-card-select"
                                value={order.status}
                                style={{ borderColor: st.color, color: st.color }}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              >
                                <option value="pending">รอตรวจสอบ</option>
                                <option value="printing">กำลังพิมพ์</option>
                                <option value="completed">เสร็จแล้ว</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <MaterialsTab materials={materials} onAdd={addMaterial} onUpdate={updateMaterial} onDelete={deleteMaterial} />
        )}
      </main>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onUpdateTracking={handleUpdateTracking}
          onDelete={handleDeleteOrder}
        />
      )}
    </div>
  );
}

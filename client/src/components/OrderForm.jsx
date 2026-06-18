import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { saveOrder } from '../firebase/db';

export default function OrderForm() {
  const { models, settings, price, setShowOrderForm, orderSuccess, setOrderSuccess, reset } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('กรุณากรอกชื่อ เบอร์โทร และที่อยู่');
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    setError('');

    try {
      setUploadStage('กำลังบันทึกข้อมูล...');
      const canvas = document.getElementById('viewer3D');
      const thumbnail = canvas ? canvas.toDataURL('image/jpeg', 0.25) : '';

      const orderData = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim(),
        },
        model: {
          fileName: models.map(m => m.fileName).join(', '),
          count: models.length,
          volume: price?.volume || '0',
          thumbnail: thumbnail,
        },
        settings: {
          infill: settings.infill,
          layerHeight: settings.layerHeight,
          wallCount: settings.wallCount,
          support: settings.support,
          quantity: settings.quantity,
          material: settings.material,
          color: settings.color,
        },
        pricing: {
          total: price?.total || '0',
          materialCost: price?.materialCost || '0',
          machineCost: price?.machineCost || '0',
          overhead: price?.overhead || '0',
          shipping: price?.shipping || '50',
          weight: price?.weight || '0',
          printTime: price?.printTime || '',
        },
      };

      const stlFiles = models.map(m => m.stlFile).filter(Boolean);
      if (stlFiles.length > 0) {
        setUploadStage('กำลังอัปโหลดไฟล์ STL...');
      }

      await saveOrder(orderData, stlFiles, (progress) => {
        setUploadProgress(progress);
        if (progress < 30) {
          setUploadStage('กำลังบันทึกข้อมูล...');
        } else if (progress < 80) {
          setUploadStage('กำลังอัปโหลดไฟล์ STL...');
        } else if (progress < 100) {
          setUploadStage('กำลังบันทึกไฟล์...');
        } else {
          setUploadStage('เสร็จสิ้น!');
        }
      });
      setOrderSuccess(true);
    } catch (err) {
      setError('ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const handleClose = () => {
    setShowOrderForm(false);
  };

  if (orderSuccess) {
    return (
      <div className="overlay-dialog">
        <div className="overlay-dialog-box order-success-box">
          <div className="overlay-dialog-icon" style={{ color: '#2d6a4f' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="40" height="40">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="overlay-dialog-title">ส่งคำสั่งพิมพ์เรียบร้อย!</h3>
          <p className="overlay-dialog-desc">
            ขอบคุณที่อุดหนุนครับ<br />
            กรุณาโอนเงินผ่าน QR ด้านล่าง
          </p>
          <div className="qrcode-wrapper">
            <img src="/qrcode.jpg" alt="QR Code สำหรับโอนเงิน" className="qrcode-img" />
          </div>
          <p className="overlay-dialog-desc" style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '8px' }}>
            หลังโอนเงินแล้ว ทางร้านจะติดต่อกลับเพื่อยืนยันคำสั่งซื้อ<br />
            รอแอดมินตรวจสอบและดำเนินการผลิตให้ครับ
          </p>
          <div className="overlay-dialog-actions">
            <button className="btn btn-primary" onClick={reset}>
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-dialog">
      <div className="overlay-dialog-box order-form-box">
        <div className="overlay-dialog-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="28" height="28">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h3 className="overlay-dialog-title">ข้อมูลสำหรับสั่งพิมพ์</h3>

        <form className="order-form" onSubmit={handleSubmit}>
          <div className="order-form-group">
            <label className="order-form-label">ชื่อ *</label>
            <input
              className="order-form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
            />
          </div>
          <div className="order-form-group">
            <label className="order-form-label">เบอร์โทร *</label>
            <input
              className="order-form-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
            />
          </div>
          <div className="order-form-group">
            <label className="order-form-label">ที่อยู่ *</label>
            <textarea
              className="order-form-input order-form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ที่อยู่สำหรับจัดส่ง"
              rows={3}
            />
          </div>
          <div className="order-form-group">
            <label className="order-form-label">โน๊ตเพิ่มเติม</label>
            <textarea
              className="order-form-input order-form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={2}
            />
          </div>

          {error && <p className="order-form-error">{error}</p>}

          <div className="order-form-summary">
            <div className="order-form-summary-row">
              <span>จำนวนชิ้น</span>
              <span>{settings.quantity} ชิ้น</span>
            </div>
            <div className="order-form-summary-row">
              <span>วัสดุ</span>
              <span>{settings.material}</span>
            </div>
            <div className="order-form-summary-row">
              <span>ราคารวม</span>
              <span className="order-form-total">฿ {price?.total || '—'}</span>
            </div>
          </div>

          <div className="overlay-dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'กำลังส่ง...' : 'ส่งคำสั่งพิมพ์'}
            </button>
          </div>

          {submitting && (
            <div className="order-progress">
              <p className="order-progress-text">{uploadStage}</p>
              <div className="order-progress-bar">
                <div className="order-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="order-progress-pct">{uploadProgress}%</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

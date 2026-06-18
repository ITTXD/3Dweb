import { useRef, useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useHeroAnimation() {
  useEffect(() => {
    const spans = document.querySelectorAll('.hero-line span');
    spans.forEach((span, i) => {
      span.style.animationDelay = `${i * 0.08}s`;
    });
  }, []);
}

function Navbar({ darkMode, toggleDark }) {
  return (
    <nav className="pf-nav">
      <div className="pf-nav-inner">
        <div className="pf-nav-logo">
          <svg viewBox="0 0 60 60" fill="none" width="28" height="28">
            <path d="M30 3L57 18V42L30 57L3 42V18L30 3Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M30 3L57 18L30 33L3 18L30 3Z" fill="currentColor" opacity="0.15" />
          </svg>
          <span>P3D <span className="logo-sub">Printing and Design</span></span>
        </div>
        <div className="pf-nav-links">
          <a href="#about">เกี่ยวกับ</a>
          <a href="#services">บริการ</a>
          <a href="#portfolio">ผลงาน</a>
          <a href="#upload">สั่งพิมพ์</a>
          <a href="/track.html" target="_blank" className="pf-nav-track">เช็คพัสดุ</a>
          <button className="theme-toggle" onClick={toggleDark} title={darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}>
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
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onStart }) {
  useHeroAnimation();

  return (
    <section className="pf-hero">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <div className="pf-hero-content">
        <div className="pf-hero-badge">
          <span className="pf-badge-dot" />
          รับพิมพ์ 3D ทุกชนิด
        </div>

        <h1 className="pf-hero-title">
          <div className="hero-line">
            {'PRECISION'.split('').map((ch, i) => <span key={i} className="hero-ch">{ch}</span>)}
          </div>
          <div className="hero-line">
            {'3D'.split('').map((ch, i) => <span key={i} className="hero-ch hero-ch-red">{ch}</span>)}
            {'  PRINT'.split('').map((ch, i) => <span key={i} className="hero-ch">{ch}</span>)}
          </div>
          <div className="hero-line">
            {'STUDIO'.split('').map((ch, i) => <span key={i} className="hero-ch">{ch}</span>)}
          </div>
        </h1>

        <p className="pf-hero-desc">
          อัปโหลดไฟล์ STL → ปรับตั้งค่า → รับราคาทันที<br />
          บริการพิมพ์ 3 มิติคุณภาพสูง ราคาเป็นธรรม
        </p>

        <div className="pf-hero-actions">
          <button className="pf-btn pf-btn-primary" onClick={onStart}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            เริ่มอัปโหลดไฟล์
          </button>
          <a href="#about" className="pf-btn pf-btn-ghost">ดูรายละเอียด</a>
        </div>

        <div className="pf-hero-stats">
          <div className="pf-stat">
            <strong>5,000+</strong>
            <span>งานพิมพ์</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <strong>50+</strong>
            <span>ลูกค้า</span>
          </div>
          <div className="pf-stat-divider" />
          <div className="pf-stat">
            <strong>24h</strong>
            <span>ส่งงาน</span>
          </div>
        </div>
        <p className="pf-hero-exp">ประสบการณ์พิมพ์มากกว่า 5,000 ชิ้น ไว้ใจได้</p>
      </div>

      <div className="pf-hero-scroll">
        <div className="pf-scroll-line" />
        <span>เลื่อนลง</span>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="pf-section pf-about" id="about">
      <div className="pf-container">
        <div className="pf-section-badge reveal">เกี่ยวกับเรา</div>
        <h2 className="pf-section-title reveal">
          เราเปลี่ยนไอเดียให้เป็น<br />
          <span className="text-gradient">ของจริง</span>
        </h2>
        <p className="pf-section-desc reveal">
          ทีมงานผู้เชี่ยวชาญด้านการพิมพ์ 3 มิติ
        </p>

        <div className="pf-about-grid">
          <div className="pf-about-card reveal">
            <div className="pf-about-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>คุณภาพสูง</h3>
            <p>ใช้เครื่องพิมพ์และวัสดุคุณภาพสูง ได้มาตรฐานทุกชิ้นงาน</p>
          </div>
          <div className="pf-about-card reveal">
            <div className="pf-about-icon pf-about-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>รวดเร็ว</h3>
            <p>ส่งงานได้ภายใน 24 ชั่วโมง สำหรับงานเร่งด่วน</p>
          </div>
          <div className="pf-about-card reveal">
            <div className="pf-about-icon pf-about-icon-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <h3>ราคาเป็นธรรม</h3>
            <p>ประเมินราคาก่อนสั่งพิมพ์ ไม่มีค่าใช้จ่ายแอบแฝง</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="32" height="32">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      title: 'รับพิมพ์ 3D',
      desc: 'รองรับไฟล์ STL, OBJ, STEP พิมพ์ได้ทุกขนาด ทุกวัสดุ PLA, ABS, PETG, TPU',
      color: '#2C2C2C',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="32" height="32">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
      title: 'ออกแบบ 3D',
      desc: 'รับออกแบบโมเดล 3 มิติจากไอเดีย หรือแก้ไขไฟล์ที่มีอยู่แล้ว',
      color: '#76c6ff',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="32" height="32">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      ),
      title: 'ผลิตจำนวนมาก',
      desc: 'รับผลิตจำนวนมาก ราคาพิเศษ เหมาะสำหรับของพรีเมียม ของชำร่วย',
      color: '#52d29b',
    },
  ];

  return (
    <section className="pf-section pf-services" id="services">
      <div className="pf-container">
        <div className="pf-section-badge reveal">บริการของเรา</div>
        <h2 className="pf-section-title reveal">
          บริการ<span className="text-gradient">ครบวงจร</span>
        </h2>

        <div className="pf-services-grid">
          {services.map((s, i) => (
            <div className="pf-service-card reveal" key={i}>
              <div className="pf-service-icon" style={{ color: s.color, background: `${s.color}12` }}>
                {s.icon}
              </div>
              <h3 className="pf-service-title">{s.title}</h3>
              <p className="pf-service-desc">{s.desc}</p>
              <div className="pf-service-line" style={{ background: s.color }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioSection() {
  const [current, setCurrent] = useState(0);
  const [view, setView] = useState('slider');
  const works = [
    { title: 'Miniature Landscape', cat: 'PLA · White', img: '/495623755_122132549732794608_242040306043299336_n.jpg' },
    { title: 'Phone Stand', cat: 'PLA · Black', img: '/721463782_122205909518794608_5667375791186236805_n.jpg' },
    { title: 'Gear Mechanism', cat: 'PETG · Grey', img: '/582620168_122175795890794608_717930253430037757_n.jpg' },
    { title: 'Character Figurine', cat: 'PLA · Red', img: '/581938965_122175566582794608_65542895122778247_n.jpg' },
    { title: 'Architectural Model', cat: 'PLA · Blue', img: '/515020634_1266757901457924_3943247298544248060_n.jpg' },
    { title: 'Custom Part', cat: 'ABS · Natural', img: '/514809310_1266757891457925_839745560445815825_n.jpg' },
    { title: 'Prototype Model', cat: 'PLA · Green', img: '/498607739_122143775510794608_224885529650068854_n.jpg' },
    { title: 'Decorative Piece', cat: 'PLA · Gold', img: '/499169877_122136958436794608_426783168660982174_n.jpg' },
    { title: 'Functional Part', cat: 'PETG · Black', img: '/499043714_122136961082794608_1718588916961603118_n.jpg' },
    { title: 'Art Model', cat: 'PLA · White', img: '/495527744_122132591672794608_8859015468412944026_n.jpg' },
  ];

  const prev = useCallback(() => setCurrent(c => (c === 0 ? works.length - 1 : c - 1)), []);
  const next = useCallback(() => setCurrent(c => (c === works.length - 1 ? 0 : c + 1)), []);

  useEffect(() => {
    if (view === 'slider') {
      const timer = setInterval(next, 4000);
      return () => clearInterval(timer);
    }
  }, [next, view]);

  return (
    <section className="pf-section pf-portfolio" id="portfolio">
      <div className="pf-container">
        <div className="pf-section-badge reveal">ผลงานของเรา</div>
        <h2 className="pf-section-title reveal">
          ตัวอย่าง<span className="text-gradient">งานพิมพ์</span>
        </h2>

        <div className="pf-view-toggle reveal">
          <button
            className={`pf-view-btn ${view === 'slider' ? 'active' : ''}`}
            onClick={() => setView('slider')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            Slider
          </button>
          <button
            className={`pf-view-btn ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Grid
          </button>
        </div>

        {view === 'slider' ? (
          <div className="pf-slider reveal">
            <div className="pf-slider-main">
              <button className="pf-slider-arrow pf-slider-prev" onClick={prev}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div className="pf-slider-img">
                <img key={current} className="pf-slider-fade" src={works[current].img} alt={works[current].title} />
              </div>
              <button className="pf-slider-arrow pf-slider-next" onClick={next}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <div className="pf-slider-thumbs">
              {works.map((w, i) => (
                <button
                  key={i}
                  className={`pf-slider-thumb ${i === current ? 'active' : ''}`}
                  onClick={() => setCurrent(i)}
                >
                  <img src={w.img} alt={w.title} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pf-portfolio-grid-enhanced reveal">
            {works.map((w, i) => (
              <div className="pf-portfolio-card" key={i}>
                <div className="pf-portfolio-img">
                  <img src={w.img} alt={w.title} />
                </div>
                <div className="pf-portfolio-info">
                  <h4>{w.title}</h4>
                  <span>{w.cat}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DesignSection() {
  const [current, setCurrent] = useState(0);
  const designs = [
    { title: 'Design 1', img: '/510052270_122144180804794608_4343354543831571538_n.jpg' },
    { title: 'Design 2', img: '/messageImage_1781736074572.jpg' },
    { title: 'Design 3', img: '/messageImage_1781735885587.jpg' },
    { title: 'Design 4', img: '/messageImage_1781735982219.jpg' },
    { title: 'Design 5', img: '/messageImage_1781735816088.jpg' },
    { title: 'Design 6', img: '/messageImage_1781735754390.jpg' },
    { title: 'Design 7', img: '/messageImage_1781735616594.jpg' },
    { title: 'Design 8', img: '/messageImage_1781735665790.jpg' },
    { title: 'Design 9', img: '/506741618_122142740630794608_6661992460606179504_n.jpg' },
    { title: 'Design 10', img: '/514247019_122146364990794608_6177439173248531107_n.jpg' },
    { title: 'Design 11', img: '/514326700_122146364852794608_3015963242111860793_n.jpg' },
    { title: 'Design 12', img: '/721463782_122205909518794608_5667375791186236805_n.jpg' },
  ];

  const prev = useCallback(() => setCurrent(c => (c === 0 ? designs.length - 1 : c - 1)), []);
  const next = useCallback(() => setCurrent(c => (c === designs.length - 1 ? 0 : c + 1)), []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="pf-section pf-design" id="design">
      <div className="pf-container">
        <div className="pf-section-badge reveal">บริการออกแบบ</div>
        <h2 className="pf-section-title reveal">
          รับ<span className="text-gradient">ออกแบบ 3D</span>
        </h2>
        <p className="pf-section-desc reveal">
          ไม่แค่พิมพ์ เรายังรับออกแบบโมเดล 3D ตามที่คุณต้องการ
        </p>

        <div className="pf-slider reveal">
          <div className="pf-slider-main">
            <button className="pf-slider-arrow pf-slider-prev" onClick={prev}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="pf-slider-img">
              <img key={current} className="pf-slider-fade" src={designs[current].img} alt={designs[current].title} />
            </div>
            <button className="pf-slider-arrow pf-slider-next" onClick={next}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="20" height="20"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div className="pf-slider-thumbs">
            {designs.map((d, i) => (
              <button
                key={i}
                className={`pf-slider-thumb ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
              >
                <img src={d.img} alt={d.title} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  const faqs = [
    {
      q: 'รองรับไฟล์อะไรบ้าง?',
      a: 'รองรับไฟล์ STL, OBJ, STEP, 3MF สามารถอัปโหลดผ่านเว็บไซต์ได้ทันที ระบบจะอ่านโมเดลอัตโนมัติและแสดงขนาดให้ตรวจสอบก่อนสั่งพิมพ์',
    },
    {
      q: 'ใช้เวลานานแค่ไหนกว่าจะได้ของ?',
      a: 'งานทั่วไป 1-3 วัน งานเร่งด่วน 24 ชั่วโมง (มีค่าใช้จ่ายเพิ่ม) ขึ้นอยู่กับขนาดและจำนวนงาน หลังสั่งพิมพ์จะมีข้อความยืนยันให้ทราบ',
    },
    {
      q: 'วัสดุแต่ละชนิดต่างกันอย่างไร?',
      a: 'PLA เหมาะกับงานทั่วไปและรายละเอียดสูง, PETG ทนทานและยืดหยุ่น, ABS ทนความร้อนและแรงกระแทก, TPU ยืดหยุ่นเหมือนยาง, ASA ทนแสง UV สำหรับงานกลางแจ้ง',
    },
    {
      q: 'มีบริการจัดส่งมั้ย?',
      a: 'มีบริการจัดส่งทั่วประเทศผ่าน Kerry Express และ J&T Express กรุงเทพฯ ได้ของใน 1-2 วัน ต่างจังหวัด 2-5 วัน',
    },
    {
      q: 'ราคานำหนักคิดอย่างไร?',
      a: 'ราคาคำนวณจากน้ำหนักวัสดุจริงหลังพิมพ์ (ไม่ใช่ขนาดโมเดล) บวกค่าแรงและค่าบริการ สามารถดูราคาได้ทันทีหลังอัปโหลดไฟล์',
    },
    {
      q: 'สั่งพิมพ์จำนวนมากมีส่วนลดมั้ย?',
      a: 'มีส่วนลดพิเศษสำหรับงาน 10+ ชิ้นขึ้นไป ติดต่อเราเพื่อขอใบเสนอราคา bulk ได้เลยครับ',
    },
  ];

  return (
    <section className="pf-section pf-faq">
      <div className="pf-container">
        <div className="pf-section-badge reveal">คำถามที่พบบ่อย</div>
        <h2 className="pf-section-title reveal">
          มีคำถาม?<span className="text-gradient">เรามีคำตอบ</span>
        </h2>

        <div className="pf-faq-list">
          {faqs.map((f, i) => (
            <div
              className={`pf-faq-item reveal ${openIdx === i ? 'open' : ''}`}
              key={i}
            >
              <button className="pf-faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{f.q}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="18" height="18" className="pf-faq-chevron">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="pf-faq-a">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="pf-section pf-vision">
      <div className="pf-container">
        <div className="pf-vision-grid">
          <div className="pf-vision-left reveal">
            <div className="pf-section-badge">วิสัยทัศน์</div>
            <h2 className="pf-section-title">
              เราเชื่อว่าทุกคน<br />
              ควร<span className="text-gradient">เข้าถึง</span>การผลิต<br />
              ได้ง่าย
            </h2>
          </div>
          <div className="pf-vision-right">
            <div className="pf-vision-card reveal">
              <div className="pf-vision-num">01</div>
              <h3>วิสัยทัศน์ (Vision)</h3>
              <p>เป็นผู้ให้บริการพิมพ์ 3 มิติที่เข้าถึงง่ายที่สุดในประเทศไทย เราต้องการให้ทุกคน — ไม่ว่าจะเป็นนักเรียน, วิศวกร, หรือนักออกแบบ — สามารถเปลี่ยนไอเดียให้เป็นของจริงได้ในราคาที่เป็นธรรม</p>
            </div>
            <div className="pf-vision-card reveal">
              <div className="pf-vision-num">02</div>
              <h3>พันธกิจ (Mission)</h3>
              <p>ให้บริการพิมพ์ 3 มิติคุณภาพสูง ราคาโปร่งใส ด้วยระบบที่ทันสมัย — อัปโหลดไฟล์, เลือกวัสดุ, รับราคาทันที ไม่ต้องรอใบเสนอราคา ไม่มีค่าใช้จ่ายแอบแฝง</p>
            </div>
            <div className="pf-vision-card reveal">
              <div className="pf-vision-num">03</div>
              <h3>ค่านิยม (Values)</h3>
              <p>คุณภาพมาก่อนเสมอ — เราใช้เครื่องพิมพ์และวัสดุเกรดเดียวกับโรงงานอุตสาหกรรม พร้อมทีมงานที่ตรวจสอบทุกชิ้นงานก่อนส่งมอบ</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      num: '01',
      title: 'อัปโหลดไฟล์',
      desc: 'ลากไฟล์ STL หรือ OBJ มาวาง หรือคลิกเลือกไฟล์ ระบบจะอ่านโมเดลอัตโนมัติ',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'ปรับตั้งค่า',
      desc: 'เลือกวัสดุ, สี, Infill, Layer Height, จำนวนชิ้น — เห็นราคาทันทีแบบ realtime',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'สั่งพิมพ์',
      desc: 'ตรวจสอบราคาแล้วกดสั่งพิมพ์ กรอกข้อมูลจัดส่ง โอนเงินผ่าน QR Code',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'รับงาน',
      desc: 'แอดมินตรวจสอบและเริ่มพิมพ์ ติดตามสถานะได้แบบ realtime ผ่านหน้าเช็คพัสดุ',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="28" height="28">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section className="pf-section pf-process">
      <div className="pf-container">
        <div className="pf-section-badge reveal">วิธีการสั่งพิมพ์</div>
        <h2 className="pf-section-title reveal">
          ง่ายแค่<span className="text-gradient">4 ขั้นตอน</span>
        </h2>
        <p className="pf-section-desc reveal">
          จากไฟล์สู่ของจริง — ใช้เวลาไม่ถึง 5 นาทีในการสั่ง
        </p>

        <div className="pf-process-grid">
          {steps.map((s, i) => (
            <div className="pf-process-card reveal" key={i}>
              <div className="pf-process-num">{s.num}</div>
              <div className="pf-process-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="pf-process-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialsSection() {
  const materials = [
    { name: 'PLA', desc: 'ใช้งานทั่วไป, รายละเอียดสูง, เป็นมิตรกับสิ่งแวดล้อม', price: '฿2.50/g', color: '#2C2C2C' },
    { name: 'PETG', desc: 'ทนทาน, ยืดหยุ่น, กันน้ำ, เหมาะกับกล่องและบรรจุภัณฑ์', price: '฿1.50/g', color: '#52d29b' },
    { name: 'ABS', desc: 'ทนความร้อน, ทนแรงกระแทก, เหมาะกับชิ้นส่วนเครื่องจักร', price: '฿3.00/g', color: '#76c6ff' },
    { name: 'ASA', desc: 'ทนแสง UV, ทนอากาศ, เหมาะกับงานกลางแจ้ง', price: '฿3.50/g', color: '#ffb703' },
    { name: 'TPU', desc: 'ยืดหยุ่นสูงเหมือนยาง, เหมาะกับเคสมือถือ, รองเท้า, ของเล่น', price: '฿3.00/g', color: '#fb8500' },
  ];

  return (
    <section className="pf-section pf-materials">
      <div className="pf-container">
        <div className="pf-section-badge reveal">วัสดุที่รองรับ</div>
        <h2 className="pf-section-title reveal">
          เลือกวัสดุ<span className="text-gradient">ตามการใช้งาน</span>
        </h2>
        <p className="pf-section-desc reveal">
          แต่ละวัสดุมีคุณสมบัติเฉพาะตัว เลือกให้เหมาะกับงานของคุณ
        </p>

        <div className="pf-materials-grid">
          {materials.map((m, i) => (
            <div className="pf-material-card reveal" key={i}>
              <div className="pf-material-color" style={{ background: m.color }} />
              <div className="pf-material-info">
                <div className="pf-material-header">
                  <h3>{m.name}</h3>
                  <span className="pf-material-price">{m.price}</span>
                </div>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="pf-section pf-contact">
      <div className="pf-container">
        <div className="pf-contact-grid">
          <div className="pf-contact-left reveal">
            <div className="pf-section-badge">ติดต่อเรา</div>
            <h2 className="pf-section-title">
              มีคำถาม?<br />
              <span className="text-gradient">ทักมาได้เลย</span>
            </h2>
            <p className="pf-section-desc">
              ไม่แน่ใจว่างานของคุณเหมาะกับการพิมพ์ 3D มั้ย?<br />
              ส่งไฟล์มาให้เราดูได้ฟรี ไม่มีค่าใช้จ่าย
            </p>
          </div>
          <div className="pf-contact-right reveal">
            <div className="pf-contact-card">
              <div className="pf-contact-row">
                <div className="pf-contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <span className="pf-contact-label">โทรศัพท์</span>
                  <span className="pf-contact-value">098-258-4742</span>
                  <span className="pf-contact-sub">คุณโฟโต้</span>
                </div>
              </div>
              <div className="pf-contact-row">
                <div className="pf-contact-icon pf-contact-icon-blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <span className="pf-contact-label">อีเมล</span>
                  <span className="pf-contact-value">p3dprintinganddesign@gmail.com</span>
                </div>
              </div>
              <div className="pf-contact-row">
                <div className="pf-contact-icon pf-contact-icon-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="20" height="20">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span className="pf-contact-label">ที่อยู่</span>
                  <span className="pf-contact-value">กรุงเทพมหานคร, ประเทศไทย</span>
                </div>
              </div>
              <div className="pf-contact-row">
                <div className="pf-contact-icon pf-contact-icon-fb">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <span className="pf-contact-label">Facebook</span>
                  <a className="pf-contact-value pf-contact-link" href="https://www.facebook.com/share/18SjY3tfqJ/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">P3D Printing and Design</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UploadCTASection() {
  const inputRef = useRef(null);
  const zoneRef = useRef(null);
  const { setPendingFile, setScreen } = useApp();

  const handleFile = useCallback((f) => {
    if (f && f.name.toLowerCase().endsWith('.stl')) {
      setPendingFile(f);
      setScreen('viewer');
    }
  }, [setPendingFile, setScreen]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    zoneRef.current?.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <section className="pf-section pf-upload-section" id="upload">
      <div className="pf-container">
        <div className="pf-section-badge reveal">เริ่มต้นเลย</div>
        <h2 className="pf-section-title reveal">
          พร้อม<span className="text-gradient">สั่งพิมพ์</span>แล้วหรือยัง?
        </h2>
        <p className="pf-section-desc reveal">
          อัปโหลดไฟล์ STL แล้วระบบจะคำนวณราคาให้อัตโนมัติ
        </p>

        <div
          ref={zoneRef}
          className="pf-upload-zone reveal"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); zoneRef.current?.classList.add('dragover'); }}
          onDragLeave={() => zoneRef.current?.classList.remove('dragover')}
        >
          <div className="pf-upload-inner">
            <div className="pf-upload-icon">
              <svg viewBox="0 0 64 64" fill="none">
                <path d="M32 8L52 20V44L32 56L12 44V20L32 8Z" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M32 20V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M24 28L32 20L40 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>ลากไฟล์ STL มาวางที่นี่</h3>
            <p>หรือคลิกเพื่อเลือกไฟล์</p>
            <div className="pf-upload-badge">รองรับ .STL</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".stl"
            hidden
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pf-footer">
      <div className="pf-container">
        <div className="pf-footer-inner">
          <div className="pf-footer-brand">
            <div className="pf-nav-logo">
              <svg viewBox="0 0 60 60" fill="none" width="24" height="24">
                <path d="M30 3L57 18V42L30 57L3 42V18L30 3Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <path d="M30 3L57 18L30 33L3 18L30 3Z" fill="currentColor" opacity="0.15" />
              </svg>
              <span>P3D <span className="logo-sub">Printing and Design</span></span>
            </div>
            <p>บริการพิมพ์ 3 มิติคุณภาพสูง</p>
          </div>
          <div className="pf-footer-links">
            <a href="#about">เกี่ยวกับ</a>
            <a href="#services">บริการ</a>
            <a href="#portfolio">ผลงาน</a>
            <a href="/track.html" target="_blank">เช็คพัสดุ</a>
            <a href="/admin" target="_blank">Admin</a>
          </div>
          <div className="pf-footer-copy">
            &copy; 2026 P3D Printing and Design. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function UploadScreen() {
  useScrollReveal();
  const { setScreen } = useApp();
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

  const handleStart = () => {
    const zone = document.getElementById('upload');
    if (zone) zone.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pf-landing">
      <Navbar darkMode={darkMode} toggleDark={toggleDark} />
      <HeroSection onStart={handleStart} />
      <AboutSection />
      <VisionSection />
      <ServicesSection />
      <ProcessSection />
      <MaterialsSection />
      <PortfolioSection />
      <DesignSection />
      <FAQSection />
      <ContactSection />
      <UploadCTASection />
      <Footer />
    </div>
  );
}

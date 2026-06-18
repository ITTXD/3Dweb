// ==================================
// 3D Print Estimator — App Logic
// Fullscreen Viewer + Floating Drawer
// ==================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

// นำเข้าการตั้งค่า Firebase
import app, { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
console.log('Firebase ถูกโหลดแล้ว!', app.name);

// ---- State ----
const state = {
    geometry: null,
    fileName: '',
    modelVolume: 0,
    totalPrice: 0,
    boundingBox: null,
    settings: {
        infill: 20,
        layerHeight: 0.20,
        wallCount: 2,
        support: false,
        material: 'PLA',
        color: '#e63946',
    },
};

// ---- Material Database ----
const MATERIALS = {
    PLA: { density: 1.24, pricePerGram: 0.80, speedFactor: 1.0 },
    ABS: { density: 1.04, pricePerGram: 0.90, speedFactor: 0.9 },
    PETG: { density: 1.27, pricePerGram: 1.00, speedFactor: 0.85 },
    TPU: { density: 1.21, pricePerGram: 1.50, speedFactor: 0.6 },
    Nylon: { density: 1.14, pricePerGram: 2.00, speedFactor: 0.7 },
};

const MACHINE_RATE = 25;
const OVERHEAD = 30;
const BASE_SPEED = 50;
const NOZZLE_DIAMETER = 0.4;

// ---- Three.js ----
let scene, camera, renderer, controls, modelMesh, gridHelper;
let isWireframe = false;
let viewerInitialized = false;

function initViewer() {
    if (viewerInitialized) return;
    viewerInitialized = true;

    const canvas = document.getElementById('viewer3D');
    const container = document.getElementById('viewerContainer');
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080808);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
    camera.position.set(100, 80, 100);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 2000;
    controls.target.set(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(50, 100, 50);
    dir1.castShadow = true;
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xff3333, 0.3);
    dir2.position.set(-50, 50, -50);
    scene.add(dir2);

    scene.add(new THREE.PointLight(0xe63946, 0.2, 500));

    // Grid
    gridHelper = new THREE.GridHelper(200, 20, 0x333333, 0x1a1a1a);
    scene.add(gridHelper);

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    window.addEventListener('resize', onResize);
    animate();
}

function onResize() {
    const c = document.getElementById('viewerContainer');
    if (!c || !renderer || !camera) return;
    const w = c.clientWidth, h = c.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function resetCamera() {
    if (!state.geometry) return;
    state.geometry.computeBoundingBox();
    const box = state.geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const d = Math.max(size.x, size.y, size.z) * 2;
    camera.position.set(center.x + d * 0.6, center.y + d * 0.5, center.z + d * 0.6);
    controls.target.copy(center);
    controls.update();
}

// ---- STL Loading ----
function loadSTL(arrayBuffer) {
    const geometry = new STLLoader().parse(arrayBuffer);

    if (modelMesh) {
        scene.remove(modelMesh);
        modelMesh.geometry.dispose();
        modelMesh.material.dispose();
    }

    // Center X/Z, place bottom on Y=0
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, 0, -center.z);
    geometry.computeBoundingBox();
    geometry.translate(0, -geometry.boundingBox.min.y, 0);

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    state.geometry = geometry;
    state.boundingBox = geometry.boundingBox;

    const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.settings.color),
        roughness: 0.5,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.3,
        wireframe: isWireframe,
    });

    modelMesh = new THREE.Mesh(geometry, mat);
    modelMesh.castShadow = true;
    modelMesh.receiveShadow = true;
    scene.add(modelMesh);

    state.modelVolume = computeVolume(geometry);

    // Adjust grid
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    scene.remove(gridHelper);
    const gs = Math.ceil(maxDim / 10) * 20;
    gridHelper = new THREE.GridHelper(gs, gs / 10, 0x333333, 0x1a1a1a);
    scene.add(gridHelper);

    resetCamera();
    updateStats(geometry, size);
    calculatePrice();
}

function computeVolume(geo) {
    const pos = geo.attributes.position;
    let vol = 0;
    for (let i = 0; i < pos.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(pos, i);
        const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
        vol += (a.x * (b.y * c.z - c.y * b.z) - b.x * (a.y * c.z - c.y * a.z) + c.x * (a.y * b.z - b.y * a.z)) / 6.0;
    }
    return Math.abs(vol) / 1000;
}

function updateStats(geo, size) {
    const tri = geo.attributes.position.count / 3;
    document.getElementById('statTriangles').textContent = `△ ${tri.toLocaleString()}`;
    document.getElementById('statVolume').textContent = `📐 ${state.modelVolume.toFixed(2)} cm³`;
    document.getElementById('statDimensions').textContent = `📏 ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} mm`;
}

// ---- Price ----
function calculatePrice() {
    if (state.modelVolume <= 0) return;
    const s = state.settings;
    const m = MATERIALS[s.material];

    const shellRatio = Math.min((s.wallCount * NOZZLE_DIAMETER * 2) / 10, 0.5);
    const matVolRatio = shellRatio + (1 - shellRatio) * (s.infill / 100);
    const matVol = state.modelVolume * matVolRatio;
    const weight = matVol * m.density;

    const extRate = NOZZLE_DIAMETER * s.layerHeight * BASE_SPEED * m.speedFactor;
    const timeH = (matVol * 1000) / extRate / 3600 * (s.support ? 1.15 : 1.0);

    const matCost = weight * m.pricePerGram;
    const macCost = timeH * MACHINE_RATE;
    const total = matCost + macCost + OVERHEAD;

    document.getElementById('priceVolume').textContent = `${state.modelVolume.toFixed(2)} cm³`;
    document.getElementById('priceWeight').textContent = `${weight.toFixed(1)} g`;
    const hrs = Math.floor(timeH), mins = Math.round((timeH - hrs) * 60);
    document.getElementById('priceTime').textContent = hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;
    document.getElementById('priceMaterial').textContent = `฿ ${matCost.toFixed(2)}`;
    document.getElementById('priceMachine').textContent = `฿ ${macCost.toFixed(2)}`;
    document.getElementById('priceOverhead').textContent = `฿ ${OVERHEAD.toFixed(2)}`;
    document.getElementById('priceTotal').textContent = `฿ ${total.toFixed(2)}`;
    state.totalPrice = total; // เก็บค่าราคารวมไว้ใน state
}

// ---- UI ----
function initUI() {
    const uploadScreen = document.getElementById('uploadScreen');
    const viewerScreen = document.getElementById('viewerScreen');
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const drawer = document.getElementById('settingsDrawer');
    const overlay = document.getElementById('drawerOverlay');

    // ---- Upload ----
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f && f.name.toLowerCase().endsWith('.stl')) handleFile(f);
    });
    fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });

    // ---- Back Button ----
    document.getElementById('backBtn').addEventListener('click', () => {
        viewerScreen.style.display = 'none';
        uploadScreen.style.display = 'flex';
        closeDrawer();
        if (modelMesh) { scene.remove(modelMesh); modelMesh.geometry.dispose(); modelMesh.material.dispose(); modelMesh = null; }
        state.geometry = null;
        state.modelVolume = 0;
        fileInput.value = '';
    });

    // ---- Drawer Toggle ----
    document.getElementById('settingsFab').addEventListener('click', openDrawer);
    document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }

    // ---- Settings Controls ----
    // Infill
    document.querySelectorAll('#infillOptions .opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#infillOptions .opt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.infill = parseInt(btn.dataset.value);
            document.getElementById('infillValue').textContent = `${state.settings.infill}%`;
            document.getElementById('infillFill').style.width = `${state.settings.infill}%`;
            calculatePrice();
        });
    });

    // Layer Height
    document.querySelectorAll('#layerOptions .opt-btn-col').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#layerOptions .opt-btn-col').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.layerHeight = parseFloat(btn.dataset.value);
            document.getElementById('layerHeightValue').textContent = `${state.settings.layerHeight.toFixed(2)} mm`;
            calculatePrice();
        });
    });

    // Wall Count
    document.querySelectorAll('#wallOptions .opt-btn-col').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#wallOptions .opt-btn-col').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.wallCount = parseInt(btn.dataset.value);
            document.getElementById('wallValue').textContent = state.settings.wallCount;
            calculatePrice();
        });
    });

    // Support
    document.getElementById('supportCheckbox').addEventListener('change', function () {
        state.settings.support = this.checked;
        document.getElementById('supportLabel').textContent = this.checked ? 'เปิด' : 'ปิด';
        calculatePrice();
    });

    // Material
    document.querySelectorAll('.mat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.settings.material = btn.dataset.value;
            document.getElementById('materialValue').textContent = state.settings.material;
            calculatePrice();
        });
    });

    // Color
    document.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            state.settings.color = sw.dataset.value;
            document.getElementById('colorValue').textContent = sw.dataset.name;
            if (modelMesh) modelMesh.material.color.set(state.settings.color);
        });
    });

    // Viewer Controls
    document.getElementById('resetCameraBtn').addEventListener('click', resetCamera);
    document.getElementById('wireframeBtn').addEventListener('click', () => {
        isWireframe = !isWireframe;
        document.getElementById('wireframeBtn').classList.toggle('active', isWireframe);
        if (modelMesh) modelMesh.material.wireframe = isWireframe;
    });

    // Set initial active
    document.querySelector('#wallOptions .opt-btn-col[data-value="2"]').classList.add('active');

    // ---- Order Modal Logic ----
    const orderBtn = document.getElementById('orderBtn');
    const orderModal = document.getElementById('orderModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const orderForm = document.getElementById('orderForm');

    function openModal() {
        if(state.totalPrice <= 0) {
            alert('กรุณาอัปโหลดไฟล์ STL ก่อนสั่งพิมพ์');
            return;
        }
        orderModal.classList.add('open');
    }

    function closeModal() {
        orderModal.classList.remove('open');
        orderForm.reset();
    }

    orderBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelOrderBtn.addEventListener('click', closeModal);

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitOrderBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังส่งออเดอร์...';

        try {
            const orderData = {
                customerName: document.getElementById('custName').value,
                customerPhone: document.getElementById('custPhone').value,
                customerAddress: document.getElementById('custAddress').value,
                fileName: state.fileName,
                modelVolume: parseFloat(state.modelVolume.toFixed(2)),
                price: parseFloat(state.totalPrice.toFixed(2)),
                settings: state.settings,
                status: 'pending', // สถานะเริ่มต้น
                createdAt: serverTimestamp()
            };

            // บันทึกลง Firestore คอลเลกชัน "orders"
            await addDoc(collection(db, "orders"), orderData);
            
            alert('ส่งออเดอร์เรียบร้อยแล้ว! เราจะติดต่อกลับไปเร็วๆนี้');
            closeModal();
            closeDrawer();
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('เกิดข้อผิดพลาดในการส่งออเดอร์ กรุณาลองใหม่อีกครั้ง');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ส่งออเดอร์';
        }
    });
}

function handleFile(file) {
    const uploadScreen = document.getElementById('uploadScreen');
    const viewerScreen = document.getElementById('viewerScreen');

    state.fileName = file.name;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatSize(file.size);

    // Switch screens
    uploadScreen.style.display = 'none';
    viewerScreen.style.display = 'block';

    // Init viewer after screen is visible
    requestAnimationFrame(() => {
        initViewer();
        onResize();

        const reader = new FileReader();
        reader.onload = e => loadSTL(e.target.result);
        reader.readAsArrayBuffer(file);
    });
}

function formatSize(b) {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    initUI();
});

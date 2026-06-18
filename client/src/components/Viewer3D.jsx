import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { useApp } from '../context/AppContext';

const PLATE_SIZE = 256;
const HALF = PLATE_SIZE / 2;

function createBuildPlate(isDark) {
  const group = new THREE.Group();

  const baseGeo = new THREE.PlaneGeometry(PLATE_SIZE, PLATE_SIZE);
  const baseMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x1a1a1a : 0xf0ebe0, roughness: 0.9, metalness: 0.1 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.05;
  base.receiveShadow = true;
  group.add(base);

  const minorMat = new THREE.LineBasicMaterial({ color: isDark ? 0x444444 : 0xcccccc, transparent: true, opacity: 0.4 });
  for (let i = -HALF; i <= HALF; i += 10) {
    if (i % 50 === 0) continue;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-HALF, 0.01, i), new THREE.Vector3(HALF, 0.01, i),
    ]), minorMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0.01, -HALF), new THREE.Vector3(i, 0.01, HALF),
    ]), minorMat));
  }

  const majorMat = new THREE.LineBasicMaterial({ color: isDark ? 0x666666 : 0x999999, transparent: true, opacity: 0.6 });
  for (let i = -HALF; i <= HALF; i += 50) {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-HALF, 0.01, i), new THREE.Vector3(HALF, 0.01, i),
    ]), majorMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0.01, -HALF), new THREE.Vector3(i, 0.01, HALF),
    ]), majorMat));
  }

  const centerMat = new THREE.LineBasicMaterial({ color: isDark ? 0xf0ebe0 : 0x2C2C2C, transparent: true, opacity: 0.5 });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-HALF, 0.02, 0), new THREE.Vector3(HALF, 0.02, 0),
  ]), centerMat));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.02, -HALF), new THREE.Vector3(0, 0.02, HALF),
  ]), centerMat));

  const borderMat = new THREE.LineBasicMaterial({ color: isDark ? 0xf0ebe0 : 0x2C2C2C });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-HALF, 0.03, -HALF),
    new THREE.Vector3(HALF, 0.03, -HALF),
    new THREE.Vector3(HALF, 0.03, HALF),
    new THREE.Vector3(-HALF, 0.03, HALF),
    new THREE.Vector3(-HALF, 0.03, -HALF),
  ]), borderMat));

  const cornerMat = new THREE.LineBasicMaterial({ color: isDark ? 0x888888 : 0x555555 });
  const cs = 15;
  [[-HALF, -HALF, 1, 1], [HALF, -HALF, -1, 1], [HALF, HALF, -1, -1], [-HALF, HALF, 1, -1]].forEach(([cx, cz, sx, sz]) => {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, 0.04, cz), new THREE.Vector3(cx + cs * sx, 0.04, cz),
      new THREE.Vector3(cx, 0.04, cz), new THREE.Vector3(cx, 0.04, cz + cs * sz),
    ]), cornerMat));
  });

  return group;
}

function snapMeshToPlate(mesh) {
  mesh.updateMatrixWorld(true);
  const worldBox = new THREE.Box3().setFromObject(mesh);
  const minY = worldBox.min.y;
  if (Math.abs(minY) > 0.01) {
    mesh.position.y -= minY;
    mesh.updateMatrixWorld(true);
  }
}

function findLargeFaces(geometry, angleStep = 5, areaThresholdPercent = 1.0) {
  const pos = geometry.attributes.position;
  const ANGLE_STEP = angleStep * Math.PI / 180;
  const buckets = new Map();
  let totalArea = 0;

  function quantize(v) {
    const theta = Math.acos(Math.max(-1, Math.min(1, v.y)));
    const phi = Math.atan2(v.z, v.x);
    const tIdx = Math.round(theta / ANGLE_STEP);
    const pIdx = Math.round(phi / ANGLE_STEP);
    return `${tIdx},${pIdx}`;
  }

  for (let i = 0; i < pos.count; i += 3) {
    const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
    const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
    const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);

    const ex1x = bx - ax, ex1y = by - ay, ex1z = bz - az;
    const ex2x = cx - ax, ex2y = cy - ay, ex2z = cz - az;

    const nx = ex1y * ex2z - ex1z * ex2y;
    const ny = ex1z * ex2x - ex1x * ex2z;
    const nz = ex1x * ex2y - ex1y * ex2x;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len === 0) continue;

    const area = len / 2;
    totalArea += area;

    const normal = new THREE.Vector3(nx / len, ny / len, nz / len);
    const key = quantize(normal);
    if (!buckets.has(key)) {
      buckets.set(key, { triangles: [], totalArea: 0, normal: normal.clone() });
    }
    const b = buckets.get(key);
    b.triangles.push(i);
    b.totalArea += area;
  }

  const threshold = totalArea * areaThresholdPercent / 100;
  const result = new Set();
  for (const b of buckets.values()) {
    if (b.totalArea >= threshold) {
      for (const t of b.triangles) result.add(t);
    }
  }
  return result;
}

function createHighlightGeometry(geometry, triStartSet) {
  const pos = geometry.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i += 3) {
    if (triStartSet.has(i)) {
      verts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      verts.push(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
      verts.push(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
    }
  }
  if (verts.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

export default function Viewer3D({ onFaceClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const {
    models, selectedModelId, setSelectedModelId,
    updateModelPosition, updateModelRotation,
    settings, autoRotate, wireframe, transformMode,
  } = useApp();

  const stateRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const isDark = document.documentElement.classList.contains('dark');
    scene.background = new THREE.Color(isDark ? 0x111111 : 0xf5f0e8);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
    camera.position.set(200, 150, 200);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.minDistance = 30;
    orbit.maxDistance = 800;
    orbit.target.set(0, 0, 0);
    orbit.maxPolarAngle = Math.PI / 2 - 0.01;

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSpace('local');
    transform.addEventListener('dragging-changed', (e) => {
      orbit.enabled = !e.value;
      if (!e.value && transform.object) {
        snapMeshToPlate(transform.object);
        const mid = transform.object.userData.modelId;
        if (mid) {
          updateModelPosition(mid, [transform.object.position.x, transform.object.position.y, transform.object.position.z]);
          updateModelRotation(mid, [transform.object.rotation.x, transform.object.rotation.y, transform.object.rotation.z]);
        }
      }
    });
    scene.add(transform);

    scene.add(createBuildPlate(isDark));

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dir1.position.set(100, 200, 100);
    dir1.castShadow = true;
    dir1.shadow.mapSize.set(2048, 2048);
    dir1.shadow.camera.near = 10;
    dir1.shadow.camera.far = 500;
    dir1.shadow.camera.left = -200;
    dir1.shadow.camera.right = 200;
    dir1.shadow.camera.top = 200;
    dir1.shadow.camera.bottom = -200;
    scene.add(dir1);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.3).translateX(-100).translateY(100).translateZ(-100));
    scene.add(new THREE.PointLight(0xffffff, 0.2, 500));

    const hlMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, depthWrite: false,
    });
    let hlMesh = null;
    let hlFaces = null;

    function clearHighlights() {
      if (hlMesh) {
        hlMesh.parent?.remove(hlMesh);
        hlMesh.geometry.dispose();
        hlMesh = null;
      }
      hlFaces = null;
    }

    function showHighlights(mesh, faces) {
      clearHighlights();
      hlFaces = faces;
      const geo = createHighlightGeometry(mesh.geometry, faces);
      if (!geo) return;
      hlMesh = new THREE.Mesh(geo, hlMat);
      hlMesh.raycast = () => {};
      mesh.add(hlMesh);
    }

    const meshMap = new Map();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      if (transform.dragging) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (intersects.length > 0) {
        const id = intersects[0].object.userData.modelId;
        const mesh = intersects[0].object;

        if (hlFaces) {
          const triStart = intersects[0].face.a;
          if (hlFaces.has(triStart)) {
            const localNormal = intersects[0].face.normal.clone();
            stateRef.current.onFaceClick?.(localNormal, id);
            clearHighlights();
          } else {
            clearHighlights();
            const faces = findLargeFaces(mesh.geometry);
            if (faces.size > 0) showHighlights(mesh, faces);
          }
        } else {
          const faces = findLargeFaces(mesh.geometry);
          if (faces.size > 0) showHighlights(mesh, faces);
        }

        setSelectedModelId(id);
        transform.setMode(stateRef.current.transformMode || 'translate');
        transform.attach(mesh);
      } else {
        clearHighlights();
        setSelectedModelId(null);
        transform.detach();
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { clearHighlights(); transform.detach(); setSelectedModelId(null); }
    };

    const onResize = () => {
      if (!container) return;
      const w2 = container.clientWidth, h2 = container.clientHeight;
      if (w2 === 0 || h2 === 0) return;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      orbit.autoRotate = stateRef.current.autoRotate || false;
      orbit.autoRotateSpeed = 2;
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    stateRef.current = { scene, camera, renderer, orbit, transform, meshMap };

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      clearHighlights();
      hlMat.dispose();
      orbit.dispose();
      transform.dispose();
      renderer.dispose();
      meshMap.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      meshMap.clear();
    };
  }, []);

  useEffect(() => { stateRef.current.autoRotate = autoRotate; }, [autoRotate]);
  useEffect(() => {
    stateRef.current.onFaceClick = onFaceClick;
  }, [onFaceClick]);
  useEffect(() => {
    stateRef.current.transformMode = transformMode;
    const { transform } = stateRef.current;
    if (transform) {
      transform.setMode(transformMode);
      transform.showX = true;
      transform.showY = transformMode !== 'translate';
      transform.showZ = true;
    }
  }, [transformMode]);

  useEffect(() => {
    stateRef.current.wireframe = wireframe;
    stateRef.current.meshMap?.forEach((mesh) => { mesh.material.wireframe = wireframe; });
  }, [wireframe]);

  useEffect(() => {
    const { scene, transform, meshMap } = stateRef.current;
    if (!scene || !meshMap) return;

    const currentIds = new Set(models.map(m => m.id));

    meshMap.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        if (transform.object === mesh) transform.detach();
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        meshMap.delete(id);
      }
    });

    for (const model of models) {
      let mesh = meshMap.get(model.id);

      if (!mesh) {
        mesh = new THREE.Mesh(
          model.geometry,
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(settings.color),
            roughness: 0.5,
            metalness: 0.1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.3,
            wireframe: stateRef.current.wireframe || false,
          })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.modelId = model.id;
        scene.add(mesh);
        meshMap.set(model.id, mesh);
      } else if (mesh.geometry !== model.geometry) {
        if (transform.object === mesh) transform.detach();
        mesh.geometry.dispose();
        mesh.geometry = model.geometry;
      }

      mesh.position.set(...model.position);
      mesh.rotation.set(...model.rotation);
      mesh.material.color.set(settings.color);
    }
  }, [models, settings.color]);

  return (
    <div ref={containerRef} className="viewer-fullscreen">
      <canvas ref={canvasRef} id="viewer3D" />
    </div>
  );
}

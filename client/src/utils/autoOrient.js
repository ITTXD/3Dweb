import * as THREE from 'three';

const ROTATIONS = [
  { label: 'original', axis: new THREE.Vector3(1, 0, 0), angle: 0 },
  { label: 'rotX90', axis: new THREE.Vector3(1, 0, 0), angle: Math.PI / 2 },
  { label: 'rotX-90', axis: new THREE.Vector3(1, 0, 0), angle: -Math.PI / 2 },
  { label: 'rotZ90', axis: new THREE.Vector3(0, 0, 1), angle: Math.PI / 2 },
  { label: 'rotZ-90', axis: new THREE.Vector3(0, 0, 1), angle: -Math.PI / 2 },
  { label: 'rotX180', axis: new THREE.Vector3(1, 0, 0), angle: Math.PI },
  { label: 'rotZ180', axis: new THREE.Vector3(0, 0, 1), angle: Math.PI },
];

function applyRotation(geometry, axis, angle) {
  const geo = geometry.clone();
  if (angle !== 0) {
    const matrix = new THREE.Matrix4();
    matrix.makeRotationAxis(axis.normalize(), angle);
    geo.applyMatrix4(matrix);
  }
  geo.computeBoundingBox();
  return geo;
}

export function autoOrient(geometry) {
  let bestGeo = null;
  let bestArea = -1;

  for (const rot of ROTATIONS) {
    const rotated = applyRotation(geometry, rot.axis, rot.angle);
    const size = new THREE.Vector3();
    rotated.boundingBox.getSize(size);
    const projectedArea = size.x * size.z;

    if (projectedArea > bestArea) {
      bestArea = projectedArea;
      bestGeo = rotated;
    }
  }

  // Center on X/Z and place bottom at Y=0
  bestGeo.computeBoundingBox();
  const center = new THREE.Vector3();
  bestGeo.boundingBox.getCenter(center);
  bestGeo.translate(-center.x, 0, -center.z);
  bestGeo.computeBoundingBox();
  bestGeo.translate(0, -bestGeo.boundingBox.min.y, 0);
  bestGeo.computeVertexNormals();
  bestGeo.computeBoundingBox();

  return bestGeo;
}

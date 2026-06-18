import * as THREE from 'three';

const PLATE_SIZE = 256;
const PADDING = 5;

export function getPlateSize() {
  return PLATE_SIZE;
}

export function getModelFootprint(geometry) {
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  return { width: size.x, depth: size.z, height: size.y };
}

export function arrangeModels(models) {
  if (models.length === 0) return [];

  const items = models.map((m, i) => ({
    id: m.id,
    footprint: getModelFootprint(m.geometry),
    index: i,
  }));

  // Sort by footprint area (largest first)
  items.sort((a, b) => {
    const areaA = a.footprint.width * a.footprint.depth;
    const areaB = b.footprint.width * b.footprint.depth;
    return areaB - areaA;
  });

  const positions = [];
  const halfPlate = PLATE_SIZE / 2;

  // Simple grid packing
  let currentX = -halfPlate;
  let currentZ = -halfPlate;
  let rowHeight = 0;

  for (const item of items) {
    const w = item.footprint.width + PADDING;
    const d = item.footprint.depth + PADDING;

    // Check if fits in current row
    if (currentX + w > halfPlate) {
      // Move to next row
      currentX = -halfPlate;
      currentZ += rowHeight;
      rowHeight = 0;
    }

    // Check if fits on plate
    if (currentZ + d > halfPlate) {
      // Model doesn't fit, place at center as fallback
      positions.push({
        id: item.id,
        position: new THREE.Vector3(0, 0, 0),
        fits: false,
      });
      continue;
    }

    // Place model
    const posX = currentX + item.footprint.width / 2;
    const posZ = currentZ + item.footprint.depth / 2;

    positions.push({
      id: item.id,
      position: new THREE.Vector3(posX, 0, posZ),
      fits: true,
    });

    currentX += w;
    rowHeight = Math.max(rowHeight, d);
  }

  // Center the arrangement
  const allPositions = positions.filter(p => p.fits);
  if (allPositions.length > 0) {
    const avgX = allPositions.reduce((s, p) => s + p.position.x, 0) / allPositions.length;
    const avgZ = allPositions.reduce((s, p) => s + p.position.z, 0) / allPositions.length;

    for (const p of allPositions) {
      p.position.x -= avgX;
      p.position.z -= avgZ;
    }
  }

  return positions;
}

export function isOnPlate(position, footprint) {
  const half = PLATE_SIZE / 2;
  const minX = position.x - footprint.width / 2;
  const maxX = position.x + footprint.width / 2;
  const minZ = position.z - footprint.depth / 2;
  const maxZ = position.z + footprint.depth / 2;

  return minX >= -half && maxX <= half && minZ >= -half && maxZ <= half;
}

export function isOverlapping(posA, footA, posB, footB) {
  const halfA = { w: footA.width / 2 + PADDING / 2, d: footA.depth / 2 + PADDING / 2 };
  const halfB = { w: footB.width / 2 + PADDING / 2, d: footB.depth / 2 + PADDING / 2 };

  const overlapX = Math.abs(posA.x - posB.x) < (halfA.w + halfB.w);
  const overlapZ = Math.abs(posA.z - posB.z) < (halfA.d + halfB.d);

  return overlapX && overlapZ;
}

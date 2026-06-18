export const MATERIALS = {
  PLA: { density: 1.24, pricePerGram: 2.50, speedFactor: 1.0 },
  PETG: { density: 1.27, pricePerGram: 1.50, speedFactor: 0.85 },
  ABS: { density: 1.04, pricePerGram: 3.00, speedFactor: 0.9 },
  ASA: { density: 1.07, pricePerGram: 3.50, speedFactor: 0.85 },
  TPU: { density: 1.21, pricePerGram: 3.00, speedFactor: 0.6 },
};

export const MACHINE_RATE = 25;
export const OVERHEAD = 30;
export const SHIPPING = 50;
export const BASE_SPEED = 50;
export const NOZZLE_DIAMETER = 0.4;

const DEFAULT_SETTINGS = {
  infill: 20,
  layerHeight: 0.20,
  wallCount: 2,
  support: false,
  material: 'PLA',
};

export function normalizeSettings(settings = {}) {
  return {
    infill: Number(settings.infill ?? DEFAULT_SETTINGS.infill),
    layerHeight: Number(settings.layerHeight ?? DEFAULT_SETTINGS.layerHeight),
    wallCount: Number(settings.wallCount ?? DEFAULT_SETTINGS.wallCount),
    support: Boolean(settings.support),
    material: settings.material || DEFAULT_SETTINGS.material,
  };
}

export function validateEstimateInput(volume, settings) {
  if (!volume || volume <= 0) {
    return { error: 'Volume must be greater than 0' };
  }

  const normalized = normalizeSettings(settings);
  const material = MATERIALS[normalized.material];
  if (!material) {
    return { error: 'Invalid material' };
  }

  if (!Number.isFinite(normalized.infill) || normalized.infill < 0 || normalized.infill > 100) {
    return { error: 'Infill must be between 0 and 100' };
  }

  if (!Number.isFinite(normalized.layerHeight) || normalized.layerHeight <= 0) {
    return { error: 'Layer height must be greater than 0' };
  }

  if (!Number.isFinite(normalized.wallCount) || normalized.wallCount < 1) {
    return { error: 'Wall count must be at least 1' };
  }

  return { normalized, material };
}

export function calculateEstimate(volume, settings) {
  const validation = validateEstimateInput(volume, settings);
  if (validation.error) {
    return { error: validation.error };
  }

  const { normalized, material } = validation;

  const shellRatio = Math.min((normalized.wallCount * NOZZLE_DIAMETER * 2) / 10, 0.5);
  const matVolRatio = shellRatio + (1 - shellRatio) * (normalized.infill / 100);
  const matVol = volume * matVolRatio;
  const weight = matVol * material.density;

  const extRate = NOZZLE_DIAMETER * normalized.layerHeight * BASE_SPEED * material.speedFactor;
  const timeH = (matVol * 1000) / extRate / 3600 * (normalized.support ? 1.15 : 1.0);

  const materialCost = weight * material.pricePerGram;
  const machineCost = timeH * MACHINE_RATE;
  const overhead = OVERHEAD;
  const shipping = SHIPPING;
  const total = materialCost + machineCost + overhead + shipping;

  const hrs = Math.floor(timeH);
  const mins = Math.round((timeH - hrs) * 60);
  const printTime = hrs > 0 ? `${hrs} ชม. ${mins} นาที` : `${mins} นาที`;

  return {
    volume: volume.toFixed(2),
    weight: weight.toFixed(1),
    printTime,
    materialCost: materialCost.toFixed(2),
    machineCost: machineCost.toFixed(2),
    overhead: overhead.toFixed(2),
    shipping: shipping.toFixed(2),
    total: total.toFixed(2),
  };
}

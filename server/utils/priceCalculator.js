import { MATERIALS, MACHINE_RATE, OVERHEAD, BASE_SPEED, NOZZLE_DIAMETER } from '../data/materials.js';

export function calculatePrice(volume, settings) {
  const m = MATERIALS[settings.material];

  const shellRatio = Math.min((settings.wallCount * NOZZLE_DIAMETER * 2) / 10, 0.5);
  const matVolRatio = shellRatio + (1 - shellRatio) * (settings.infill / 100);
  const matVol = volume * matVolRatio;
  const weight = matVol * m.density;

  const extRate = NOZZLE_DIAMETER * settings.layerHeight * BASE_SPEED * m.speedFactor;
  const timeH = (matVol * 1000) / extRate / 3600 * (settings.support ? 1.15 : 1.0);

  const materialCost = weight * m.pricePerGram;
  const machineCost = timeH * MACHINE_RATE;
  const overhead = OVERHEAD;
  const total = materialCost + machineCost + overhead;

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
    total: total.toFixed(2),
  };
}

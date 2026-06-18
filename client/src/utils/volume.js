export function computeVolume(geo) {
  const pos = geo.attributes.position;
  let vol = 0;
  for (let i = 0; i < pos.count; i += 3) {
    const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
    const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
    const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);
    vol += (ax * (by * cz - cy * bz) - bx * (ay * cz - cy * az) + cx * (ay * bz - by * az)) / 6.0;
  }
  return Math.abs(vol) / 1000;
}

export function computeTotalVolume(models) {
  return models.reduce((sum, m) => sum + computeVolume(m.geometry), 0);
}

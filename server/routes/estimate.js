import { Router } from 'express';
import { calculatePrice } from '../utils/priceCalculator.js';

const router = Router();

router.post('/', (req, res) => {
  const { volume, settings } = req.body;

  if (!volume || volume <= 0) {
    return res.status(400).json({ error: 'Volume must be greater than 0' });
  }

  if (!settings || !settings.material) {
    return res.status(400).json({ error: 'Settings with material is required' });
  }

  const result = calculatePrice(volume, settings);
  res.json(result);
});

export default router;

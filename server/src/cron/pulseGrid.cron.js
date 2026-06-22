import cron from 'node-cron';
import { recomputeAllWards } from '../services/pulseGrid.service.js';

export function startPulseGridCron() {
    cron.schedule('0 * * * *', async () => {
        const startedAt = Date.now();
        try {
            const result = await recomputeAllWards();
            const ms = Date.now() - startedAt;
            console.log(`[PulseGrid] ✓  Recomputed ${result.updated} wards in ${ms}ms`);
        } catch (err) {
            console.error('[PulseGrid] ✗  Recompute failed:', err.message);
        }
    });

    console.log('[PulseGrid] ✓  Hourly cron job scheduled (runs at :00 every hour).');
}

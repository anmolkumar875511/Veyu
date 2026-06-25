import cron from 'node-cron';
import { recomputeAllWards } from '../services/pulseGrid.service.js';
import { logger } from '../utils/logger.js';
import { PULSE_GRID } from '../constants/index.js';

export function startPulseGridCron() {
    cron.schedule(PULSE_GRID.RECOMPUTE_CRON, async () => {
        const t = Date.now();
        try {
            const result = await recomputeAllWards();
            logger.success(
                'PulseGrid',
                `Recomputed ${result.updated} wards in ${Date.now() - t}ms`
            );
        } catch (err) {
            logger.error('PulseGrid', 'Hourly recompute failed', err);
        }
    });
    logger.info('PulseGrid', `Cron scheduled (${PULSE_GRID.RECOMPUTE_CRON})`);
}

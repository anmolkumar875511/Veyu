import { Router } from 'express';
import { recomputeAllWards } from '../services/pulseGrid.service.js';
import { generateForecasts, expireAndScoreForecasts } from '../services/silentSignal.service.js';
import { logger } from '../utils/logger.js';

const router = Router();

function verifyCronSecret(req, res, next) {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
        logger.error('Cron', 'CRON_SECRET is not set — refusing to run cron job');
        return res.status(500).json({ success: false, message: 'CRON_SECRET not configured' });
    }
    if (req.headers.authorization !== `Bearer ${expected}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
}

router.get('/run', verifyCronSecret, async (_req, res) => {
    const t = Date.now();
    const results = await Promise.allSettled([
        recomputeAllWards(),
        Promise.all([generateForecasts(), expireAndScoreForecasts()]),
    ]);

    const [pulseGrid, silentSignal] = results;

    if (pulseGrid.status === 'fulfilled') {
        logger.success('PulseGrid', `Recomputed ${pulseGrid.value.updated} wards`);
    } else {
        logger.error('PulseGrid', 'Recompute failed', pulseGrid.reason);
    }

    if (silentSignal.status === 'fulfilled') {
        const [gen, score] = silentSignal.value;
        logger.success(
            'SilentSignal',
            `Generated ${gen.created} forecast(s), scored ${score.scored}`
        );
    } else {
        logger.error('SilentSignal', 'Daily job failed', silentSignal.reason);
    }

    const allOk = results.every((r) => r.status === 'fulfilled');
    res.status(allOk ? 200 : 207).json({
        success: allOk,
        tookMs: Date.now() - t,
        pulseGrid: pulseGrid.status === 'fulfilled' ? pulseGrid.value : { error: pulseGrid.reason.message },
        silentSignal:
            silentSignal.status === 'fulfilled'
                ? { generated: silentSignal.value[0], scored: silentSignal.value[1] }
                : { error: silentSignal.reason.message },
    });
});

export default router;

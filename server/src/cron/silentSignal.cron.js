import cron from 'node-cron';
import { generateForecasts, expireAndScoreForecasts } from '../services/silentSignal.service.js';
import { logger } from '../utils/logger.js';
import { SILENT_SIGNAL } from '../constants/index.js';

export function startSilentSignalCron() {
    cron.schedule(SILENT_SIGNAL.DAILY_CRON, async () => {
        const t = Date.now();
        try {
            const [gen, score] = await Promise.all([
                generateForecasts(),
                expireAndScoreForecasts(),
            ]);
            logger.success(
                'SilentSignal',
                `Generated ${gen.created} forecast(s), scored ${score.scored} in ${Date.now() - t}ms`
            );
        } catch (err) {
            logger.error('SilentSignal', 'Daily job failed', err);
        }
    });
    logger.info('SilentSignal', `Cron scheduled (${SILENT_SIGNAL.DAILY_CRON})`);
}

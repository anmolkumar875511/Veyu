import cron from 'node-cron';
import { generateForecasts, expireAndScoreForecasts } from '../services/silentSignal.service.js';

export function startSilentSignalCron() {
    cron.schedule('0 2 * * *', async () => {
        const startedAt = Date.now();
        try {
            const genResult = await generateForecasts();
            const scoreResult = await expireAndScoreForecasts();
            const ms = Date.now() - startedAt;
            console.log(
                `[SilentSignal] ✓  Generated ${genResult.created} forecasts, ` +
                    `scored ${scoreResult.scored} (${scoreResult.confirmed} confirmed, ${scoreResult.expired} expired) in ${ms}ms`
            );
        } catch (err) {
            console.error('[SilentSignal] ✗  Daily job failed:', err.message);
        }
    });

    console.log('[SilentSignal] ✓  Daily cron job scheduled (runs at 02:00 every day).');
}

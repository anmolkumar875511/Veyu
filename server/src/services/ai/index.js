import * as geminiProvider from './providers/gemini.provider.js';

const PROVIDERS = {
    gemini: geminiProvider,
};

const REQUIRED_METHODS = [
    'classifyComplaint',
    'scoreSeverity',
    'generateTitle',
    'checkDuplicateText',
    'classifyObservation',
];

function resolveProvider() {
    const name = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const provider = PROVIDERS[name];

    if (!provider) {
        throw new Error(
            `Unknown AI_PROVIDER "${name}". Available providers: ${Object.keys(PROVIDERS).join(', ')}.`
        );
    }

    const missing = REQUIRED_METHODS.filter((method) => typeof provider[method] !== 'function');
    if (missing.length > 0) {
        throw new Error(
            `AI provider "${name}" is missing required method(s): ${missing.join(', ')}.`
        );
    }

    return provider;
}

const activeProvider = resolveProvider();

export const classifyComplaint = activeProvider.classifyComplaint;
export const scoreSeverity = activeProvider.scoreSeverity;
export const generateTitle = activeProvider.generateTitle;
export const checkDuplicateText = activeProvider.checkDuplicateText;
export const classifyObservation = activeProvider.classifyObservation;

export function safeParseJSON(text) {
    try {
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return null;
    }
}

export async function fetchImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
        base64: buffer.toString('base64'),
        mimeType: response.headers.get('content-type') ?? 'image/jpeg',
    };
}

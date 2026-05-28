import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://yomitranslate.com';

/**
 * Base64url encoding helper
 */
function base64url(str, encoding = 'utf8') {
    return Buffer.from(str, encoding)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

/**
 * Generates Google OAuth2 Access Token using Service Account Key JSON
 */
async function getAccessToken(key) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat
    };

    const signatureInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
    
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = base64url(sign.sign(key.private_key));

    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to obtain Google OAuth2 token: ${errText}`);
    }

    const data = await res.json();
    return data.access_token;
}

/**
 * Publishes a URL notification to Google Indexing API
 * @param {string} url The page URL to index/update
 */
export async function notifyGoogleIndexing(url) {
    try {
        const keyPath = path.join(process.cwd(), 'google-indexing-key.json');
        if (!fs.existsSync(keyPath)) {
            console.log(`[Google Indexing] google-indexing-key.json not found in root. Skipping indexing for: ${url}`);
            return false;
        }

        const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        if (!key.client_email || !key.private_key) {
            console.warn('[Google Indexing] Invalid google-indexing-key.json format. Missing email or key.');
            return false;
        }

        console.log(`[Google Indexing] Requesting OAuth token for: ${url}`);
        const accessToken = await getAccessToken(key);

        console.log(`[Google Indexing] Sending URL publication notification to Google Indexing API...`);
        const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                url,
                type: 'URL_UPDATED'
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Google Indexing] API notification failed: ${errText}`);
            return false;
        }

        console.log(`[Google Indexing] Successfully notified Google to index/update: ${url}`);
        return true;
    } catch (err) {
        console.error('[Google Indexing] Error occurred during Google Indexing notification:', err.message);
        return false;
    }
}

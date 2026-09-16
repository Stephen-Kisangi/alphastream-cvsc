import {
    getAffiliateToken,
    getAuthBaseUrl,
    getOAuthAppId,
    getOAuthClientId,
    getOAuthRedirectUri,
    getUtmCampaign,
} from '../brand';

// ---------------------------------------------------------------------------
// PKCE helpers (duplicated here to avoid circular dependency with core)
// ---------------------------------------------------------------------------

const generateCodeVerifier = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const PKCE_VERIFIER_KEY = 'oauth_code_verifier';
const PKCE_EXPIRY_KEY = 'oauth_code_verifier_timestamp';

const storePKCEVerifier = (verifier: string): void => {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(PKCE_EXPIRY_KEY, String(Date.now()));
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Redirects to the OAuth2 authorize endpoint using PKCE.
 * Uses window.location.replace() so the authorize URL does not appear
 * in browser history (prevents back-button returning to a broken state).
 *
 * @param mode 'login' shows Deriv's sign-in form (default). 'signup' shows
 * the account creation form instead — both redirect back to the same
 * redirect_uri afterwards with session tokens, landing on the Welcome
 * screen either way. This replaces the old dead-end raw signup link.
 */
export const redirectToLogin = async (_language?: string, mode: 'login' | 'signup' = 'login'): Promise<void> => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    storePKCEVerifier(verifier);

    const csrf_token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    sessionStorage.setItem('oauth_csrf_token', csrf_token);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: getOAuthClientId(),
        redirect_uri: getOAuthRedirectUri(),
        scope: 'trade',
        state: csrf_token,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    });
    const oauth_app_id = getOAuthAppId();
    if (oauth_app_id) params.set('app_id', oauth_app_id);

    if (mode === 'signup') params.set('prompt', 'registration');

    // Alphastream: tag both new signups and logins with our affiliate
    // token so trades are correctly attributed to our partner account.
    const affiliate_token = getAffiliateToken();
    if (affiliate_token) params.set('affiliate_token', affiliate_token);
    const utm_campaign = getUtmCampaign();
    if (utm_campaign) params.set('utm_campaign', utm_campaign);

    const auth_url = `${getAuthBaseUrl()}/oauth2/auth?${params}`;
    window.location.replace(auth_url);
};

/**
 * Starts Deriv's account-creation flow via OAuth (prompt=registration)
 * instead of opening a separate, disconnected signup tab. The user ends up
 * back on redirect_uri — the same Welcome screen a login produces.
 */
export const redirectToSignUp = async (_language?: string): Promise<void> => {
    await redirectToLogin(_language, 'signup');
};

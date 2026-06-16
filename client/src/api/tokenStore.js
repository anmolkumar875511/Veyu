let _accessToken = null;

export function setAccessToken(token) {
    _accessToken = token;
}

export function getAccessToken() {
    return _accessToken;
}

export function clearAccessToken() {
    _accessToken = null;
}

export function hasAccessToken() {
    return _accessToken !== null;
}

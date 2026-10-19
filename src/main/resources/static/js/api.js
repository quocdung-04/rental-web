// Small fetch wrapper shared by every page. All calls go to the Spring Boot REST API under /api.
const API_BASE = '/api';
const MANAGER_TOKEN_KEY = 'ancuManagerToken';

async function apiRequest(method, url, body) {
    let res;
    try {
        const headers = {};
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        const token = sessionStorage.getItem(MANAGER_TOKEN_KEY);
        if (token) {
            headers['X-Manager-Token'] = token;
        }
        res = await fetch(API_BASE + url, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        throw { status: 0, message: 'Cannot reach the server. Please try again in a moment.', errors: null };
    }
    if (res.status === 204) {
        return null;
    }
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    if (!res.ok) {
        throw {
            status: res.status,
            message: data && data.message ? data.message : 'Something went wrong (HTTP ' + res.status + ').',
            errors: data && data.errors ? data.errors : null
        };
    }
    return data;
}

const api = {
    get: function (url) { return apiRequest('GET', url); },
    post: function (url, body) { return apiRequest('POST', url, body); },
    put: function (url, body) { return apiRequest('PUT', url, body); },
    del: function (url) { return apiRequest('DELETE', url); }
};

function esc(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// 32000000 -> "32.000.000 ₫"
function formatVnd(value) {
    return String(Math.round(Number(value))).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}

// ---- Shared form helpers (used by report.js and manager.js) ----

// Show server / client field errors under the matching inputs: errors = { fieldName: 'message' }
function showFieldErrors(root, errors) {
    root.querySelectorAll('.field-error').forEach(function (el) {
        const msg = errors && errors[el.getAttribute('data-for')];
        el.textContent = msg || '';
        const input = root.querySelector('[name="' + el.getAttribute('data-for') + '"]');
        if (input) {
            input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        }
    });
}

// "0901 234.567" -> "0901234567"
function cleanPhone(value) {
    return String(value || '').replace(/[\s.\-()]/g, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{9,14}$/;

// Show or hide an element regardless of the CSS that styles it.
function setVisible(el, visible) {
    el.style.display = visible ? '' : 'none';
}

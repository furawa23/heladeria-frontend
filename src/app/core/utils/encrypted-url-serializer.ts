import { DefaultUrlSerializer, UrlTree } from '@angular/router';

// Algoritmo de cifrado de flujo simétrico RC4 para cifrar/descifrar strings sincrónicamente.
function rc4(key: string, str: string): string {
    const s: number[] = [];
    for (let i = 0; i < 256; i++) {
        s[i] = i;
    }
    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        const temp = s[i];
        s[i] = s[j];
        s[j] = temp;
    }
    let i = 0;
    j = 0;
    let res = '';
    for (let y = 0; y < str.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        const temp = s[i];
        s[i] = s[j];
        s[j] = temp;
        const k = s[(s[i] + s[j]) % 256];
        res += String.fromCharCode(str.charCodeAt(y) ^ k);
    }
    return res;
}

const SECRET_KEY = 'heladeria-super-secret-key-for-routing';

export function encryptUrl(text: string): string {
    try {
        const encrypted = rc4(SECRET_KEY, text);
        // Base64 codificado de manera segura para UTF-8 y URLs
        const base64 = btoa(unescape(encodeURIComponent(encrypted)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (e) {
        return text;
    }
}

export function decryptUrl(cipherText: string): string {
    try {
        let base64 = cipherText.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const decoded = decodeURIComponent(escape(atob(base64)));
        return rc4(SECRET_KEY, decoded);
    } catch (e) {
        return cipherText;
    }
}

export class EncryptedUrlSerializer extends DefaultUrlSerializer {
    override parse(url: string): UrlTree {
        let tempUrl = url;
        // Quitar leading slash para facilitar el chequeo
        if (tempUrl.startsWith('/')) {
            tempUrl = tempUrl.slice(1);
        }

        // Si empieza con 'enc/', extraemos la parte cifrada y la desciframos
        if (tempUrl.startsWith('enc/')) {
            const encryptedPart = tempUrl.slice(4);
            const decrypted = decryptUrl(encryptedPart);
            // El path descifrado debe iniciar con /
            const targetUrl = decrypted.startsWith('/') ? decrypted : '/' + decrypted;
            return super.parse(targetUrl);
        }

        // Si es una ruta normal (como /auth/login), se parsea tal cual
        return super.parse(url);
    }

    override serialize(tree: UrlTree): string {
        const path = super.serialize(tree);

        // No cifrar la ruta vacía, '/' ni las rutas de autenticación
        if (!path || path === '/' || path.startsWith('/auth/') || path === '/auth') {
            return path;
        }

        // Cifrar el path y retornarlo bajo el prefijo '/enc/'
        const encrypted = encryptUrl(path);
        return `/enc/${encrypted}`;
    }
}

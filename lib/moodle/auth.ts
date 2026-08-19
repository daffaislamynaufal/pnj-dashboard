import { MOODLE_CONFIG } from './config';
import { MoodleSessionData } from '@/types/moodle';
import * as cheerio from 'cheerio';

interface LoginResult {
  success: boolean;
  session?: MoodleSessionData;
  error?: string;
}

export class MoodleAuthService {
  /**
   * Performs full authenticated Moodle login.
   * Extracts CSRF logintoken, performs POST, verifies cookies and sesskey.
   * NEVER logs passwords, cookies, or sensitive tokens.
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
      return { success: false, error: 'Username (NIM) dan password wajib diisi.' };
    }

    try {
      // Step 1: Request the login page to acquire CSRF logintoken and initial session cookies
      const initialRes = await fetch(MOODLE_CONFIG.loginUrl, {
        method: 'GET',
        headers: {
          'User-Agent': MOODLE_CONFIG.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        cache: 'no-store',
      });

      if (!initialRes.ok) {
        return {
          success: false,
          error: `Gagal mengakses halaman login PNJ E-Learning (HTTP ${initialRes.status}).`,
        };
      }

      const initialHtml = await initialRes.text();
      const $initial = cheerio.load(initialHtml);
      const logintoken = $initial('input[name="logintoken"]').val() as string || '';

      // Extract set-cookie headers
      const setCookies = initialRes.headers.getSetCookie 
        ? initialRes.headers.getSetCookie() 
        : (initialRes.headers.get('set-cookie')?.split(/,(?=\s*[a-zA-Z0-9_-]+=)/) || []);

      const cookieJar = new Map<string, string>();
      for (const cookieStr of setCookies) {
        const parts = cookieStr.split(';')[0].trim().split('=');
        if (parts.length >= 2) {
          cookieJar.set(parts[0], parts.slice(1).join('='));
        }
      }

      // Step 2: Prepare POST form payload
      const formParams = new URLSearchParams();
      formParams.append('username', username.trim());
      formParams.append('password', password);
      if (logintoken) {
        formParams.append('logintoken', logintoken);
      }

      const requestCookieHeader = Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      const loginRes = await fetch(MOODLE_CONFIG.loginUrl, {
        method: 'POST',
        headers: {
          'User-Agent': MOODLE_CONFIG.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': requestCookieHeader,
          'Origin': MOODLE_CONFIG.baseUrl,
          'Referer': MOODLE_CONFIG.loginUrl,
        },
        body: formParams.toString(),
        redirect: 'manual', // Do not automatically follow redirect so we capture redirect headers & cookies
      });

      // Update cookie jar from response
      const loginCookies = loginRes.headers.getSetCookie 
        ? loginRes.headers.getSetCookie() 
        : (loginRes.headers.get('set-cookie')?.split(/,(?=\s*[a-zA-Z0-9_-]+=)/) || []);

      for (const cookieStr of loginCookies) {
        const parts = cookieStr.split(';')[0].trim().split('=');
        if (parts.length >= 2) {
          cookieJar.set(parts[0], parts.slice(1).join('='));
        }
      }

      const finalCookieHeader = Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');

      // Check if redirect indicates successful login (302/303 to /my/ or home)
      const location = loginRes.headers.get('location') || '';
      const isRedirectSuccess = (loginRes.status === 303 || loginRes.status === 302) &&
        !location.includes('login/index.php');

      // If status 200, check body content for error messages
      if (loginRes.status === 200) {
        const bodyText = await loginRes.text();
        if (bodyText.includes('loginerrormessage') || bodyText.includes('Invalid login') || bodyText.includes('Nama pengguna atau kata sandi tidak valid')) {
          return {
            success: false,
            error: 'Username (NIM) atau password salah. Silakan coba lagi.',
          };
        }
      }

      // Step 3: Fetch dashboard to verify session and extract sesskey / fullname
      const verifyRes = await fetch(MOODLE_CONFIG.dashboardUrl, {
        method: 'GET',
        headers: {
          'User-Agent': MOODLE_CONFIG.userAgent,
          'Cookie': finalCookieHeader,
        },
        cache: 'no-store',
      });

      const verifyHtml = await verifyRes.text();
      
      // Check if we are still redirected to login
      if (verifyHtml.includes('id="page-login-index"') || verifyHtml.includes('name="logintoken"')) {
        return {
          success: false,
          error: 'Autentikasi gagal. Akun tidak dapat masuk ke PNJ E-Learning.',
        };
      }

      const $verify = cheerio.load(verifyHtml);
      let sesskey: string | undefined;

      // Extract sesskey from M.cfg javascript object
      const mCfgMatch = verifyHtml.match(/"sesskey":"([a-zA-Z0-9]+)"/);
      if (mCfgMatch && mCfgMatch[1]) {
        sesskey = mCfgMatch[1];
      } else {
        const sesskeyInput = $verify('input[name="sesskey"]').val();
        if (sesskeyInput) sesskey = String(sesskeyInput);
      }

      // Extract user fullname from user menu
      const fullname = $verify('.userbutton .usertext').text().trim() ||
        $verify('.usertext').text().trim() ||
        username;

      // Step 4: Optionally attempt Level 1 Token Service
      let wstoken: string | undefined;
      try {
        const tokenRes = await fetch(
          `${MOODLE_CONFIG.tokenUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&service=moodle_mobile_app`,
          {
            method: 'GET',
            headers: { 'User-Agent': MOODLE_CONFIG.userAgent },
            cache: 'no-store',
          }
        );
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          if (tokenData && tokenData.token) {
            wstoken = tokenData.token;
          }
        }
      } catch {
        // Token service optional, fallback will be used seamlessly
      }

      const sessionData: MoodleSessionData = {
        cookie: finalCookieHeader,
        sesskey,
        wstoken,
        username,
        fullname,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      };

      return {
        success: true,
        session: sessionData,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Terjadi kendala jaringan saat menghubungi PNJ E-Learning: ${err?.message || 'Timeout/Network Error'}`,
      };
    }
  }
}

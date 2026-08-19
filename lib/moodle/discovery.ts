import { MOODLE_CONFIG } from './config';
import { MoodleDiscoveryReport } from '@/types/moodle';

export class MoodleDiscoveryService {
  static async discover(): Promise<MoodleDiscoveryReport> {
    const report: MoodleDiscoveryReport = {
      detected: true,
      versionEstimate: 'Moodle 5.x',
      theme: 'adaptable',
      tokenEndpoint: { available: false, status: 0 },
      webServiceEndpoint: { available: false, status: 0 },
      ajaxEndpoint: { available: false, status: 0 },
      loginEndpoint: { available: false, csrfDetected: false },
      recommendedTier: 'level2_ajax',
      timestamp: new Date().toISOString(),
    };

    // 1. Inspect Login page
    try {
      const res = await fetch(MOODLE_CONFIG.loginUrl, { method: 'GET', headers: { 'User-Agent': MOODLE_CONFIG.userAgent } });
      report.loginEndpoint.status = res.status;
      if (res.ok) {
        const text = await res.text();
        report.loginEndpoint.available = true;
        report.loginEndpoint.csrfDetected = text.includes('name="logintoken"');
      }
    } catch {
      report.loginEndpoint.available = false;
    }

    // 2. Inspect Token service
    try {
      const res = await fetch(MOODLE_CONFIG.tokenUrl, { method: 'GET', headers: { 'User-Agent': MOODLE_CONFIG.userAgent } });
      report.tokenEndpoint.status = res.status;
      report.tokenEndpoint.available = res.status === 200;
    } catch {
      report.tokenEndpoint.available = false;
    }

    // 3. Inspect WebService endpoint
    try {
      const res = await fetch(MOODLE_CONFIG.webServiceUrl, { method: 'GET', headers: { 'User-Agent': MOODLE_CONFIG.userAgent } });
      report.webServiceEndpoint.status = res.status;
      report.webServiceEndpoint.available = res.status === 200;
    } catch {
      report.webServiceEndpoint.available = false;
    }

    // 4. Inspect AJAX service
    try {
      const res = await fetch(MOODLE_CONFIG.ajaxServiceUrl, { method: 'GET', headers: { 'User-Agent': MOODLE_CONFIG.userAgent } });
      report.ajaxEndpoint.status = res.status;
      report.ajaxEndpoint.available = res.status === 200;
    } catch {
      report.ajaxEndpoint.available = false;
    }

    // Determine recommended tier
    if (report.tokenEndpoint.available && report.webServiceEndpoint.available) {
      report.recommendedTier = 'level1_rest';
    } else if (report.ajaxEndpoint.available) {
      report.recommendedTier = 'level2_ajax';
    } else {
      report.recommendedTier = 'level4_html';
    }

    return report;
  }
}

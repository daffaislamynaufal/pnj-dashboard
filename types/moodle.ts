/**
 * Raw Moodle Response Types for REST, AJAX, and Session
 */

export interface MoodleSessionData {
  cookie: string;
  sesskey?: string;
  wstoken?: string;
  userId?: number | string;
  username: string;
  fullname?: string;
  expiresAt: number;
}

export interface MoodleAjaxRequest {
  index: number;
  methodname: string;
  args: Record<string, any>;
}

export interface MoodleAjaxResponse<T = any> {
  error: boolean;
  data?: T;
  exception?: {
    message: string;
    errorcode: string;
    link?: string;
    moreinfourl?: string;
  };
}

export interface MoodleDiscoveryReport {
  detected: boolean;
  versionEstimate: string;
  theme: string;
  tokenEndpoint: {
    available: boolean;
    status: number;
  };
  webServiceEndpoint: {
    available: boolean;
    status: number;
  };
  ajaxEndpoint: {
    available: boolean;
    status: number;
  };
  loginEndpoint: {
    available: boolean;
    csrfDetected: boolean;
    status?: number;
  };
  recommendedTier: 'level1_rest' | 'level2_ajax' | 'level3_http' | 'level4_html';
  timestamp: string;
}

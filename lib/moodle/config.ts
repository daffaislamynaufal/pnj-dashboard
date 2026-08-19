/**
 * Centralized Moodle & AI Configurations
 * STRICT RULE: Never hardcode 'https://elearning.pnj.ac.id' in random files.
 * Always import MOODLE_BASE_URL from this file.
 */

export const MOODLE_BASE_URL = 'https://elearning.pnj.ac.id';

export const MOODLE_CONFIG = {
  baseUrl: MOODLE_BASE_URL,
  loginUrl: `${MOODLE_BASE_URL}/login/index.php`,
  tokenUrl: `${MOODLE_BASE_URL}/login/token.php`,
  webServiceUrl: `${MOODLE_BASE_URL}/webservice/rest/server.php`,
  ajaxServiceUrl: `${MOODLE_BASE_URL}/lib/ajax/service.php`,
  coursesUrl: `${MOODLE_BASE_URL}/my/courses.php`,
  dashboardUrl: `${MOODLE_BASE_URL}/my/`,
  calendarUrl: `${MOODLE_BASE_URL}/calendar/view.php`,
  announcementsUrl: `${MOODLE_BASE_URL}/mod/forum/view.php?id=1`,
  gradesOverviewUrl: `${MOODLE_BASE_URL}/grade/report/overview/index.php`,
  timeoutMs: 25000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 PNJAcademicDashboard/1.0',
};

export const AI_ROUTER_CONFIG = {
  endpointUrl: 'https://api.azbry.com/api/ai/deepseek',
  modelName: 'DeepSeek AI (Free Tier)',
  timeoutMs: 30000,
};

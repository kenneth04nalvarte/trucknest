import { AlertThreshold } from '../app/services/MonitoringService';

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  {
    type: 'error',
    condition: 'error_count',
    value: 10,
    duration: 3600000, // 1 hour
    action: () => {
      // Send email notification
      console.warn('Error threshold exceeded: More than 10 errors in the last hour');
    },
  },
  {
    type: 'performance',
    condition: 'loadTime',
    value: 5000, // 5 seconds
    duration: 300000, // 5 minutes
    action: () => {
      // Send Slack notification
      console.warn('Performance threshold exceeded: Page load time over 5 seconds');
    },
  },
  {
    type: 'custom',
    condition: 'user_count',
    value: 1000,
    duration: 86400000, // 24 hours
    action: () => {
      // Send notification to admin dashboard
      console.warn('User threshold exceeded: More than 1000 users in the last 24 hours');
    },
  },
];

export const getMonitoringConfig = () => ({
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enablePerformance: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE === 'true',
  enableErrorTracking: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
  enableUserTracking: process.env.NEXT_PUBLIC_ENABLE_USER_TRACKING === 'true',
  enableCustomEvents: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_EVENTS === 'true',
  alertThresholds: DEFAULT_ALERT_THRESHOLDS,
}); 
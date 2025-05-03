import { FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getPerformance, FirebasePerformance, trace } from 'firebase/performance';
import { LoggingService } from './LoggingService';

export interface MonitoringConfig {
  app: FirebaseApp;
  enableAnalytics: boolean;
  enablePerformance: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
  enableCustomEvents: boolean;
}

export interface AlertThreshold {
  type: 'error' | 'performance' | 'custom';
  condition: string;
  value: number;
  duration: number;
  action: () => void;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private analytics: Analytics | null = null;
  private performance: FirebasePerformance | null = null;
  private logger: LoggingService;
  private config: MonitoringConfig;
  private alertThresholds: AlertThreshold[] = [];

  private constructor(config: MonitoringConfig) {
    this.config = config;
    this.logger = LoggingService.getInstance({
      app: config.app,
      logLevel: 'info',
      enableAnalytics: config.enableAnalytics,
      enablePerformance: config.enablePerformance,
    });
    this.initialize();
  }

  public static getInstance(config: MonitoringConfig): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }

  private initialize(): void {
    if (this.config.enableAnalytics) {
      try {
        this.analytics = getAnalytics(this.config.app);
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    }

    if (this.config.enablePerformance) {
      try {
        this.performance = getPerformance(this.config.app);
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
      }
    }

    // Set up error tracking
    if (this.config.enableErrorTracking) {
      window.addEventListener('error', this.handleError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }

    // Set up performance monitoring
    if (this.config.enablePerformance) {
      this.setupPerformanceMonitoring();
    }
  }

  private handleError = (event: ErrorEvent): void => {
    this.logger.error('Unhandled error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    this.checkAlertThresholds('error', {
      message: event.message,
      error: event.error,
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.logger.error('Unhandled promise rejection', event.reason, {
      promise: event.promise,
    });

    this.checkAlertThresholds('error', {
      message: 'Unhandled promise rejection',
      reason: event.reason,
    });
  };

  private setupPerformanceMonitoring(): void {
    if (!this.performance) return;

    // Monitor page load performance
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      this.logPerformanceMetric('page_load', {
        loadTime: navigationTiming.loadEventEnd - navigationTiming.startTime,
        domContentLoadedTime: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
        firstPaint: navigationTiming.domInteractive - navigationTiming.startTime,
      });
    }

    // Monitor resource loading
    const resources = performance.getEntriesByType('resource');
    resources.forEach((resource) => {
      this.logPerformanceMetric('resource_load', {
        name: resource.name,
        duration: resource.duration,
        initiatorType: (resource as PerformanceResourceTiming).initiatorType,
      });
    });
  }

  private logPerformanceMetric(name: string, data: Record<string, unknown>): void {
    if (!this.performance) return;

    const perfTrace = trace(this.performance, name);
    perfTrace.start();

    Object.entries(data).forEach(([key, value]) => {
      perfTrace.putAttribute(key, String(value));
    });

    perfTrace.stop();

    this.checkAlertThresholds('performance', { name, ...data });
  }

  public trackUserAction(action: string, data?: Record<string, unknown>): void {
    if (!this.config.enableUserTracking) return;

    this.logger.info(`User action: ${action}`, data);
    this.checkAlertThresholds('custom', { action, ...data });
  }

  public setAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.push(threshold);
  }

  private checkAlertThresholds(type: AlertThreshold['type'], data: Record<string, unknown>): void {
    const relevantThresholds = this.alertThresholds.filter(
      (threshold) => threshold.type === type
    );

    relevantThresholds.forEach((threshold) => {
      const value = data[threshold.condition];
      if (typeof value === 'number' && value >= threshold.value) {
        this.logger.warn(`Alert threshold exceeded: ${threshold.condition}`, undefined, {
          threshold,
          data,
        });
        threshold.action();
      }
    });
  }

  public trackCustomEvent(name: string, data?: Record<string, unknown>): void {
    if (!this.config.enableCustomEvents) return;

    this.logger.info(`Custom event: ${name}`, data);
    this.checkAlertThresholds('custom', { name, ...data });
  }

  public trackError(error: Error, context?: Record<string, unknown>): void {
    if (!this.config.enableErrorTracking) return;

    this.logger.error('Tracked error', error, context);
    this.checkAlertThresholds('error', { error, ...context });
  }

  public trackPerformance(name: string, duration: number, data?: Record<string, unknown>): void {
    if (!this.config.enablePerformance) return;

    this.logPerformanceMetric(name, { duration, ...data });
  }

  public getNavigationTiming(): Record<string, number> {
    if (typeof window === 'undefined') {
      return {};
    }

    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationTiming) {
      return {};
    }

    return {
      loadTime: navigationTiming.loadEventEnd - navigationTiming.startTime,
      domContentLoadedTime: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
      firstPaint: navigationTiming.domInteractive - navigationTiming.startTime,
    };
  }

  public startTrace(name: string) {
    if (!this.performance) {
      console.warn('Performance monitoring is not initialized');
      return null;
    }

    return trace(this.performance, name);
  }
} 
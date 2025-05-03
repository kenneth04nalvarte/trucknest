import { FirebaseApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getPerformance, trace } from 'firebase/performance';
import { FirebasePerformance } from 'firebase/performance';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface LoggingConfig {
  app: FirebaseApp;
  enableAnalytics?: boolean;
  enablePerformance?: boolean;
  logLevel?: LogLevel;
}

export class LoggingService {
  private static instance: LoggingService;
  private analytics: Analytics | null = null;
  private performance: FirebasePerformance | null = null;
  private config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = {
      enableAnalytics: true,
      enablePerformance: true,
      logLevel: 'info',
      ...config
    };
    this.initialize();
  }

  public static getInstance(config: LoggingConfig): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(config);
    }
    return LoggingService.instance;
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
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevel = this.config.logLevel ?? 'info';
    return levels.indexOf(level) >= levels.indexOf(configLevel);
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, error, metadata } = entry;
    const timestamp = entry.timestamp.toISOString();

    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    const logData = metadata ? { ...metadata, error } : { error };

    switch (level) {
      case 'debug':
        console.debug(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'error':
        console.error(logMessage, logData);
        break;
    }
  }

  private logToAnalytics(entry: LogEntry): void {
    if (!this.analytics) return;

    const { level, message, metadata } = entry;
    const eventName = `log_${level}`;

    logEvent(this.analytics, eventName, {
      message,
      ...metadata,
    });
  }

  private logToPerformance(entry: LogEntry): void {
    if (!this.performance) return;

    const { level, message } = entry;
    const traceName = `log_${level}_${message}`;

    const perfTrace = trace(this.performance, traceName);
    perfTrace.start();

    // Add custom attributes
    perfTrace.putAttribute('level', level);
    perfTrace.putAttribute('message', message);

    perfTrace.stop();
  }

  public log(level: LogLevel, message: string, error?: Error, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      error,
      metadata,
      timestamp: new Date(),
    };

    // Log to console in all environments
    this.logToConsole(entry);

    // Log to analytics and performance in production
    if (process.env.NODE_ENV === 'production') {
      this.logToAnalytics(entry);
      this.logToPerformance(entry);
    }
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, undefined, metadata);
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, undefined, metadata);
  }

  public warn(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('warn', message, error, metadata);
  }

  public error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('error', message, error, metadata);
  }

  public startTrace(traceName: string) {
    if (!this.performance) {
      console.warn('Performance monitoring is not initialized');
      return null;
    }

    return trace(this.performance, traceName);
  }
} 
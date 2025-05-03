'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { MonitoringService } from '../app/services/MonitoringService';
import { getMonitoringConfig } from '../config/monitoring';

interface MonitoringContextType {
  monitoringService: {
    trackPerformance: (metricName: string, value: number, data?: Record<string, unknown>) => void;
    trackUserAction: (actionName: string, data?: Record<string, any>) => void;
    setAlertThreshold: (threshold: any) => void;
    trackError: (error: Error, context?: Record<string, unknown>) => void;
    trackCustomEvent: (name: string, data?: Record<string, unknown>) => void;
  };
}

const MonitoringContext = createContext<MonitoringContextType | null>(null);

interface MonitoringProviderProps {
  children: React.ReactNode;
  app: FirebaseApp;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children, app }) => {
  const monitoringService = useMemo(() => {
    const config = getMonitoringConfig();
    const service = MonitoringService.getInstance({
      app,
      ...config,
    });

    // Set up alert thresholds
    config.alertThresholds.forEach((threshold) => {
      service.setAlertThreshold(threshold);
    });

    // Return a plain object with the necessary methods and data.
    return {
      trackPerformance: (metricName: string, value: number, data?: Record<string, unknown>) => 
        service.trackPerformance(metricName, value, data),
      trackUserAction: (actionName: string, data?: Record<string, any>) => service.trackUserAction(actionName, data),
      setAlertThreshold: (threshold: any) => service.setAlertThreshold(threshold),
      trackError: (error: Error, context?: Record<string, unknown>) => service.trackError(error, context),
      trackCustomEvent: (name: string, data?: Record<string, unknown>) => service.trackCustomEvent(name, data),
    };
  }, [app]);

  useEffect(() => {
    // Track initial page load
    monitoringService.trackPerformance('initial_page_load', performance.now());

    // Track user session start
    monitoringService.trackUserAction('session_start', {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    });

    return () => {
      // Track user session end
      monitoringService.trackUserAction('session_end');
    };
  }, [monitoringService]);

  return (
    <MonitoringContext.Provider value={{ monitoringService }}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context.monitoringService;
}; 
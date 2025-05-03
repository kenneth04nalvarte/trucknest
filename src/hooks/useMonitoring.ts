import { useCallback } from 'react';
import { useMonitoring } from '../context/MonitoringContext';

export const useTrackAction = () => {
  const monitoringService = useMonitoring();

  return useCallback(
    (action: string, data?: Record<string, unknown>) => {
      monitoringService.trackUserAction(action, data);
    },
    [monitoringService]
  );
};

export const useTrackError = () => {
  const monitoringService = useMonitoring();

  return useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      monitoringService.trackError(error, context);
    },
    [monitoringService]
  );
};

export const useTrackPerformance = () => {
  const monitoringService = useMonitoring();

  return useCallback(
    (name: string, duration: number, data?: Record<string, unknown>) => {
      monitoringService.trackPerformance(name, duration, data);
    },
    [monitoringService]
  );
};

export const useTrackCustomEvent = () => {
  const monitoringService = useMonitoring();

  return useCallback(
    (name: string, data?: Record<string, unknown>) => {
      monitoringService.trackCustomEvent(name, data);
    },
    [monitoringService]
  );
}; 
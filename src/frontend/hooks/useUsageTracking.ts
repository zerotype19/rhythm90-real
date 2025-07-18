import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../lib/api';

interface UsageSummary {
  play_builder: { used: number; limit: number };
  signal_lab: { used: number; limit: number };
  ritual_guide: { used: number; limit: number };
}

interface SubscriptionStatus {
  status: string;
  plan: string;
  customerId: string | null;
  subscriptionId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  trialEndDate?: string;
}

interface UsageTrackingReturn {
  usageSummary: UsageSummary | null;
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  logUsage: (toolName: string) => Promise<{ success: boolean; status: string }>;
  checkUsageLimit: (toolName: string) => Promise<{ status: 'ok' | 'near_limit' | 'over_limit'; used: number; limit: number }>;
  refreshUsage: () => Promise<void>;
}

export const useUsageTracking = (): UsageTrackingReturn => {
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsageSummary = useCallback(async () => {
    try {
      const response = await apiCall('/api/billing/usage-summary');
      if (response.data) {
        setUsageSummary(response.data.usageSummary);
      }
    } catch (error) {
      console.error('Failed to fetch usage summary:', error);
    }
  }, []);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const response = await apiCall('/api/billing/subscription-status');
      if (response.data) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    await Promise.all([fetchUsageSummary(), fetchSubscriptionStatus()]);
  }, [fetchUsageSummary, fetchSubscriptionStatus]);

  const logUsage = useCallback(async (toolName: string) => {
    try {
      const response = await apiCall('/api/usage/log', {
        method: 'POST',
        body: JSON.stringify({ toolName })
      });

      if (response.data) {
        // Refresh usage summary after logging
        await fetchUsageSummary();
        return response.data;
      } else {
        return { success: false, status: response.error || 'error' };
      }
    } catch (error) {
      console.error('Failed to log usage:', error);
      return { success: false, status: 'error' };
    }
  }, [fetchUsageSummary]);

  const checkUsageLimit = useCallback(async (toolName: string) => {
    try {
      const response = await apiCall(`/api/usage/check-limit?tool=${toolName}`);
      if (response.data) {
        return response.data;
      } else {
        // Fallback to checking from usage summary
        if (usageSummary && toolName in usageSummary) {
          const toolUsage = usageSummary[toolName as keyof UsageSummary];
          const used = toolUsage.used;
          const limit = toolUsage.limit;

          if (limit === -1) return { status: 'ok', used, limit };
          if (used >= limit) return { status: 'over_limit', used, limit };
          if (used >= limit * 0.8) return { status: 'near_limit', used, limit };
          return { status: 'ok', used, limit };
        }
        return { status: 'ok', used: 0, limit: 100 };
      }
    } catch (error) {
      console.error('Failed to check usage limit:', error);
      return { status: 'ok', used: 0, limit: 100 };
    }
  }, [usageSummary]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await refreshUsage();
      setIsLoading(false);
    };

    initialize();
  }, [refreshUsage]);

  return {
    usageSummary,
    subscriptionStatus,
    isLoading,
    logUsage,
    checkUsageLimit,
    refreshUsage
  };
}; 
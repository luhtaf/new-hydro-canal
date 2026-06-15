/**
 * TanStack Query slice [reports]. Tiap endpoint = 1 query, di-key per period supaya
 * ganti period selector → refetch granular & cache per-period (klik 30→7→30 instan).
 *
 * Semua server-state read-only; staleTime 60s (analytics tak butuh real-time).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  reportsApi,
  type OperatorStat,
  type QualityBreakdown,
  type RegionStat,
  type ReportKpi,
  type ReportPeriod,
  type TrendGroupBy,
  type TrendPoint,
} from './api.js';

export const reportKeys = {
  all: ['reports'] as const,
  kpi: (p: ReportPeriod) => [...reportKeys.all, 'kpi', p] as const,
  trend: (p: ReportPeriod, g: TrendGroupBy) => [...reportKeys.all, 'trend', p, g] as const,
  region: (p: ReportPeriod) => [...reportKeys.all, 'region', p] as const,
  operator: (p: ReportPeriod) => [...reportKeys.all, 'operator', p] as const,
  breakdown: (p: ReportPeriod) => [...reportKeys.all, 'breakdown', p] as const,
};

const STALE = 60_000;

export function useReportKpi(period: ReportPeriod): UseQueryResult<ReportKpi> {
  return useQuery({
    queryKey: reportKeys.kpi(period),
    queryFn: () => reportsApi.kpi(period),
    staleTime: STALE,
  });
}

export function useReportTrend(
  period: ReportPeriod,
  groupBy: TrendGroupBy = 'day',
): UseQueryResult<TrendPoint[]> {
  return useQuery({
    queryKey: reportKeys.trend(period, groupBy),
    queryFn: () => reportsApi.trend(period, groupBy),
    staleTime: STALE,
  });
}

export function useReportRegion(period: ReportPeriod): UseQueryResult<RegionStat[]> {
  return useQuery({
    queryKey: reportKeys.region(period),
    queryFn: () => reportsApi.perRegion(period),
    staleTime: STALE,
  });
}

export function useReportOperator(period: ReportPeriod): UseQueryResult<OperatorStat[]> {
  return useQuery({
    queryKey: reportKeys.operator(period),
    queryFn: () => reportsApi.perOperator(period),
    staleTime: STALE,
  });
}

export function useReportBreakdown(period: ReportPeriod): UseQueryResult<QualityBreakdown> {
  return useQuery({
    queryKey: reportKeys.breakdown(period),
    queryFn: () => reportsApi.breakdown(period),
    staleTime: STALE,
  });
}

import partDataAggregator from './partDataAggregator.service';

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], ddof = 0) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (values.length - ddof || 1);
  return Math.sqrt(variance);
}

export async function generateForecastForPart(input: { part_id: string; center_id: string; horizon_days?: number }) {
  const payload = await partDataAggregator.buildPartForecastPayload(input);

  const historyQtys = payload.history.map((h: any) => h.qty || 0);
  const daily_mean = mean(historyQtys);
  const daily_std = std(historyQtys);

  const DEFAULT_LEAD_TIME = 14;
  const lt = (payload as any).lead_time_days ?? (payload.metadata?.lead_time_days ?? DEFAULT_LEAD_TIME);
  const mu_lt = daily_mean * lt;
  const sigma_lt = Math.sqrt(lt) * daily_std;
  const z = 1.645; // 95% service level
  const safety_stock = Math.ceil(z * sigma_lt);
  const reorder_point = Math.ceil(mu_lt + safety_stock);
  const computed_min_stock = Math.max(reorder_point, Math.ceil(payload.metadata?.min_stock ?? 0));
  const recommended_min_stock = computed_min_stock;

  return {
    part_id: payload.part_id,
    center_id: payload.center_id,
    horizon_days: payload.horizon_days,
    daily_mean,
    daily_std,
    lead_time_days: lt,
    safety_stock,
    reorder_point,
    recommended_min_stock,
    computed_min_stock,
    current_stock: payload.current_stock,
    history_sample: payload.history.slice(-30)
  };
}

export default {
  generateForecastForPart
};

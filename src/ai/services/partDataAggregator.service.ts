import autoPartService from '../../services/autoPart.service';
import centerAutoPartService from '../../services/centerAutoPart.service';
import serviceDetailService from '../../services/serviceDetail.service';


export async function buildPartForecastPayload({ part_id, center_id, horizon_days = 30 }: { part_id: string; center_id: string; horizon_days?: number }) {
  const part = await autoPartService.getAutoPartById(part_id);

  const centerPartsResp = await centerAutoPartService.getAllCenterAutoParts({ center_id, part_id, page: 1, limit: 1 });
  const centerPart = centerPartsResp.items && centerPartsResp.items.length ? centerPartsResp.items[0] : null;


  const current_stock = centerPart?.quantity ?? 0;

  const centerpartId = centerPart?._id ?? null;
  const history = centerpartId ? await serviceDetailService.getPartHistory(centerpartId, 30) : [];

  const metadata: any = {
    name: part?.name ?? '',
    criticality: 'medium',
    unit_cost: part?.cost_price ?? 0,
    min_stock: centerPart?.min_stock ?? 0,
    recommended_min_stock: centerPart?.recommended_min_stock ?? 0,
    raw_part: part ?? null
  };

  return {
    part_id,
    center_id,
    history,
    current_stock,
    metadata,
    horizon_days
  };
}

export default {
  buildPartForecastPayload
};

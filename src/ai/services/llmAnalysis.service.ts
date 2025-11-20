import { OpenAI } from 'openai';
import { z } from 'zod';
import partDataAggregator from './partDataAggregator.service';
import PartAnalysisModel from '../../models/partAnalysis.model';
import chatSocketService from '../../socket/chat.socket';
import centerAutoPartService from '../../services/centerAutoPart.service';
import moment from 'moment-timezone';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function analyzePart(part_id: string, center_id: string) {
    // Build aggregated payload
    const payload = await partDataAggregator.buildPartForecastPayload({ part_id, center_id, horizon_days: 30 });

    const prompt = `You are an inventory analyst. Given the following payload, produce a JSON with fields: riskLevel (LOW|MEDIUM|HIGH), title, content (short analysis <=300 tokens),suggestedOrderQty (int).

IMPORTANT - Determine riskLevel based on the comparison between current_stock and recommended_min_stock:
- If current_stock < recommended_min_stock * 0.5: riskLevel = HIGH (critically low stock)
- If recommended_min_stock * 0.5 <= current_stock < recommended_min_stock: riskLevel = MEDIUM (stock is below recommended minimum)
- If current_stock >= recommended_min_stock: riskLevel = LOW (stock is sufficient)

Also consider the usage history and trends in your analysis.

PAYLOAD:\n${JSON.stringify(payload)}`;

    const resp = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
            { role: 'system', content: 'You are an assistant that analyzes spare part inventory and recommends actions.' },
            { role: 'user', content: prompt }
        ],
    });

    const text = resp.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty LLM response');

    // Zod schema to validate and provide defaults for the LLM output
    const AnalysisSchema = z.object({
        riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
        title: z.string().default('Analysis'),
        content: z.string().default(''),
        suggestedOrderQty: z.number().int().default(0),
    });

    let parsed: any = null;
    // Try direct JSON parse, then try to extract JSON object substring
    try {
        parsed = JSON.parse(text);
    } catch (err) {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
            try {
                parsed = JSON.parse(m[0]);
            } catch (e) {
                parsed = null;
            }
        }
    }

    // Ensure parsed is an object so zod can apply defaults
    if (typeof parsed !== 'object' || parsed === null) parsed = {};

    const validated = AnalysisSchema.safeParse(parsed);
    if (!validated.success) {
        console.error('LLM output failed schema validation:', validated.error.format());
        // Apply defaults/coercion to avoid throwing and still persist a reasonable record
        parsed = AnalysisSchema.parse(parsed);
    } else {
        parsed = validated.data;
    }

    // Persist result
    const centerParts = await centerAutoPartService.getAllCenterAutoParts({ center_id, part_id, page: 1, limit: 1 });
    const centerPart = centerParts.items && centerParts.items.length ? centerParts.items[0] : null;

    const doc = await PartAnalysisModel.create({
        center_id: center_id,
        part_id: part_id,
        analysis: {
            riskLevel: parsed.riskLevel ?? 'LOW',
            title: parsed.title ?? 'Analysis',
            content: parsed.content ?? (parsed.reason ?? ''),
            suggestedOrderQty: parsed.suggestedOrderQty ?? 0
        },
    } as any);

    // Update centerAutoPart.last_forecast_date to indicate AI ran for this part at this center
    try {
        if (centerPart && centerPart._id) {
            await centerAutoPartService.updateCenterAutoPart(centerPart._id, {
                last_forecast_date: moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm:ss.SSSZ")
            } as any);
        }
        if (parsed.suggestedOrderQty > 0 && centerPart && centerPart._id) {
            await centerAutoPartService.updateCenterAutoPart(centerPart._id, { recommended_min_stock: parsed.suggestedOrderQty } as any);
        }
    } catch (err) {
        // don't block the main flow if updating last_forecast_date fails
        console.error('Failed to update CenterAutoPart.last_forecast_date', err);
    }

    return doc;
}

export default {
    analyzePart
};

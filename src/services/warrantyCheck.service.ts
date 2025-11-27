import PartWarranty from '../models/partWarranty.model';
import ServiceDetail from '../models/serviceDetail.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import AutoPart from '../models/autoPart.model';
import ServiceRecord from '../models/serviceRecord.model';
import VehicleAutoPart from '../models/vehicleAutoPart.model';
import { nowVN } from '../utils/time';
import ChecklistDefect from '../models/checklistDefect.model';
import RecordChecklist from '../models/recordChecklist.model';


export async function checkAndApplyWarranty(
    recordId: string,
    centerpartId: string,
    quantity: number
): Promise<{
    unitPrice: number;
    description: string;
    warrantyQty: number;
    paidQty: number;
    warranties: any[];
    isVehicleInWarranty: boolean;
}> {
    try {
        console.log(`🔍 Checking warranty for part: ${centerpartId}, Qty: ${quantity}`);

        const serviceRecord = await ServiceRecord.findById(recordId).populate({
            path: 'appointment_id',
            populate: { path: 'vehicle_id' }
        });
        if (!serviceRecord) {
            throw new Error(`ServiceRecord not found: ${recordId}`);
        }
        const appointment = serviceRecord.appointment_id as any;
        const vehicle = appointment.vehicle_id as any;
        const vehicleId = vehicle._id;
        console.log(`📍 Xe ID: ${vehicleId}`);

        const centerPart = await CenterAutoPart.findById(centerpartId).populate('part_id');

        if (!centerPart) {
            throw new Error(`CenterAutoPart not found: ${centerpartId}`);
        }

        const autoPart = centerPart.part_id as any;
        const masterPartId = autoPart._id;

        console.log(`📦 Part: ${autoPart.name}`);
        console.log(masterPartId)
        let unitPrice: number;
        let description: string;
        let warrantyQty = 0;
        let paidQty = quantity;
        let warranties: any[] = [];

        const recordChecklists = await RecordChecklist.find({
            record_id: serviceRecord._id
        });

        const checklistDefect = await ChecklistDefect.findOne({
            record_checklist_id: { $in: recordChecklists.map(rc => rc._id) },
            suggested_part_id: autoPart._id,
        });

        const isManufacturerDefect = checklistDefect && checklistDefect.failure_type === 'MANUFACTURER_DEFECT';
        const now = nowVN();
        const isVehicleInWarrantyPeriod = vehicle.vehicle_warranty_start_time &&
            vehicle.vehicle_warranty_end_time &&
            now >= vehicle.vehicle_warranty_start_time &&
            now <= vehicle.vehicle_warranty_end_time;

        if (isVehicleInWarrantyPeriod && isManufacturerDefect) {

            const vehicleWarrantyParts = await VehicleAutoPart.find({
                vehicle_id: vehicleId,
                isWarranty: true
            }).populate('autopart_id');

            // Kiểm tra cùng part_id
            const samePartWarranty = vehicleWarrantyParts.find(
                vap => (vap.autopart_id as any)._id.toString() === masterPartId.toString()
            );

            if (samePartWarranty && samePartWarranty.quantity > 0) {
                // Cùng part_id → free
                warrantyQty = Math.min(samePartWarranty.quantity, quantity);
                paidQty = quantity - warrantyQty;
                unitPrice = autoPart.selling_price;

                description = `Vehicle Warranty (Same Part) ${warrantyQty}/${quantity} (Free)`;
                console.log(`✅ Found same part warranty!`);
                console.log(`   - Warranty: ${warrantyQty}/${quantity} (0 đ)`);
                console.log(`   - New Sale: ${paidQty}/${quantity} (${unitPrice} đ/cái)`);
                console.log(`   - Total: ${paidQty * unitPrice} đ`);

                return { unitPrice, description, warrantyQty, paidQty, warranties, isVehicleInWarranty: true };
            }

            // Kiểm tra cùng category
            const categoryMatch = vehicleWarrantyParts.find(vap => {
                const part = vap.autopart_id as any;
                return part.category === autoPart.category;
            });

            if (categoryMatch) {
                const categoryPart = categoryMatch.autopart_id as any;
                const categoryPartPrice = categoryPart.selling_price || 0;
                const currentPartPrice = autoPart.selling_price || 0;

                if (categoryPartPrice <= currentPartPrice) {
                    // 📌 Warranty part giá <= current part → FREE
                    warrantyQty = Math.min(categoryMatch.quantity, quantity);
                    paidQty = quantity - warrantyQty;
                    unitPrice = autoPart.selling_price;

                    description = `Vehicle Warranty (Same Category) ${warrantyQty}/${quantity} (Free) + New Sale ${paidQty}`;
                    console.log(`✅ Found same category warranty (Price: warranty ${categoryPartPrice}đ <= current ${currentPartPrice}đ)`);
                    console.log(`   - Warranty: ${warrantyQty}/${quantity} (0 đ)`);
                    console.log(`   - New Sale: ${paidQty}/${quantity} (${unitPrice} đ/cái)`);
                    console.log(`   - Total: ${paidQty * unitPrice} đ`);

                    return { unitPrice, description, warrantyQty, paidQty, warranties, isVehicleInWarranty: true };
                } else {
                    // 📌 Warranty part giá > current part → KHÁCH TRẢ CHÊNH LỆCH
                    const priceDifference = categoryPartPrice - currentPartPrice;
                    warrantyQty = Math.min(categoryMatch.quantity, quantity);
                    paidQty = quantity - warrantyQty;
                    unitPrice = priceDifference;  // Khách chỉ trả chênh lệch

                    const totalWarrantyValue = priceDifference * warrantyQty;
                    description = `Vehicle Warranty (Same Category) ${warrantyQty}/${quantity} (Price: ${categoryPartPrice}đ → ${currentPartPrice}đ, Chênh lệch ${priceDifference}đ/cái) + New Sale ${paidQty}`;

                    console.log(`✅ Found same category warranty (Price: warranty ${categoryPartPrice}đ > current ${currentPartPrice}đ)`);
                    console.log(`   - Warranty: ${warrantyQty}/${quantity} chênh lệch ${priceDifference}đ/cái = ${totalWarrantyValue}đ`);
                    console.log(`   - New Sale: ${paidQty}/${quantity} (${autoPart.selling_price} đ/cái)`);
                    console.log(`   - Total: ${totalWarrantyValue + (paidQty * autoPart.selling_price)} đ`);

                    return { unitPrice, description, warrantyQty, paidQty, warranties, isVehicleInWarranty: true };
                }
            }
            unitPrice = autoPart.selling_price;
            warrantyQty = 0;
            paidQty = quantity;
            description = `New Sale ${quantity} (Vehicle in warranty but no matching warranty parts)`;
            console.log(`❌ No matching warranty parts found`);
            console.log(`   - Regular purchase: ${quantity} x ${unitPrice} = ${quantity * unitPrice} đ`);
            return { unitPrice, description, warrantyQty, paidQty, warranties, isVehicleInWarranty: true };
        } else if (isVehicleInWarrantyPeriod && !isManufacturerDefect) {
            console.log(`❌ Vehicle in warranty period nhưng defect type KO PHẢI MANUFACTURER_DEFECT`);
            console.log(`📋 Sẽ check PartWarranty từ lần bán trước`);
        } else {
            console.log(`📋 Vehicle hết bảo hành → Kiểm tra PartWarranty từ lần bán trước`);
        }

        // Check PartWarranty in ALL cases (except isManufacturerDefect within vehicle warranty period)
        console.log(`📋 Checking PartWarranty từ lần bán trước`);

        const activePartWarranties = await PartWarranty.find({
            vehicle_id: vehicleId,
            part_id: masterPartId,
            end_date: { $gte: now },
            warranty_status: 'active'
        });

        console.log(`📊 Found ${activePartWarranties.length} active PartWarranties from previous sale`);

        if (activePartWarranties.length > 0) {
            warrantyQty = Math.min(activePartWarranties.length, quantity);
            paidQty = quantity - warrantyQty;
            unitPrice = autoPart.selling_price;

            // Determine if we're in vehicle warranty period with non-manufacturer defect
            const inVehicleWarrantyButNotManufacturerDefect = isVehicleInWarrantyPeriod && !isManufacturerDefect;

            description = warrantyQty > 0
                ? `Previous Warranty ${warrantyQty}/${quantity} (Free) + New Sale ${paidQty}`
                : `New Sale ${quantity}`;

            console.log(`✅ Found active PartWarranty from previous sale!`);
            console.log(`   - Warranty: ${warrantyQty}/${quantity} (0 đ) [Expires: ${activePartWarranties[0].end_date.toLocaleDateString()}]`);
            console.log(`   - New Sale: ${paidQty}/${quantity} (${unitPrice} đ/cái) - WILL CREATE NEW PartWarranty`);
            console.log(`   - Total: ${paidQty * unitPrice} đ`);

            if (inVehicleWarrantyButNotManufacturerDefect) {
                console.log(`   ℹ️ Note: Vehicle still in warranty period but defect type is not MANUFACTURER_DEFECT`);
                console.log(`   → PartWarranty is still applied from previous sale`);
            }

            return { unitPrice, description, warrantyQty, paidQty, warranties: activePartWarranties, isVehicleInWarranty: false };
        }

        console.log(`🆕 No active PartWarranty found → Regular new sale`);
        unitPrice = autoPart.selling_price;
        warrantyQty = 0;
        paidQty = quantity;

        // Check if vehicle is still in warranty but defect not manufacturer defect
        if (isVehicleInWarrantyPeriod && !isManufacturerDefect) {
            description = `New Sale ${quantity} (Vehicle in warranty period but defect type: ${checklistDefect?.failure_type || 'UNKNOWN'} - NOT MANUFACTURER_DEFECT)`;
            console.log(`⚠️ Vehicle in warranty period but defect not covered`);
        } else {
            description = `New Sale ${quantity} (no warranty)`;
        }

        console.log(`✅ Regular purchase (will create new PartWarranty)`);
        console.log(`   - Regular purchase: ${quantity} x ${unitPrice} = ${quantity * unitPrice} đ`);

        return { unitPrice, description, warrantyQty, paidQty, warranties, isVehicleInWarranty: false };

    } catch (error) {
        console.error('❌ Error in checkAndApplyWarranty:', error);
        throw error;
    }
}
export default {
    checkAndApplyWarranty
};

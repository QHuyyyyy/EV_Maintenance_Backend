import PartWarranty from '../models/partWarranty.model';
import ServiceDetail from '../models/serviceDetail.model';
import CenterAutoPart from '../models/centerAutoPart.model';
import AutoPart from '../models/autoPart.model';
import ServiceRecord from '../models/serviceRecord.model';
import { nowVN } from '../utils/time';


export async function checkAndApplyWarranty(
    recordId: string,
    centerpartId: string,
    quantity: number
): Promise<{
    unitPrice: number;
    description: string;
    warrantyQty: number;           // Số linh kiện được bảo hành (0 đ)
    paidQty: number;               // Số linh kiện cần mua (tính tiền)
    warranties: any[];             // Danh sách bảo hành được sử dụng
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
        const vehicleId = appointment.vehicle_id._id;
        console.log(`📍 Xe ID: ${vehicleId}`);

        const centerPart = await CenterAutoPart.findById(centerpartId).populate('part_id');

        if (!centerPart) {
            throw new Error(`CenterAutoPart not found: ${centerpartId}`);
        }

        const autoPart = centerPart.part_id as any;
        const masterPartId = autoPart._id;

        console.log(`📦 Part: ${autoPart.name}`);

        const today = nowVN();
        today.setHours(0, 0, 0, 0);

        const activeWarranties = await PartWarranty.find({
            vehicle_id: vehicleId,
            part_id: masterPartId,
            end_date: { $gte: today },
            warranty_status: 'active'
        });

        console.log(`📊 Found ${activeWarranties.length} active warranties`);

        let unitPrice: number;
        let description: string;
        let warrantyQty = 0;
        let paidQty = quantity;

        // 4. Quyết định giá dựa trên số lượng bảo hành
        if (activeWarranties.length > 0) {
            warrantyQty = Math.min(activeWarranties.length, quantity); // Dùng tối đa bảo hành có sẵn
            paidQty = quantity - warrantyQty; // Phần còn lại tính tiền

            unitPrice = autoPart.selling_price; // Giá cho phần tính tiền

            if (paidQty === 0) {
                // All covered by warranty
                description = `Warranty ${warrantyQty}/${quantity} (Free, expires: ${activeWarranties[0].end_date.toLocaleDateString()})`;
            } else if (warrantyQty === 0) {
                // No warranty (should not happen)
                description = `New Sale ${quantity}`;
            } else {
                // Partially covered by warranty and partially paid
                description = `Warranty ${warrantyQty} (Free) + New Sale ${paidQty}`;
            }

            console.log(`✅ Found warranty!`);
            console.log(`   - Warranty: ${warrantyQty}/${quantity} (0 đ)`);
            console.log(`   - New Sale: ${paidQty}/${quantity} (${unitPrice} đ/cái)`);
            console.log(`   - Total: ${paidQty * unitPrice} đ`);

        } else {
            unitPrice = autoPart.selling_price;
            warrantyQty = 0;
            paidQty = quantity;
            description = `New Sale ${quantity} (no active warranty)`;

            console.log(`❌ No active warranty found`);
            console.log(`   - Regular purchase: ${quantity} x ${unitPrice} = ${quantity * unitPrice} đ`);
        }

        return {
            unitPrice,
            description,
            warrantyQty,
            paidQty,
            warranties: activeWarranties || []
        };

    } catch (error) {
        console.error('❌ Error in checkAndApplyWarranty:', error);
        throw error;
    }
}


export default {
    checkAndApplyWarranty
};

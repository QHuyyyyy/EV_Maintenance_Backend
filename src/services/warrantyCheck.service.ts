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
        console.log(`🔍 Kiểm tra bảo hành cho linh kiện: ${centerpartId}, Qty: ${quantity}`);

        const serviceRecord = await ServiceRecord.findById(recordId).populate({
            path: 'appointment_id',
            populate: { path: 'vehicle_id' }
        });
        if (!serviceRecord) {
            throw new Error(`ServiceRecord không tìm thấy: ${recordId}`);
        }
        const appointment = serviceRecord.appointment_id as any;
        const vehicleId = appointment.vehicle_id._id;
        console.log(`📍 Xe ID: ${vehicleId}`);

        const centerPart = await CenterAutoPart.findById(centerpartId).populate('part_id');

        if (!centerPart) {
            throw new Error(`CenterAutoPart không tìm thấy: ${centerpartId}`);
        }

        const autoPart = centerPart.part_id as any;
        const masterPartId = autoPart._id;

        console.log(`📦 Linh kiện: ${autoPart.name}`);

        const today = nowVN();
        today.setHours(0, 0, 0, 0);

        console.log(`📅 Ngày hôm nay: ${today.toLocaleDateString()}`);

        // 🔑 BƯỚC QUAN TRỌNG: Tìm TẤT CẢ bảo hành còn hạn (không chỉ 1 cái)
        const activeWarranties = await PartWarranty.find({
            vehicle_id: vehicleId,
            part_id: masterPartId,
            end_date: { $gte: today },
            warranty_status: 'active'
        });

        console.log(`📊 Tìm thấy ${activeWarranties.length} bảo hành còn hạn`);

        let unitPrice: number;
        let description: string;
        let warrantyQty = 0;
        let paidQty = quantity;

        // 4. Quyết định giá dựa trên số lượng bảo hành
        if (activeWarranties.length > 0) {
            // ✅ TÌM THẤY BẢO HÀNH!
            warrantyQty = Math.min(activeWarranties.length, quantity); // Dùng tối đa bảo hành có sẵn
            paidQty = quantity - warrantyQty; // Phần còn lại tính tiền

            unitPrice = autoPart.selling_price; // Giá cho phần tính tiền

            if (paidQty === 0) {
                // Tất cả đều bảo hành
                description = `Bảo hành ${warrantyQty}/${quantity} (Miễn phí, hết hạn: ${activeWarranties[0].end_date.toLocaleDateString()})`;
            } else if (warrantyQty === 0) {
                // Không có bảo hành nào (không lẽ xảy ra)
                description = `Bán mới ${quantity}`;
            } else {
                // Vừa bảo hành vừa bán mới
                description = `Bảo hành ${warrantyQty} (Miễn phí) + Bán mới ${paidQty}`;
            }

            console.log(`✅ Tìm thấy bảo hành!`);
            console.log(`   - Bảo hành: ${warrantyQty}/${quantity} (0 đ)`);
            console.log(`   - Bán mới: ${paidQty}/${quantity} (${unitPrice} đ/cái)`);
            console.log(`   - Tổng tiền: ${paidQty * unitPrice} đ`);

        } else {
            unitPrice = autoPart.selling_price;
            warrantyQty = 0;
            paidQty = quantity;
            description = `Bán mới ${quantity} (không có bảo hành)`;

            console.log(`❌ Không tìm thấy bảo hành còn hạn`);
            console.log(`   - Mua bình thường: ${quantity} x ${unitPrice} = ${quantity * unitPrice} đ`);
        }

        return {
            unitPrice,
            description,
            warrantyQty,
            paidQty,
            warranties: activeWarranties || []
        };

    } catch (error) {
        console.error('❌ Lỗi trong checkAndApplyWarranty:', error);
        throw error;
    }
}


export default {
    checkAndApplyWarranty
};

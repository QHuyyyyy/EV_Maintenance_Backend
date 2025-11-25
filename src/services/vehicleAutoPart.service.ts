import VehicleAutoPart from '../models/vehicleAutoPart.model';

export class VehicleAutoPartService {
    // Lấy tất cả VehicleAutoPart của một xe
    async getVehicleAutoPartsByVehicleId(vehicleId: string) {
        try {
            const vehicleAutoParts = await VehicleAutoPart.find({ vehicle_id: vehicleId })
                .populate('vehicle_id', 'vehicleName model year plateNumber')
                .populate('autopart_id', 'name category cost_price selling_price warranty_time');

            return vehicleAutoParts;
        } catch (error) {
            throw new Error(`Error fetching vehicle auto parts: ${error}`);
        }
    }

    // Lấy VehicleAutoPart by ID
    async getVehicleAutoPartById(id: string) {
        try {
            const vehicleAutoPart = await VehicleAutoPart.findById(id)
                .populate('vehicle_id', 'vehicleName model year plateNumber')
                .populate('autopart_id', 'name category cost_price selling_price warranty_time');

            return vehicleAutoPart;
        } catch (error) {
            throw new Error(`Error fetching vehicle auto part: ${error}`);
        }
    }

    // Tạo VehicleAutoPart
    async createVehicleAutoPart(data: any) {
        try {
            // Always generate a system serial number for VehicleAutoPart
            const generatedSerial = `SN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const payload = {
                ...data,
                serial_number: generatedSerial
            };

            const vehicleAutoPart = new VehicleAutoPart(payload);
            const savedVehicleAutoPart = await vehicleAutoPart.save();
            return await this.getVehicleAutoPartById((savedVehicleAutoPart._id as any).toString());
        } catch (error) {
            throw new Error(`Error creating vehicle auto part: ${error}`);
        }
    }

    // Cập nhật VehicleAutoPart
    async updateVehicleAutoPart(id: string, updateData: any) {
        try {
            const updatedVehicleAutoPart = await VehicleAutoPart.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('vehicle_id', 'vehicleName model year plateNumber')
                .populate('autopart_id', 'name category cost_price selling_price warranty_time');

            return updatedVehicleAutoPart;
        } catch (error) {
            throw new Error(`Error updating vehicle auto part: ${error}`);
        }
    }

    // Xóa VehicleAutoPart
    async deleteVehicleAutoPart(id: string) {
        try {
            const deletedVehicleAutoPart = await VehicleAutoPart.findByIdAndDelete(id);
            return deletedVehicleAutoPart;
        } catch (error) {
            throw new Error(`Error deleting vehicle auto part: ${error}`);
        }
    }

    // Lấy tổng quantity của một loại part (category) trong xe
    async getTotalQuantityByCategory(vehicleId: string, category: string) {
        try {
            const result = await VehicleAutoPart.aggregate([
                {
                    $match: { vehicle_id: require('mongoose').Types.ObjectId(vehicleId) }
                },
                {
                    $lookup: {
                        from: 'autoparts',
                        localField: 'autopart_id',
                        foreignField: '_id',
                        as: 'part_info'
                    }
                },
                {
                    $unwind: '$part_info'
                },
                {
                    $match: { 'part_info.category': category }
                },
                {
                    $group: {
                        _id: '$part_info.category',
                        total_quantity: { $sum: '$quantity' }
                    }
                }
            ]);

            return result.length > 0 ? result[0].total_quantity : 0;
        } catch (error) {
            throw new Error(`Error getting total quantity by category: ${error}`);
        }
    }
}

export default new VehicleAutoPartService();

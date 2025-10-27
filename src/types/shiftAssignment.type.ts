export interface AssignShiftsRequest {
    system_user_id: string;
    shift_ids: string[];
}

export interface ShiftAssignmentResponse {
    _id: string;
    system_user_id: string;
    shift_id: string;
}

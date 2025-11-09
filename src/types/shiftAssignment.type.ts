export interface AssignShiftsRequest {
    system_user_id: string;
    workshift_ids?: string[]; // new field
    shift_ids?: string[];     // backward-compat alias
}

export interface ShiftAssignmentResponse {
    _id: string;
    system_user_id: string;
    workshift_id: string;
}

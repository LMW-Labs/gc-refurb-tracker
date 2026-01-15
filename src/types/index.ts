export interface Location {
  id: string;
  store_number: string;
  city: string;
  state: string;
  created_at: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string | null;
  location_id: string;
  pin: string;
  is_active: boolean;
  created_at: string;
  location?: Location;
}

export type Category = 'Brass' | 'Woodwinds' | 'Strings';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'Pending' | 'In Progress' | 'Fulfilled' | 'Cancelled';

export interface RefurbRequest {
  id: string;
  request_number: number;
  location_id: string;
  tech_id: string;
  category: Category;
  instrument_type: string;
  brand: string;
  quantity_requested: number;
  priority: Priority;
  notes: string | null;
  status: Status;
  quantity_fulfilled: number;
  fulfilled_date: string | null;
  fulfilled_by: string | null;
  fulfillment_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  location?: Location;
  technician?: Technician;
}

export interface DailyCompletion {
  id: string;
  location_id: string;
  tech_id: string;
  category: Category;
  instrument_type: string;
  brand: string;
  quantity_completed: number;
  yellow_armband_applied: boolean;
  qc_card_signed: boolean;
  notes: string | null;
  completion_date: string;
  created_at: string;
  // Joined data
  location?: Location;
  technician?: Technician;
}

export interface ActivityLog {
  id: string;
  request_id: string;
  action: string;
  details: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}

export interface TechSession {
  locationId: string;
  techId: string;
  techName: string;
  locationCity: string;
  storeNumber: string;
}

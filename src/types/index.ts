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

// Request status flow
export type RequestStatus =
  | 'Requested'    // Tech submitted request
  | 'Shipped'      // Hub shipped with expected delivery date
  | 'Received'     // Auto-set when delivery date reached
  | 'In Progress'  // Tech started working
  | 'Complete'     // Tech finished, ready for pickup
  | 'Picked Up';   // Hub confirmed pickup

export type InstrumentType =
  | 'Trumpet'
  | 'Trombone'
  | 'Euphonium'
  | 'French Horn'
  | 'Saxophone'
  | 'Clarinet'
  | 'Flute'
  | 'Violin'
  | 'Viola'
  | 'Cello';

export interface RefurbRequest {
  id: string;
  request_id: string;           // Unique ID: STORE-YYYYMMDD-XXXX (e.g., 9397-20260115-0001)
  location_id: string;
  tech_id: string;
  instrument_type: InstrumentType;
  quantity: number;
  status: RequestStatus;
  notes: string | null;

  // Shipping info (hub fills)
  shipped_date: string | null;
  expected_delivery: string | null;

  // Work tracking (tech fills)
  started_date: string | null;
  completed_date: string | null;

  // Pickup (hub fills)
  picked_up_date: string | null;

  created_at: string;
  updated_at: string;

  // Joined data
  location?: Location;
  technician?: Technician;
}

export interface TechSession {
  locationId: string;
  techId: string;
  techName: string;
  locationCity: string;
  storeNumber: string;
}

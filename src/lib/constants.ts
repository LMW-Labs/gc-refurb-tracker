import type { RequestStatus } from '../types';

// Instrument types - flat list for simpler selection
export const INSTRUMENTS = [
  'Trumpet',
  'Trombone',
  'Euphonium',
  'French Horn',
  'Saxophone',
  'Clarinet',
  'Flute',
  'Violin',
  'Viola',
  'Cello',
] as const;

// Request status flow:
// 1. Requested - Tech submits request
// 2. Shipped - Hub marks as shipped with date
// 3. Received - Auto-changes when ship date is reached
// 4. In Progress - Tech starts working
// 5. Complete - Tech finishes, ready for pickup
// 6. Picked Up - Hub confirms pickup
export const REQUEST_STATUSES: RequestStatus[] = [
  'Requested',
  'Shipped',
  'Received',
  'In Progress',
  'Complete',
  'Picked Up',
];

export const STATUS_CONFIG: Record<RequestStatus, {
  bg: string;
  text: string;
  border: string;
  icon: string;
  description: string;
}> = {
  'Requested': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'clock',
    description: 'Awaiting shipment from hub'
  },
  'Shipped': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'truck',
    description: 'In transit to location'
  },
  'Received': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: 'package-check',
    description: 'Delivered, awaiting work'
  },
  'In Progress': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'wrench',
    description: 'Tech is working on refurb'
  },
  'Complete': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'check-circle',
    description: 'Ready for pickup'
  },
  'Picked Up': {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'archive',
    description: 'Returned to hub'
  },
};

export const TECH_SESSION_KEY = 'gc_refurb_tech_session';
export const MANAGER_AUTH_KEY = 'gc_refurb_manager_auth';

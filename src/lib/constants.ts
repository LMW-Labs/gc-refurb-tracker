import type { Category, Priority, Status } from '../types';

export const INSTRUMENT_DATA: Record<Category, string[]> = {
  Brass: ['Trumpet', 'Trombone'],
  Woodwinds: ['Saxophone', 'Flute', 'Clarinet', 'Oboe'],
  Strings: ['Violin', 'Viola', 'Cello', 'Bass'],
};

export const CATEGORIES: Category[] = ['Brass', 'Woodwinds', 'Strings'];

export const BRANDS = [
  'Yamaha',
  'Bach',
  'Conn',
  'Selmer',
  'Buffet',
  'Getzen',
  'King',
  'Bundy',
  'Armstrong',
  'Jupiter',
  'Other',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const STATUSES: Status[] = ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'];

export const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string }> = {
  Pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  Fulfilled: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  Cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  Low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  Medium: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  Urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export const TECH_SESSION_KEY = 'gc_refurb_tech_session';
export const MANAGER_AUTH_KEY = 'gc_refurb_manager_auth';

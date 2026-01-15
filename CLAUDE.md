# GC Refurb Tracker - Build Prompt for Claude Code

## PROJECT OVERVIEW

Build a **Guitar Center Refurb Request & Tracking System** - a React web app for managing instrument refurbishment requests between a hub manager (Austin) and repair technicians at three Mississippi locations.

**Problem Being Solved:** Repair techs make vague verbal requests ("send woodwinds") to drivers instead of the hub manager, then blame the manager for "bad communication" when issues arise. This system creates documented, timestamped requests with specific quantities - no more he-said/she-said.

**Core Principle:** "No verbal requests accepted. Everything documented. Quantities required."

---

## TECH STACK

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + real-time subscriptions)
- **Icons:** Lucide React
- **Routing:** React Router v6
- **Notifications:** React Hot Toast
- **Date handling:** date-fns
- **Deployment:** Vercel

---

## USER ROLES

### 1. Repair Technicians (Tech View)
- Submit refurb instrument requests with REQUIRED quantities
- Log daily completions (instruments they've finished refurbishing)
- View their own request history and status updates
- Simple, mobile-friendly forms

### 2. Hub Manager - Austin (Manager Dashboard)
- View ALL requests from all locations
- Update request status (Pending → In Progress → Fulfilled → Cancelled)
- Track fulfillment (quantity sent, date, notes)
- View capacity metrics (7-day and 30-day completions by location)
- Export/reporting capabilities

---

## DATABASE SCHEMA (Supabase)

### Table: `locations`
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_number VARCHAR(10) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) DEFAULT 'MS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO locations (store_number, city) VALUES
  ('9396', 'Flowood'),
  ('9397', 'Meridian'),
  ('9398', 'Biloxi');
```

### Table: `technicians`
```sql
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  location_id UUID REFERENCES locations(id),
  pin VARCHAR(4) NOT NULL, -- Simple 4-digit PIN for tech login
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `refurb_requests`
```sql
CREATE TABLE refurb_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number SERIAL, -- Auto-incrementing for easy reference (REQ-001, etc.)
  
  -- Who requested
  location_id UUID REFERENCES locations(id) NOT NULL,
  tech_id UUID REFERENCES technicians(id) NOT NULL,
  
  -- What they need
  category VARCHAR(20) NOT NULL CHECK (category IN ('Brass', 'Woodwinds', 'Strings')),
  instrument_type VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  notes TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Fulfilled', 'Cancelled')),
  
  -- Fulfillment (manager fills this)
  quantity_fulfilled INTEGER DEFAULT 0,
  fulfilled_date TIMESTAMPTZ,
  fulfilled_by VARCHAR(100),
  fulfillment_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_requests_status ON refurb_requests(status);
CREATE INDEX idx_requests_location ON refurb_requests(location_id);
CREATE INDEX idx_requests_created ON refurb_requests(created_at DESC);
```

### Table: `daily_completions`
```sql
CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who completed
  location_id UUID REFERENCES locations(id) NOT NULL,
  tech_id UUID REFERENCES technicians(id) NOT NULL,
  
  -- What was completed
  category VARCHAR(20) NOT NULL,
  instrument_type VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  quantity_completed INTEGER NOT NULL CHECK (quantity_completed > 0),
  
  -- QC verification (REQUIRED)
  yellow_armband_applied BOOLEAN NOT NULL DEFAULT false,
  qc_card_signed BOOLEAN NOT NULL DEFAULT false,
  
  notes TEXT,
  completion_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Both QC checks must be true
ALTER TABLE daily_completions 
ADD CONSTRAINT qc_requirements 
CHECK (yellow_armband_applied = true AND qc_card_signed = true);
```

### Table: `activity_log`
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES refurb_requests(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  performed_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## INSTRUMENT DATA

### Categories & Types
```typescript
const INSTRUMENT_DATA = {
  Brass: ['Trumpet', 'Trombone'],
  Woodwinds: ['Saxophone', 'Flute', 'Clarinet', 'Oboe'],
  Strings: ['Violin', 'Viola', 'Cello', 'Bass']
};

const BRANDS = [
  'Yamaha', 'Bach', 'Conn', 'Selmer', 'Buffet', 
  'Getzen', 'King', 'Bundy', 'Armstrong', 'Jupiter', 'Other'
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const STATUSES = ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'];
```

---

## APP STRUCTURE & ROUTES

```
/                     → Landing page with role selection
/tech                 → Tech portal (select location, enter PIN)
/tech/request         → New refurb request form
/tech/complete        → Log daily completion form
/tech/history         → View my requests & their status
/manager              → Manager login (simple password: "hubmanager2024")
/manager/dashboard    → Main dashboard with all requests
/manager/location/:id → Location-specific view
/manager/metrics      → Capacity planning & analytics
/manager/techs        → Manage technicians (add/edit/deactivate)
```

---

## UI/UX REQUIREMENTS

### Design Direction
- **Industrial/Utilitarian aesthetic** - this is a warehouse tool, not a consumer app
- Dark header with Guitar Center red (#CC0000) accents
- Clean white/light gray content areas
- Bold, clear typography (Oswald for headers, Source Sans Pro for body)
- Large touch targets for mobile/tablet use in warehouse
- Status colors: Pending=Amber, In Progress=Blue, Fulfilled=Green, Cancelled=Gray

### Tech Forms Must:
1. Be mobile-first (techs may use phones)
2. Have large buttons and inputs
3. Show clear validation errors
4. Require quantity > 0 (cannot submit without)
5. Auto-select their location after first login
6. Show confirmation after submission with request number

### Manager Dashboard Must:
1. Show summary cards at top (Pending count, In Progress count, Today's requests)
2. Have filterable/sortable request table
3. Allow inline status updates
4. Show location breakdown
5. Have quick actions (Mark Fulfilled, etc.)
6. Display capacity metrics prominently

### Key UI Components Needed:
- `<RequestCard />` - Shows request details with status badge
- `<StatusBadge />` - Color-coded status indicator
- `<PriorityBadge />` - Color-coded priority indicator
- `<LocationSelector />` - Dropdown for choosing location
- `<InstrumentSelector />` - Category → Type cascading selects
- `<QuantityInput />` - Number input with +/- buttons, min=1
- `<MetricsCard />` - Shows stat with label and trend
- `<RequestTable />` - Sortable, filterable data table
- `<ConfirmationModal />` - For status changes

---

## KEY FEATURES

### 1. Tech Request Form
```
Header: "REFURB REQUEST FORM"
Subheader: "All requests must specify exact quantities. Verbal requests will not be accepted."

Fields:
- Location (auto-filled after first use, stored in localStorage)
- Your Name (dropdown of techs at that location)
- Category (Brass/Woodwinds/Strings)
- Instrument Type (filtered by category)
- Brand (dropdown)
- Quantity Needed* (number input, REQUIRED, min=1)
- Priority (Low/Medium/High/Urgent)
- Notes (optional textarea)

Submit → Shows confirmation with Request # (e.g., "REQ-0042")
```

### 2. Daily Completion Form
```
Header: "LOG COMPLETION"
Subheader: "Only log instruments with yellow armband AND signed QC card"

Fields:
- Location (auto-filled)
- Your Name
- Category
- Instrument Type
- Brand  
- Quantity Completed*
- ☑ Yellow Armband Applied* (REQUIRED checkbox)
- ☑ QC Card Signed* (REQUIRED checkbox)
- Notes

Cannot submit unless BOTH checkboxes are checked.
```

### 3. Manager Dashboard
```
Top Stats Row:
[Pending: 12] [In Progress: 5] [Fulfilled Today: 8] [Urgent: 2]

Filter Bar:
[Location ▼] [Status ▼] [Category ▼] [Date Range] [Search...]

Request Table:
REQ# | Location | Tech | Instrument | Qty | Priority | Status | Requested | Actions
------|----------|------|------------|-----|----------|--------|-----------|--------
0042 | Meridian | Tiffany | Saxophone | 5 | High | Pending | 2h ago | [View] [Update]

Click row → Slide-out panel with full details + status update form
```

### 4. Capacity Metrics View
```
7-Day Completions by Location:
[Flowood: 23] [Meridian: 18] [Biloxi: 31]

30-Day Completions by Location:
[Flowood: 89] [Meridian: 72] [Biloxi: 124]

Chart: Completions over time (last 30 days, grouped by location)
Chart: Requests vs Completions comparison
Table: Breakdown by instrument category
```

### 5. Real-time Updates
- Use Supabase real-time subscriptions
- Manager dashboard auto-updates when new requests come in
- Toast notification: "New request from Meridian - 5x Saxophone"

---

## VALIDATION RULES

### Request Form:
- Quantity must be >= 1
- All fields except Notes are required
- Category must match valid instrument types

### Completion Form:
- Quantity must be >= 1
- BOTH yellow_armband_applied AND qc_card_signed must be true
- Cannot submit with unchecked QC boxes

### Manager Updates:
- Cannot fulfill more than requested (warning, but allow override with note)
- Status changes are logged to activity_log

---

## AUTHENTICATION (Simple)

### Techs:
- Select location → Select name → Enter 4-digit PIN
- Store location preference in localStorage
- No complex auth needed, just accountability

### Manager:
- Simple password: "hubmanager2024" (stored in env var)
- Could upgrade to Supabase Auth later if needed

---

## ENVIRONMENT VARIABLES

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MANAGER_PASSWORD=hubmanager2024
```

---

## DEPLOYMENT

1. Push to GitHub repo
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Custom domain or use: `gc-refurb.vercel.app`

---

## FILE STRUCTURE

```
gc-refurb-tracker/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── forms/
│   │   │   ├── RequestForm.tsx
│   │   │   ├── CompletionForm.tsx
│   │   │   └── StatusUpdateForm.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RequestTable.tsx
│   │   │   ├── RequestDetail.tsx
│   │   │   └── MetricsCharts.tsx
│   │   └── shared/
│   │       ├── LocationSelector.tsx
│   │       ├── InstrumentSelector.tsx
│   │       ├── StatusBadge.tsx
│   │       └── PriorityBadge.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── tech/
│   │   │   ├── TechPortal.tsx
│   │   │   ├── NewRequest.tsx
│   │   │   ├── LogCompletion.tsx
│   │   │   └── MyHistory.tsx
│   │   └── manager/
│   │       ├── ManagerLogin.tsx
│   │       ├── Dashboard.tsx
│   │       ├── LocationView.tsx
│   │       ├── Metrics.tsx
│   │       └── ManageTechs.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useRequests.ts
│   │   ├── useCompletions.ts
│   │   ├── useLocations.ts
│   │   └── useRealtime.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## SAMPLE DATA FOR TESTING

After building, seed the database with:

```sql
-- Add test technicians
INSERT INTO technicians (name, location_id, pin) VALUES
  ('Tiffany', (SELECT id FROM locations WHERE store_number = '9397'), '1234'),
  ('Marcus', (SELECT id FROM locations WHERE store_number = '9397'), '5678'),
  ('Denise', (SELECT id FROM locations WHERE store_number = '9396'), '1111'),
  ('Robert', (SELECT id FROM locations WHERE store_number = '9396'), '2222'),
  ('Angela', (SELECT id FROM locations WHERE store_number = '9398'), '3333'),
  ('James', (SELECT id FROM locations WHERE store_number = '9398'), '4444');

-- Add sample requests
INSERT INTO refurb_requests (location_id, tech_id, category, instrument_type, brand, quantity_requested, priority, notes)
SELECT 
  l.id,
  t.id,
  'Woodwinds',
  'Saxophone',
  'Yamaha',
  5,
  'High',
  'Need these ASAP for school band season'
FROM locations l
JOIN technicians t ON t.location_id = l.id
WHERE l.store_number = '9397' AND t.name = 'Tiffany';
```

---

## SUCCESS CRITERIA

The app is complete when:

1. ✅ Techs can submit requests with REQUIRED quantities
2. ✅ Techs can log completions with REQUIRED QC checkboxes
3. ✅ Manager can view all requests in filterable dashboard
4. ✅ Manager can update status and track fulfillment
5. ✅ Real-time updates work (new requests appear automatically)
6. ✅ 7-day and 30-day capacity metrics display correctly
7. ✅ All actions are logged with timestamps
8. ✅ Mobile-responsive design works on phones/tablets
9. ✅ Deployed to Vercel and accessible via short URL

---

## NOTES FOR CLAUDE CODE

1. **Start with Supabase setup** - Create the tables first, then build the app
2. **Build incrementally** - Get basic CRUD working before adding real-time
3. **Mobile-first** - Test on mobile viewport throughout
4. **Keep it simple** - This is a warehouse tool, not a SaaS product
5. **Focus on the paper trail** - Every action should be documented

When Tiffany claims Austin is a "bad communicator," he can pull up:
- The documented request with her name and timestamp
- The exact quantity she requested (or didn't request)
- The fulfillment record showing what was sent and when

**That's the whole point of this system.**

---

## COMMANDS TO RUN

```bash
# Create project
npm create vite@latest gc-refurb-tracker -- --template react-ts
cd gc-refurb-tracker

# Install dependencies
npm install @supabase/supabase-js react-router-dom lucide-react react-hot-toast date-fns

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start development
npm run dev
```

Build this application following the specifications above. Make it production-ready, professional, and bulletproof for documentation purposes.
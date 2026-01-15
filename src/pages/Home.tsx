import { Link } from 'react-router-dom';
import { Wrench, ClipboardList, ArrowRight } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { PageContainer } from '../components/layout';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gc-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">GC</span>
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">
                REFURB TRACKER
              </h1>
              <p className="text-gray-400 text-sm">Mississippi Region</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <PageContainer maxWidth="lg" className="bg-gray-900 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Instrument Refurb Request System
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            No verbal requests accepted. Everything documented. Quantities required.
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Tech Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-gc-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-gc-red" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                Repair Technician
              </h3>
              <p className="text-gray-600 mb-6">
                Submit refurb requests and log daily completions
              </p>
              <Link to="/tech">
                <Button className="w-full flex items-center justify-center gap-2">
                  Tech Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Manager Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">
                Hub Manager
              </h3>
              <p className="text-gray-600 mb-6">
                View requests, update status, and track metrics
              </p>
              <Link to="/manager">
                <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                  Manager Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="text-lg font-heading font-semibold text-white mb-3">
              Locations Served
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              <LocationBadge city="Flowood" store="9396" />
              <LocationBadge city="Meridian" store="9397" />
              <LocationBadge city="Biloxi" store="9398" />
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Guitar Center Refurb Request & Tracking System</p>
          <p className="mt-1">All requests are documented with timestamps for accountability.</p>
        </div>
      </footer>
    </div>
  );
}

function LocationBadge({ city, store }: { city: string; store: string }) {
  return (
    <div className="bg-gray-700 rounded-lg px-4 py-2">
      <span className="text-white font-medium">{city}</span>
      <span className="text-gray-400 ml-2">#{store}</span>
    </div>
  );
}

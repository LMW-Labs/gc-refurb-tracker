import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import { TechPortal, NewRequest, LogCompletion, MyHistory } from './pages/tech';
import { ManagerLogin, Dashboard, Metrics, ManageTechs } from './pages/manager';

function App() {
  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Tech Routes */}
        <Route path="/tech" element={<TechPortal />} />
        <Route path="/tech/request" element={<NewRequest />} />
        <Route path="/tech/complete" element={<LogCompletion />} />
        <Route path="/tech/history" element={<MyHistory />} />

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerLogin />} />
        <Route path="/manager/dashboard" element={<Dashboard />} />
        <Route path="/manager/metrics" element={<Metrics />} />
        <Route path="/manager/techs" element={<ManageTechs />} />
      </Routes>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;

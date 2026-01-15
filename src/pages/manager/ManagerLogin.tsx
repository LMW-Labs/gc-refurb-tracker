import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { PageContainer } from '../../components/layout';
import { MANAGER_AUTH_KEY } from '../../lib/constants';
import { setStorageItem } from '../../lib/utils';

export default function ManagerLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small delay to prevent brute force
    await new Promise((resolve) => setTimeout(resolve, 500));

    const managerPassword = import.meta.env.VITE_MANAGER_PASSWORD || 'hubmanager2024';

    if (password === managerPassword) {
      setStorageItem(MANAGER_AUTH_KEY, { authenticated: true, timestamp: Date.now() });
      navigate('/manager/dashboard');
    } else {
      setError('Invalid password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <PageContainer maxWidth="sm">
      <div className="min-h-screen flex flex-col justify-center py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            MANAGER LOGIN
          </h1>
          <p className="text-gray-600 mt-2">
            Hub Manager Dashboard Access
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter manager password"
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={!password}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          For authorized personnel only
        </p>
      </div>
    </PageContainer>
  );
}

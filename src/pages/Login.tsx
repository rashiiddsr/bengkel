import { useEffect, useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const message = (location.state as { message?: string } | null)?.message;
    if (message) {
      setSuccess(message);
    }
  }, [location.state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: signInError, profile } = await signIn(identifier, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const role = profile?.role;
    const redirectMap: Record<string, string> = {
      admin: '/admin',
      mechanic: '/mechanic',
      customer: '/customer',
      superadmin: '/admin',
    };
    navigate(redirectMap[role ?? ''] ?? '/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <Wrench className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Bintang Motor Auto Service
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Masuk ke Akun Anda
          </h2>

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Email atau Username"
              placeholder="Masukkan email atau username Anda"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="Masukkan kata sandi Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

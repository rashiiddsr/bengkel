import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone
    );

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              <Wrench className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Bengkel AutoService
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Buat Akun Anda
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="Masukkan email Anda"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              type="tel"
              label="Nomor Telepon"
              placeholder="Masukkan nomor telepon Anda"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              type="password"
              label="Kata Sandi"
              placeholder="Buat kata sandi"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              type="password"
              label="Konfirmasi Kata Sandi"
              placeholder="Konfirmasi kata sandi"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Membuat akun...' : 'Daftar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

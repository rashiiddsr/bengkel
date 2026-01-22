import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, TextArea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api, resolveImageUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const roleLabel = profile?.role ? profile.role.replace('_', ' ').toUpperCase() : '';
  const [formState, setFormState] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || !profile) return;
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      setAvatarObjectUrl(null);
    }
    setFormState({
      fullName: profile.full_name ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
      phone: profile.phone ?? '',
      address: profile.address ?? '',
      password: '',
    });
    setAvatarPreview(resolveImageUrl(profile.avatar_url));
    setAvatarFile(null);
  }, [profile, user]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
  }, [avatarObjectUrl]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setAvatarObjectUrl(previewUrl);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const profilePayload: {
        full_name: string;
        phone: string;
        address?: string | null;
        avatar_url?: string | null;
      } = {
        full_name: formState.fullName,
        phone: formState.phone,
        address: formState.address || null,
      };

      if (avatarFile) {
        profilePayload.avatar_url = await api.uploadImage(avatarFile);
      }

      await api.updateProfile(profile.id, profilePayload);

      const userPayload: { email?: string; username?: string; password?: string } = {
        email: formState.email.trim(),
        username: formState.username.trim(),
      };
      if (formState.password) {
        userPayload.password = formState.password;
      }
      await api.updateUser(user.id, userPayload);

      await refreshProfile();
      setSuccess('Profil berhasil diperbarui.');
      setFormState((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError((err as Error).message || 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil</h1>

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={formState.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-gray-500">
                    {(formState.fullName || 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                aria-label="Ubah foto profil"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profil</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formState.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {roleLabel}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label={(
                  <>
                    Nama Lengkap <span className="text-red-500">*</span>
                  </>
                )}
                value={formState.fullName}
                onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                required
              />
              <Input
                label={(
                  <>
                    Email <span className="text-red-500">*</span>
                  </>
                )}
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                required
              />
              <Input
                label={(
                  <>
                    Username <span className="text-red-500">*</span>
                  </>
                )}
                value={formState.username}
                onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                required
              />
              <Input
                label={(
                  <>
                    No HP <span className="text-red-500">*</span>
                  </>
                )}
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                required
              />
            </div>
            <TextArea
              label="Alamat"
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
            />
            <Input
              label="Password Baru"
              type="password"
              placeholder="Kosongkan jika tidak ingin mengganti"
              value={formState.password}
              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

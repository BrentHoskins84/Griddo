import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/features/account/components/avatar-upload';
import { ProfileForm } from '@/features/account/components/profile-form';
import { getUser } from '@/features/account/controllers/get-user';
import { getUserProfile } from '@/features/account/controllers/get-user-profile';

export default async function AccountPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const userProfile = await getUserProfile();
  const userEmail = user.email ?? '';

  // Determine auth method from app_metadata
  const authProvider = user.app_metadata?.provider || 'email';
  const signInMethod = authProvider === 'google' ? 'Google' : 'Email (Magic Link)';

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Account Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your account information and preferences.</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Avatar Section */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Avatar</CardTitle>
            <CardDescription>Update your profile picture.</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload currentAvatarUrl={userProfile?.avatar_url ?? null} userEmail={userEmail} />
          </CardContent>
        </Card>

        {/* Profile Section */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
            <CardDescription>Update your full name.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultName={userProfile?.full_name ?? null} />
          </CardContent>
        </Card>

        {/* Email Section */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Email</CardTitle>
            <CardDescription>Your email address cannot be changed.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                readOnly
                className="border-zinc-700 bg-zinc-800 text-zinc-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sign-in Method Section */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Sign-in Method</CardTitle>
            <CardDescription>Your current authentication method.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="signInMethod" className="text-zinc-200">
                Authentication Provider
              </Label>
              <Input
                id="signInMethod"
                value={signInMethod}
                readOnly
                className="border-zinc-700 bg-zinc-800 text-zinc-400"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


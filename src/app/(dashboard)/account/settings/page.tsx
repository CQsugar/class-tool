import { ProfileForm } from '@/components/auth/profile-form'

export default async function SettingsPage() {
  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6">
      <ProfileForm />
    </div>
  )
}

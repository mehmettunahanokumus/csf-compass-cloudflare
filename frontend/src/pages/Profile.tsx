/**
 * User Profile Page (Placeholder)
 * Future: User profile, preferences, notifications
 */

import { User } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Profile</h1>
        <p className="text-text-secondary mt-1">Manage your profile and preferences</p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <div className="bg-secondary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Profile Settings Coming Soon
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Update your profile information, change password, manage notifications, and set preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

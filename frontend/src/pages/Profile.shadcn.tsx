import { User } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Profile() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and preferences
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Demo User</h2>
          <p className="text-sm text-muted-foreground mb-2">demo-user-456</p>
          <p className="text-sm text-muted-foreground">demo-org-123</p>
        </CardContent>
      </Card>

      <Alert className="border-l-4 border-l-primary">
        <User className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Profile Settings Coming Soon</span>
          <p className="mt-1 text-sm text-muted-foreground">
            User profile management, preferences, and notification settings will be available in a future update.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

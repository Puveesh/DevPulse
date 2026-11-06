import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User, Shield, Database } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your account profile, authentication preferences, and developer workspace settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <CardTitle>Developer Profile</CardTitle>
            </div>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                defaultValue={user?.displayName || ''}
                readOnly
                className="bg-zinc-800/40 text-zinc-300"
              />
              <Input
                label="Email Address"
                defaultValue={user?.email || ''}
                readOnly
                className="bg-zinc-800/40 text-zinc-300 font-mono"
              />
            </div>
            <div className="text-xs text-zinc-500 pt-1">
              Account created on {user?.createdAt ? formatDate(user.createdAt) : '--'}
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <CardTitle>Authentication &amp; Security</CardTitle>
            </div>
            <CardDescription>JWT token lifecycle and password security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Session Type</span>
                <span className="font-mono text-zinc-400">HttpOnly SameSite Cookie + Bearer JWT</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Token Expiration</span>
                <span className="font-mono text-zinc-400">24 hours (configurable)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Password Hashing</span>
                <span className="font-mono text-zinc-400">BCrypt (rounds: 10-12)</span>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Change Password (Phase 2)
            </Button>
          </CardContent>
        </Card>

        {/* Data Isolation & Storage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <CardTitle>Database &amp; Data Isolation</CardTitle>
            </div>
            <CardDescription>Structured workspace records in MySQL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <p>
              Your projects, tasks, daily notes, and work session telemetry are isolated by your unique developer ID.
              No cross-user access is permitted at the API or database layer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

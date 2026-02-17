import { User, Mail, Building2, Hash } from 'lucide-react';

export default function Profile() {
  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Profile</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-1">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-5">
            <User className="w-7 h-7 text-amber-500/70" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#F0F0F5] mb-1">Demo User</h2>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-[#55576A]" />
              <span className="font-mono text-xs text-[#8E8FA8]">demo-user-456</span>
            </div>
            <div className="w-px h-3 bg-white/[0.07]" />
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-[#55576A]" />
              <span className="font-mono text-xs text-[#8E8FA8]">demo-org-123</span>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="bg-[#13151F] border border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="w-3.5 h-3.5 text-[#55576A]" />
              <span className="font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Name</span>
            </div>
            <p className="font-sans text-sm text-[#F0F0F5]">Demo User</p>
          </div>
          <div className="bg-[#13151F] border border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-[#55576A]" />
              <span className="font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Email</span>
            </div>
            <p className="font-sans text-sm text-[#F0F0F5]">demo@example.com</p>
          </div>
          <div className="bg-[#13151F] border border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#55576A]" />
              <span className="font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Organization</span>
            </div>
            <p className="font-sans text-sm text-[#F0F0F5]">Demo Organization</p>
          </div>
          <div className="bg-[#13151F] border border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Hash className="w-3.5 h-3.5 text-[#55576A]" />
              <span className="font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Role</span>
            </div>
            <p className="font-sans text-sm text-[#F0F0F5]">Administrator</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
        <div className="flex items-start gap-4 pl-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-[18px] h-[18px] text-amber-500/70" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#F0F0F5]">Profile Settings Coming Soon</p>
            <p className="font-sans text-sm text-[#8E8FA8] mt-1 leading-relaxed">
              User profile management, preferences, and notification settings will be available in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Features */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Upcoming Profile Features
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Avatar and display name customization',
            'Email and notification preferences',
            'Two-factor authentication (2FA)',
            'API key management',
            'Session history and active devices',
            'Theme and language preferences',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import PlanBadge from '../components/PlanBadge';
import UpgradeModal from '../components/UpgradeModal';

interface AccountSettings {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  is_admin: boolean;
  joined_at: string;
}

interface TeamSettings {
  team: {
    id: string;
    name: string;
    industry: string;
    focus_areas: string; // JSON string array
    team_description: string;
    created_at: string;
  };
  user_role: 'owner' | 'member';
  user_is_admin: boolean;
  members: TeamMember[];
}

interface BillingInfo {
  subscription: {
    id: string;
    plan: string;
    status: string;
    seat_count: number;
    billing_info: string | null;
    created_at: string;
  } | null;
}

interface StripeSubscriptionStatus {
  status: string;
  plan: string;
  customerId: string | null;
  subscriptionId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

function Settings() {
  const [activeTab, setActiveTab] = useState<'account' | 'team' | 'billing'>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Usage tracking and subscription management
  const { usageSummary, subscriptionStatus, isLoading: usageLoading, refreshUsage } = useUsageTracking();
  const { handleUpgrade } = useStripeCheckout();
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    type: 'trial_ended' | 'usage_limit' | 'near_limit' | 'payment_failed';
    toolName?: string;
    currentUsage?: number;
    usageLimit?: number;
  }>({
    isOpen: false,
    type: 'trial_ended'
  });

  // Account settings
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '' });

  // Team settings
  const [teamSettings, setTeamSettings] = useState<TeamSettings | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '' });
  const [teamProfileForm, setTeamProfileForm] = useState({ 
    industry: '', 
    focus_areas: [] as string[], 
    team_description: '' 
  });
  const [inviteForm, setInviteForm] = useState({ email: '' });
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Billing settings
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingForm, setBillingForm] = useState({ plan: 'free', seat_count: 1 });
  const [stripeSubscription, setStripeSubscription] = useState<StripeSubscriptionStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [accountRes, teamRes, billingRes, stripeRes] = await Promise.all([
        apiClient.getAccountSettings(),
        apiClient.getTeamSettings(),
        apiClient.getBillingInfo(),
        apiClient.getSubscriptionStatus()
      ]);

      if (accountRes.data) {
        setAccountSettings(accountRes.data);
        setAccountForm({ name: accountRes.data.name });
      }

      if (teamRes.data) {
        setTeamSettings(teamRes.data);
        setTeamForm({ name: teamRes.data.team.name });
        
        // Parse focus areas from JSON string
        let focusAreas: string[] = [];
        try {
          if (teamRes.data.team.focus_areas && teamRes.data.team.focus_areas !== '[]') {
            focusAreas = JSON.parse(teamRes.data.team.focus_areas);
          }
        } catch (e) {
          console.error('Failed to parse focus areas:', e);
        }
        
        setTeamProfileForm({
          industry: teamRes.data.team.industry,
          focus_areas: focusAreas,
          team_description: teamRes.data.team.team_description || ''
        });
      }

      if (billingRes.data) {
        setBillingInfo(billingRes.data);
        if (billingRes.data.subscription) {
          setBillingForm({
            plan: billingRes.data.subscription.plan,
            seat_count: billingRes.data.subscription.seat_count
          });
        }
      }

      if (stripeRes.data) {
        setStripeSubscription(stripeRes.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.updateAccountSettings(accountForm);
      if (response.data) {
        showSuccess('Account settings updated successfully');
        if (accountSettings) {
          setAccountSettings({ ...accountSettings, name: accountForm.name });
        }
      } else {
        showError(response.error || 'Failed to update account settings');
      }
    } catch (err) {
      console.error('Failed to update account settings:', err);
      showError('Failed to update account settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.updateTeamName(teamForm);
      if (response.data) {
        showSuccess('Team name updated successfully');
        if (teamSettings) {
          setTeamSettings({
            ...teamSettings,
            team: { ...teamSettings.team, name: teamForm.name }
          });
        }
      } else {
        showError(response.error || 'Failed to update team name');
      }
    } catch (err) {
      console.error('Failed to update team name:', err);
      showError('Failed to update team name');
    } finally {
      setSaving(false);
    }
  };

  const handleTeamProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.updateTeamProfile(teamProfileForm);
      if (response.data) {
        showSuccess('Team profile updated successfully');
        if (teamSettings) {
          setTeamSettings({
            ...teamSettings,
            team: { 
              ...teamSettings.team, 
              industry: teamProfileForm.industry,
              focus_areas: JSON.stringify(teamProfileForm.focus_areas),
              team_description: teamProfileForm.team_description
            }
          });
        }
      } else {
        showError(response.error || 'Failed to update team profile');
      }
    } catch (err) {
      console.error('Failed to update team profile:', err);
      showError('Failed to update team profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFocusAreaChange = (area: string) => {
    setTeamProfileForm(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }));
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.inviteTeamMember(inviteForm);
      if (response.data) {
        showSuccess('Invitation sent successfully');
        setInviteForm({ email: '' });
        setShowInviteForm(false);
        // Reload team settings to get updated member list
        const teamRes = await apiClient.getTeamSettings();
        if (teamRes.data) {
          setTeamSettings(teamRes.data);
        }
      } else {
        showError(response.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Failed to send invitation:', err);
      showError('Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.removeTeamMember({ member_id: memberId });
      if (response.data) {
        showSuccess('Member removed successfully');
        // Reload team settings
        const teamRes = await apiClient.getTeamSettings();
        if (teamRes.data) {
          setTeamSettings(teamRes.data);
        }
      } else {
        showError(response.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      showError('Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const handleSetRole = async (memberId: string, role: 'owner' | 'member') => {
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.setMemberRole({ member_id: memberId, role });
      if (response.data) {
        showSuccess('Member role updated successfully');
        // Reload team settings
        const teamRes = await apiClient.getTeamSettings();
        if (teamRes.data) {
          setTeamSettings(teamRes.data);
        }
      } else {
        showError(response.error || 'Failed to update member role');
      }
    } catch (err) {
      console.error('Failed to update member role:', err);
      showError('Failed to update member role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.updateSubscription(billingForm);
      if (response.data) {
        showSuccess('Subscription updated successfully');
        // Reload billing info
        const billingRes = await apiClient.getBillingInfo();
        if (billingRes.data) {
          setBillingInfo(billingRes.data);
        }
      } else {
        showError(response.error || 'Failed to update subscription');
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
      showError('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.cancelSubscription();
      if (response.data) {
        showSuccess('Subscription cancelled successfully');
        // Reload billing info
        const billingRes = await apiClient.getBillingInfo();
        if (billingRes.data) {
          setBillingInfo(billingRes.data);
        }
      } else {
        showError(response.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      showError('Failed to cancel subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setBillingLoading(true);
    setError(null);

    try {
      const response = await apiClient.getBillingPortalLink();
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        showError(response.error || 'Failed to open billing portal');
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      showError('Failed to open billing portal');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleUpgradePlan = async (priceId: string) => {
    setBillingLoading(true);
    setError(null);

    try {
      const response = await apiClient.createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/app/settings?tab=billing&success=true`,
        cancelUrl: `${window.location.origin}/app/settings?tab=billing&canceled=true`
      });
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        showError(response.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      showError('Failed to create checkout session');
    } finally {
      setBillingLoading(false);
    }
  };

  // Upgrade modal handlers
  const handleUpgradeModalClose = () => {
    setUpgradeModal({ isOpen: false, type: 'trial_ended' });
  };

  const handleUpgradeModalUpgrade = async (plan: 'pro_limited' | 'pro_unlimited') => {
    await handleUpgrade(plan);
    handleUpgradeModalClose();
  };

  const tabs = [
    { id: 'account', name: 'Account Settings', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'team', name: 'Team Management', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'billing', name: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={handleUpgradeModalClose}
        onUpgrade={handleUpgradeModalUpgrade}
        type={upgradeModal.type}
        toolName={upgradeModal.toolName}
        currentUsage={upgradeModal.currentUsage}
        usageLimit={upgradeModal.usageLimit}
      />
    </AppLayout>
  );
}

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account, team, and billing preferences.</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'account' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              
              {accountSettings && (
                <form onSubmit={handleAccountUpdate} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={accountSettings.email}
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(accountSettings.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
              
              {teamSettings && (
                <div className="space-y-8">
                  {/* Team Name */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
                    <form onSubmit={handleTeamNameUpdate} className="space-y-4">
                      <div>
                        <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
                          Team Name
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            id="team-name"
                            value={teamForm.name}
                            onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                            required
                          />
                          <button
                            type="submit"
                            disabled={saving || teamSettings.user_role !== 'owner'}
                            className="px-4 py-2 bg-red-600 text-white rounded-r-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Update'}
                          </button>
                        </div>
                        {teamSettings.user_role !== 'owner' && (
                          <p className="mt-1 text-sm text-gray-500">Only team owners can update the team name</p>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Team Profile */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Team Profile</h3>
                    <form onSubmit={handleTeamProfileUpdate} className="space-y-4">
                      <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                          Industry / Vertical
                        </label>
                        <select
                          id="industry"
                          value={teamProfileForm.industry}
                          onChange={(e) => setTeamProfileForm({ ...teamProfileForm, industry: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                          disabled={teamSettings.user_role !== 'owner'}
                        >
                          <option value="">Select an industry</option>
                          <option value="Retail">Retail</option>
                          <option value="Travel & Hospitality">Travel & Hospitality</option>
                          <option value="Financial Services">Financial Services</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Technology">Technology</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="CPG">CPG (Consumer Packaged Goods)</option>
                          <option value="Media & Entertainment">Media & Entertainment</option>
                          <option value="Automotive">Automotive</option>
                          <option value="Nonprofit / Public Sector">Nonprofit / Public Sector</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Focus Areas
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                          {[
                            'Brand / Strategy',
                            'Media / Performance',
                            'CRM / Lifecycle Marketing',
                            'Product / UX / Digital Experience',
                            'Analytics / Insights',
                            'Creative / Content',
                            'Growth / Acquisition'
                          ].map((area) => (
                            <label key={area} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={teamProfileForm.focus_areas.includes(area)}
                                onChange={() => handleFocusAreaChange(area)}
                                disabled={teamSettings.user_role !== 'owner'}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">
                          Team Description (Optional)
                        </label>
                        <textarea
                          id="team-description"
                          value={teamProfileForm.team_description}
                          onChange={(e) => setTeamProfileForm({ ...teamProfileForm, team_description: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                          rows={3}
                          placeholder="e.g., We're an agency pod focused on paid search + social, with support from creative and analytics."
                          disabled={teamSettings.user_role !== 'owner'}
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving || teamSettings.user_role !== 'owner'}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Update Profile'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Team Members */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                      {teamSettings.user_is_admin && (
                        <button
                          onClick={() => setShowInviteForm(!showInviteForm)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          {showInviteForm ? 'Cancel' : 'Invite Member'}
                        </button>
                      )}
                    </div>

                    {/* Invite Form */}
                    {showInviteForm && teamSettings.user_is_admin && (
                      <form onSubmit={handleInviteMember} className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="invite-email"
                              value={inviteForm.email}
                              onChange={(e) => setInviteForm({ email: e.target.value })}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                              placeholder="colleague@company.com"
                              required
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={saving}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                              {saving ? 'Sending...' : 'Send Invite'}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Members List */}
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            {teamSettings.user_is_admin && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {teamSettings.members.map((member) => (
                            <tr key={member.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  member.role === 'owner' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {member.role === 'owner' ? 'Admin' : 'Member'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(member.joined_at).toLocaleDateString()}
                              </td>
                              {teamSettings.user_role === 'owner' && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {member.user_id !== teamSettings.members.find(m => m.role === 'owner')?.user_id && (
                                    <div className="flex items-center justify-end space-x-2">
                                      <select
                                        value={member.role}
                                        onChange={(e) => handleSetRole(member.id, e.target.value as 'owner' | 'member')}
                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                      >
                                        <option value="member">Member</option>
                                        <option value="owner">Admin</option>
                                      </select>
                                      <button
                                        onClick={() => handleRemoveMember(member.id, member.name)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing & Subscription</h2>
              
              <div className="space-y-8">
                {/* Current Plan */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {subscriptionStatus ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <PlanBadge plan={subscriptionStatus.plan} size="large" />
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 capitalize">
                                  {subscriptionStatus.plan === 'free' ? 'Free Plan' : 
                                   subscriptionStatus.plan === 'pro_limited' ? 'Pro Limited' : 'Pro Unlimited'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Status: <span className={`font-medium ${
                                    subscriptionStatus.status === 'active' ? 'text-green-600' : 
                                    subscriptionStatus.status === 'trial' ? 'text-blue-600' : 
                                    subscriptionStatus.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {subscriptionStatus.status === 'trial' ? 'Trial' : 
                                     subscriptionStatus.status === 'failed' ? 'Payment Failed' : 
                                     subscriptionStatus.status}
                                  </span>
                                </p>
                                {subscriptionStatus.trialEndDate && (
                                  <p className="text-sm text-gray-500">
                                    Trial ends: {new Date(subscriptionStatus.trialEndDate).toLocaleDateString()}
                                  </p>
                                )}
                                {subscriptionStatus.currentPeriodEnd && (
                                  <p className="text-sm text-gray-500">
                                    Next billing: {new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString()}
                                  </p>
                                )}
                                {subscriptionStatus.cancelAtPeriodEnd && (
                                  <p className="text-sm text-orange-600 font-medium">
                                    Subscription will cancel at period end
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {subscriptionStatus.customerId && (
                              <>
                                <p className="text-sm text-gray-500">Customer ID</p>
                                <p className="text-xs font-mono text-gray-900">{subscriptionStatus.customerId.slice(-8)}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading subscription status...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Summary */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Summary (This Billing Cycle)</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    {usageSummary ? (
                      <div className="space-y-4">
                        {Object.entries(usageSummary).map(([toolName, usage]) => (
                          <div key={toolName} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {toolName.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {usage.limit === -1 ? 'Unlimited' : `${usage.used} / ${usage.limit}`}
                                </span>
                              </div>
                              {usage.limit !== -1 && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      usage.used >= usage.limit ? 'bg-red-500' :
                                      usage.used >= usage.limit * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading usage summary...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-4">
                    {subscriptionStatus?.customerId && (
                      <button
                        onClick={handleManageSubscription}
                        disabled={billingLoading}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                      >
                        {billingLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Opening Portal...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manage Subscription
                          </>
                        )}
                      </button>
                    )}

                    {subscriptionStatus?.plan === 'free' && (
                      <div className="space-y-3">
                        <h4 className="text-md font-medium text-gray-900">Upgrade Your Plan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={() => handleUpgrade('pro_limited')}
                            disabled={billingLoading}
                            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                          >
                            {billingLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Pro Limited ($6.99/month)
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleUpgrade('pro_unlimited')}
                            disabled={billingLoading}
                            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                          >
                            {billingLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Pro Unlimited ($11.99/month)
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {subscriptionStatus?.plan === 'pro_limited' && (
                      <div className="space-y-3">
                        <h4 className="text-md font-medium text-gray-900">Upgrade to Unlimited</h4>
                        <button
                          onClick={() => handleUpgrade('pro_unlimited')}
                          disabled={billingLoading}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                        >
                          {billingLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Upgrade to Pro Unlimited ($11.99/month)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legacy Billing Info (if needed) */}
                {billingInfo && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Legacy Billing Information</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      {billingInfo.subscription ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 capitalize">
                                {billingInfo.subscription.plan} Plan
                              </h4>
                              <p className="text-sm text-gray-500">
                                Status: <span className={`font-medium ${
                                  billingInfo.subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {billingInfo.subscription.status}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Seats</p>
                              <p className="text-lg font-medium text-gray-900">{billingInfo.subscription.seat_count}</p>
                            </div>
                          </div>
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-500">
                              Started: {new Date(billingInfo.subscription.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No legacy subscription found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Access Control */}
                {teamSettings?.user_role !== 'owner' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Only team owners can manage billing and subscription settings.
            </p>
          </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default Settings; 
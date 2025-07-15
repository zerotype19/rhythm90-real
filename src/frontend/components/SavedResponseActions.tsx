import React, { useState } from 'react';
import { apiClient } from '../lib/api';

interface SavedResponseActionsProps {
  responseId?: string;
  toolName: string;
  responseBlob: any;
  teamId?: string;
  summary?: string;
  isFavorite?: boolean;
  isSharedPublic?: boolean;
  isSharedTeam?: boolean;
  onStatusChange?: () => void;
}

export const SavedResponseActions: React.FC<SavedResponseActionsProps> = ({
  responseId,
  toolName,
  responseBlob,
  teamId,
  summary,
  isFavorite = false,
  isSharedPublic = false,
  isSharedTeam = false,
  onStatusChange,
}) => {
  // State for modals and actions
  const [showSave, setShowSave] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [saveSummary, setSaveSummary] = useState(summary || '');
  const [saveError, setSaveError] = useState('');
  const [shareType, setShareType] = useState<'public' | 'team' | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState('');
  const [favorite, setFavorite] = useState(isFavorite);

  // Handle favorite toggle
  const handleFavorite = async () => {
    if (!responseId) return;
    setFavoriting(true);
    try {
      await apiClient.toggleFavorite(responseId, !favorite);
      setFavorite(!favorite);
      onStatusChange && onStatusChange();
    } catch (e) {
      // Optionally show error
    } finally {
      setFavoriting(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    setSaveError('');
    if (!saveSummary.trim() || saveSummary.length > 140) {
      setSaveError('Summary is required and must be 140 characters or less.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.saveResponse({
        summary: saveSummary,
        tool_name: toolName,
        response_blob: JSON.stringify(responseBlob),
        team_id: teamId,
      });
      setShowSave(false);
      setSaveSummary('');
      onStatusChange && onStatusChange();
    } catch (e) {
      setSaveError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    setShareError('');
    if (!responseId) return;
    if (!shareType) {
      setShareError('Select share type.');
      return;
    }
    setSharing(true);
    try {
      const res = await apiClient.setShareStatus(
        responseId,
        shareType === 'public',
        shareType === 'team'
      );
      if (shareType === 'public' && res.data?.shared_slug) {
        setPublicLink(`${window.location.origin}/shared/${res.data.shared_slug}`);
      } else {
        setPublicLink(null);
      }
      setShowShare(false);
      setShareType(null);
      onStatusChange && onStatusChange();
    } catch (e) {
      setShareError('Failed to share.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Favorite */}
      {responseId && (
        <button
          className={`text-xl ${favorite ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-500`}
          onClick={handleFavorite}
          disabled={favoriting}
          title={favorite ? 'Unfavorite' : 'Favorite'}
        >
          ⭐
        </button>
      )}
      {/* Save */}
      <button
        className="text-xl text-gray-400 hover:text-blue-500"
        onClick={() => setShowSave(true)}
        title="Save"
      >
        💾
      </button>
      {/* Share */}
      {responseId && (
        <button
          className="text-xl text-gray-400 hover:text-green-500"
          onClick={() => setShowShare(true)}
          title="Share"
        >
          🔗
        </button>
      )}

      {/* Save Modal */}
      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Save Response</h2>
            <label className="block mb-2 text-sm font-medium">Summary (required, max 140 chars)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-2"
              value={saveSummary}
              onChange={e => setSaveSummary(e.target.value.slice(0, 140))}
              maxLength={140}
              placeholder="Short description..."
            />
            <div className="text-xs text-gray-500 mb-2">{saveSummary.length}/140</div>
            {saveError && <div className="text-red-500 text-sm mb-2">{saveError}</div>}
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2" onClick={() => setShowSave(false)} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Share Response</h2>
            <div className="mb-4">
              <label className="inline-flex items-center mr-4">
                <input type="radio" name="shareType" value="public" checked={shareType === 'public'} onChange={() => setShareType('public')} />
                <span className="ml-2">Public Link</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="shareType" value="team" checked={shareType === 'team'} onChange={() => setShareType('team')} />
                <span className="ml-2">Share with Team</span>
              </label>
            </div>
            {shareError && <div className="text-red-500 text-sm mb-2">{shareError}</div>}
            {publicLink && (
              <div className="bg-gray-100 rounded p-2 mb-2 text-xs">
                Public Link: <a href={publicLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{publicLink}</a>
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2" onClick={() => setShowShare(false)} disabled={sharing}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleShare} disabled={sharing || !shareType}>
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
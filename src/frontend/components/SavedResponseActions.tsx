import React, { useState } from 'react';
import { apiClient } from '../lib/api';
import { FaStar, FaSave, FaShare, FaHeart } from 'react-icons/fa';

interface SavedResponseActionsProps {
  responseId?: string;
  toolName: string;
  responseData: any;
  teamId?: string;
  summary?: string;
  isFavorite?: boolean;
  isSharedPublic?: boolean;
  isSharedTeam?: boolean;
  onStatusChange?: () => void;
  // New prompt context fields
  systemPrompt?: string;
  userInput?: string;
  finalPrompt?: string;
  rawResponseText?: string;
}

export const SavedResponseActions: React.FC<SavedResponseActionsProps> = ({
  responseId,
  toolName,
  responseData,
  teamId,
  summary,
  isFavorite = false,
  isSharedPublic = false,
  isSharedTeam = false,
  onStatusChange,
  systemPrompt,
  userInput,
  finalPrompt,
  rawResponseText,
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
  const [currentResponseId, setCurrentResponseId] = useState(responseId);

  // Auto-save function for unsaved responses
  const autoSave = async (action: 'favorite' | 'share'): Promise<string | null> => {
    if (currentResponseId) return currentResponseId; // Already saved
    
    const autoSummary = action === 'favorite' 
      ? `Favorited response from ${toolName}`
      : `Shared response from ${toolName}`;
    
    try {
      const res = await apiClient.saveResponse({
        summary: autoSummary,
        tool_name: toolName,
        response_blob: JSON.stringify(responseData),
        team_id: teamId,
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: rawResponseText,
      });
      
      if (res.data?.data?.id) {
        setCurrentResponseId(res.data.data.id);
        return res.data.data.id;
      }
      return null;
    } catch (e) {
      console.error('Auto-save failed:', e);
      return null;
    }
  };

  // Handle favorite toggle
  const handleFavorite = async () => {
    setFavoriting(true);
    try {
      // Auto-save if needed
      const responseId = await autoSave('favorite');
      if (!responseId) {
        setSaveError('Failed to save response');
        return;
      }

      // Toggle favorite
      await apiClient.toggleFavorite(responseId, !favorite);
      setFavorite(!favorite);
      onStatusChange && onStatusChange();
    } catch (e) {
      setSaveError('Failed to toggle favorite');
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
        response_blob: JSON.stringify(responseData),
        team_id: teamId,
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: rawResponseText,
      });
      
      if (res.data?.data?.id) {
        setCurrentResponseId(res.data.data.id);
        setShowSave(false);
        setSaveSummary('');
        onStatusChange && onStatusChange();
      }
    } catch (e) {
      setSaveError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    setShareError('');
    if (!shareType) {
      setShareError('Select share type.');
      return;
    }

    // Check team requirement for team sharing
    if (shareType === 'team' && !teamId) {
      setShareError('You must belong to a team to share with team.');
      return;
    }

    setSharing(true);
    try {
      // Auto-save if needed
      const responseId = await autoSave('share');
      if (!responseId) {
        setShareError('Failed to save response');
        return;
      }

      // Set share status
      const res = await apiClient.setShareStatus(
        responseId,
        shareType === 'public',
        shareType === 'team'
      );
      
      if (shareType === 'public' && res.data?.data?.shared_slug) {
        setPublicLink(`${window.location.origin}/shared/${res.data.data.shared_slug}`);
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
    <div className="flex gap-3 items-center justify-end pt-1">
      {/* Save */}
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowSave(true)}
        disabled={saving || favoriting || sharing}
        title="Save"
      >
        <FaSave className="w-4 h-4" />
        <span>Save</span>
      </button>
      
      {/* Favorite */}
      <button
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          favorite 
            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
        }`}
        onClick={handleFavorite}
        disabled={saving || favoriting || sharing}
        title={favorite ? 'Unfavorite' : 'Favorite'}
      >
        <FaHeart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
        <span>{favorite ? 'Favorited' : 'Favorite'}</span>
      </button>
      
      {/* Share */}
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowShare(true)}
        disabled={saving || favoriting || sharing}
        title="Share"
      >
        <FaShare className="w-4 h-4" />
        <span>Share</span>
      </button>

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
            {!teamId && (
              <div className="text-yellow-600 text-sm mb-2">
                ⚠️ You must belong to a team to share with team.
              </div>
            )}
            {shareError && <div className="text-red-500 text-sm mb-2">{shareError}</div>}
            {publicLink && (
              <div className="bg-gray-100 rounded p-2 mb-2 text-xs">
                Public Link: <a href={publicLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{publicLink}</a>
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2" onClick={() => setShowShare(false)} disabled={sharing}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleShare} disabled={sharing || !shareType || (shareType === 'team' && !teamId)}>
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedResponseActions; 
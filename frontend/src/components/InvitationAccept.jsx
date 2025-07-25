import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, Users, Mail, Clock } from 'lucide-react';
import { collaborationService } from '../services/collaboration';

const InvitationAccept = ({ onAccept, onDecline }) => {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setLoading(true);
        const invitationData = await collaborationService.getInvitation(invitationId);
        
        if (!invitationData) {
          setError('Invitation not found');
          return;
        }

        if (invitationData.status !== 'pending') {
          setError('Invitation has already been processed');
          return;
        }

        if (new Date() > new Date(invitationData.expiresAt)) {
          setError('Invitation has expired');
          return;
        }

        setInvitation(invitationData);
      } catch (error) {
        setError('Failed to load invitation');
        console.error('Failed to load invitation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [invitationId]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const collaborator = await collaborationService.acceptInvitation(invitationId);
      
      // Show success message and redirect to main app
      console.log('Invitation accepted successfully!');
      navigate('/', { 
        state: { 
          message: 'Invitation accepted! You can now collaborate on the thread.',
          collaborator 
        } 
      });
    } catch (error) {
      setError('Failed to accept invitation');
      console.error('Failed to accept invitation:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigate('/', { 
      state: { 
        message: 'Invitation declined.' 
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading invitation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Collaboration Invitation</h2>
          <p className="text-gray-600">You've been invited to collaborate on a FlowChat thread</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900">{invitation.name}</div>
                <div className="text-sm text-gray-500">{invitation.email}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Thread ID:</span>
                <span className="text-sm font-medium">{invitation.threadId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm font-medium capitalize">{invitation.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invited by:</span>
                <span className="text-sm font-medium">{invitation.invitedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Invited:</span>
                <span className="text-sm font-medium">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {invitation.message && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>Message:</strong> {invitation.message}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={accepting}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
          >
            {accepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Accept Invitation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationAccept; 
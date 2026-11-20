import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal, NexoraLogo } from '../ui/Primitives';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  reason?: string;
}

export function AuthModal({ open, onClose, onAuthenticated, reason }: AuthModalProps) {
  const { signInWithGoogle, signingIn, authError } = useAuth();

  const handleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      onClose();
      onAuthenticated?.();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Continue to NEXORA Workspace"
      description={
        reason ||
        'Sign in with your Google account to save AI roadmaps, manage milestones, and sync tasks securely.'
      }
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-5">
        <div className="py-4 border-y border-[var(--nx-border-subtle)] flex flex-col gap-3">
          <NexoraLogo />
          <p className="text-sm text-[var(--nx-text-secondary)] leading-relaxed">
            Every project, milestone, task, and resource bookmark is encrypted in transit and isolated to your private account.
          </p>
          <div className="flex flex-col gap-2 pt-1 text-xs text-[var(--nx-text-secondary)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--nx-accent-primary)] shrink-0" />
              <span>Instant AI Idea Lab blueprint generation & editing</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--nx-success)] shrink-0" />
              <span>Real-time Cloud Firestore persistence across devices</span>
            </div>
          </div>
        </div>

        {authError && (
          <div
            role="alert"
            className="rounded-lg px-3.5 py-2.5 text-xs bg-[var(--nx-error-bg)] text-[var(--nx-error)] border border-[var(--nx-error)]/25"
          >
            {authError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSignIn} loading={signingIn} className="sm:min-w-[190px]">
            Continue with Google
          </Button>
        </div>
      </div>
    </Modal>
  );
}

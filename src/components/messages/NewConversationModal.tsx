'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  tutorProfile?: {
    subjects: string[];
    hourlyRate: number;
  };
}

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (participantId: string, initialMessage: string) => void;
  currentUserRole: string;
  currentUserId: string;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onCreate,
  currentUserRole,
  currentUserId,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [step, setStep] = useState<'select' | 'message'>('select');

  // Fetch users based on role
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // If student, fetch tutors. If tutor, fetch students from sessions
        const endpoint = currentUserRole === 'student' ? '/api/tutors' : '/api/sessions';
        const res = await fetch(endpoint);
        const data = await res.json();

        if (currentUserRole === 'student') {
          // Tutors endpoint returns tutors directly
          setUsers(data.tutors?.map((t: User) => ({ ...t, role: 'tutor' })) || []);
        } else {
          // Sessions endpoint - extract students from sessions
          const students = data.sessions
            ?.filter((s: { status: string }) => s.status === 'accepted' || s.status === 'completed')
            .map((s: { student: User }) => s.student)
            .filter((student: User, index: number, self: User[]) =>
              index === self.findIndex((s) => s._id === student._id)
            ) || [];
          setUsers(students);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, currentUserRole]);

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.tutorProfile?.subjects?.some((s) => s.toLowerCase().includes(query))
    );
  });

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setStep('message');
  };

  const handleSubmit = () => {
    if (!selectedUser || !initialMessage.trim()) return;
    onCreate(selectedUser._id, initialMessage.trim());
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setInitialMessage('');
    setStep('select');
  };

  const handleBack = () => {
    setStep('select');
    setInitialMessage('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            {step === 'select' ? 'New Conversation' : `Message ${selectedUser?.name}`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--color-paper)' }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-ink)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'select' ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--color-ink-50)' }}
                />
                <input
                  type="text"
                  placeholder={`Search ${currentUserRole === 'student' ? 'tutors' : 'students'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-paper)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>

              {/* User List */}
              <div
                className="max-h-80 overflow-y-auto space-y-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-gold)' }} />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-ink-50)' }} />
                    <p
                      className="text-sm"
                      style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                    >
                      {searchQuery
                        ? 'No users found'
                        : currentUserRole === 'student'
                        ? 'No tutors available'
                        : 'Start accepting sessions to message students'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full p-3 rounded-xl transition-all text-left flex items-center gap-3"
                      style={{ backgroundColor: 'var(--color-paper)' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-gold-pale)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-paper)')
                      }
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          backgroundColor: user.profilePicture
                            ? 'transparent'
                            : 'var(--color-gold)',
                          color: 'var(--color-canvas)',
                        }}
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                        >
                          {user.name}
                        </p>
                        {user.tutorProfile?.subjects && (
                          <p
                            className="text-xs truncate"
                            style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                          >
                            {user.tutorProfile.subjects.slice(0, 3).join(', ')}
                            {user.tutorProfile.subjects.length > 3 && '...'}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected User Info */}
              <div
                className="p-3 rounded-xl mb-4 flex items-center gap-3"
                style={{ backgroundColor: 'var(--color-gold-pale)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: selectedUser?.profilePicture
                      ? 'transparent'
                      : 'var(--color-gold)',
                    color: 'var(--color-canvas)',
                  }}
                >
                  {selectedUser?.profilePicture ? (
                    <img
                      src={selectedUser.profilePicture}
                      alt={selectedUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(selectedUser?.name || '')
                  )}
                </div>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                  >
                    {selectedUser?.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                  >
                    {selectedUser?.email}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="ml-auto text-xs px-3 py-1 rounded-lg border transition-all"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink-50)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-gold)';
                    e.currentTarget.style.color = 'var(--color-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-ink-50)';
                  }}
                >
                  Change
                </button>
              </div>

              {/* Message Input */}
              <textarea
                placeholder="Type your first message..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full p-4 rounded-xl text-sm border outline-none transition-all resize-none"
                rows={4}
                style={{
                  backgroundColor: 'var(--color-paper)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!initialMessage.trim()}
                className="w-full mt-4 py-3 rounded-xl font-semibold transition-all"
                style={{
                  backgroundColor: initialMessage.trim()
                    ? 'var(--color-gold)'
                    : 'var(--color-border)',
                  color: initialMessage.trim()
                    ? 'var(--color-canvas)'
                    : 'var(--color-ink-50)',
                  cursor: initialMessage.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Start Conversation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

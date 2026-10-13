import React from 'react';
import type { TypingUser } from '../../../sockets/useSocketEvents';

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.userName).join(', ');

  return (
    <div className="typing-chip">
      <div className="flex space-x-[3px]">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>
        {names} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
};
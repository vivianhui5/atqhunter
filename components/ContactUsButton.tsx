'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import InquiryModal from './InquiryModal';

export default function ContactUsButton() {
  const [showInquiry, setShowInquiry] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowInquiry(true)}
        className="inquire-button"
        style={{ maxWidth: '300px', margin: '0 auto' }}
      >
        <Mail size={20} />
        Contact Us / 联系我们
      </button>
      <InquiryModal
        isOpen={showInquiry}
        onClose={() => setShowInquiry(false)}
      />
    </>
  );
}


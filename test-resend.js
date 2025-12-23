// Quick test script to verify Resend API key
// Run with: node test-resend.js

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

const resend = new Resend(apiKey);

// Test sending a simple email
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'huikh2r@yahoo.com',
  subject: 'Test Email from ATQ Hunter',
  html: '<p>This is a test email to verify Resend is working.</p>',
})
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error sending test email:', error);
      process.exit(1);
    }
    console.log('✅ Test email sent successfully!');
    console.log('Email ID:', data?.id);
  })
  .catch((err) => {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  });


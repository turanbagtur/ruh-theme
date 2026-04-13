export const metadata = {
  title: 'Privacy Policy — YomiTranslate',
  description: 'YomiTranslate privacy policy - how we handle your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="page-container fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '32px' }}>Last updated: March 2026</p>

      <div className="policy-content">
        <h2>1. Information We Collect</h2>
        <p>When you create an account, we collect your username, email address, and an encrypted version of your password. We do not store passwords in plain text.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain your account</li>
          <li>Enable you to save favorites and reading progress</li>
          <li>Deliver AI-powered manga translations through our integration with Torii Translate</li>
          <li>Improve our services and user experience</li>
        </ul>

        <h2>3. Data Storage & Security</h2>
        <p>Your data is stored securely with the following protections:</p>
        <ul>
          <li>Passwords are hashed using bcrypt with 12 rounds of salting</li>
          <li>API keys are encrypted using AES-256-GCM</li>
          <li>Authentication uses JSON Web Tokens (JWT) with 7-day expiry</li>
          <li>All connections are encrypted via HTTPS in production</li>
        </ul>

        <h2>4. Third-Party Services</h2>
        <p>We use <strong>Torii Translate</strong> for AI-powered manga page translation. When you request a translation, the manga page image is sent to Torii Translate&apos;s API for processing. No personal information is shared with this service.</p>

        <h2>5. Cookies & Local Storage</h2>
        <p>We use browser local storage to maintain your login session. We do not use tracking cookies or third-party analytics.</p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data through your profile page</li>
          <li>Update or correct your information at any time</li>
          <li>Request deletion of your account by contacting the administrator</li>
          <li>Export your data upon request</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>We retain your data for as long as your account is active. Translated manga pages are cached to reduce API costs and improve performance. If you delete your account, your personal data will be removed from our systems.</p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>YomiTranslate is not intended for children under the age of 13. We do not knowingly collect personal information from children.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated revision date.</p>

        <h2>10. Contact</h2>
        <p>If you have questions about this privacy policy, please contact the site administrator.</p>
      </div>
    </div>
  );
}

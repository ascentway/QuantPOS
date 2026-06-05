import React from 'react';
import LegalPage from './LegalPage';

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'data-collected', label: '2. Data we collect' },
  { id: 'how-we-use', label: '3. How we use your data' },
  { id: 'sharing', label: '4. Data sharing' },
  { id: 'storage', label: '5. Data storage & security' },
  { id: 'rights', label: '6. Your rights' },
  { id: 'cookies', label: '7. Cookies' },
  { id: 'contact', label: '8. Contact us' },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" badge="Privacy" updated="June 4, 2026" accentColor="#7b39fc" toc={TOC}>
      <h2 id="overview">1. Overview</h2>
      <p>QuantPOS Technologies ("QuantPOS", "we", "our") is committed to protecting the privacy of merchants and their customers. This policy explains what data we collect, how we use it, and your rights over it.</p>
      <p>By using QuantPOS you agree to this Privacy Policy. If you do not agree, please discontinue use of the service.</p>

      <h2 id="data-collected">2. Data we collect</h2>
      <h3>2.1 Account data</h3>
      <p>When you register for QuantPOS, we collect: business name, owner name, email address, phone number (optional), business type, and GSTIN (optional).</p>

      <h3>2.2 Transaction data</h3>
      <p>We store all sales transactions, inventory movements, and purchase orders processed through your QuantPOS account. This is your operational data — it belongs to you.</p>

      <h3>2.3 Team member data</h3>
      <p>When you invite team members, we collect their email addresses, names, and role assignments. Team members can only access data scoped to your organisation.</p>

      <h3>2.4 Technical data</h3>
      <p>We automatically collect: IP addresses (for audit logs and fraud prevention), browser type and version, device type, session timestamps, and error logs.</p>

      <h2 id="how-we-use">3. How we use your data</h2>
      <ul>
        <li>To operate and improve the QuantPOS service</li>
        <li>To send transactional emails (OTP, receipts, alerts)</li>
        <li>To detect fraud, abuse, and security incidents</li>
        <li>To generate aggregated, anonymised insights about platform usage (never shared individually)</li>
        <li>To comply with legal obligations (GST, income tax, RBI regulations)</li>
      </ul>
      <p>We do <strong>not</strong> sell your data to third parties. We do not use your data for advertising.</p>

      <h2 id="sharing">4. Data sharing</h2>
      <p>We share data only with:</p>
      <ul>
        <li><strong>Infrastructure providers:</strong> AWS (hosting), Razorpay (payments). All under DPA agreements.</li>
        <li><strong>Email providers:</strong> For transactional emails only (SendGrid).</li>
        <li><strong>Legal authorities:</strong> Only when required by Indian law (e.g., court order, IT Act).</li>
      </ul>

      <h2 id="storage">5. Data storage & security</h2>
      <p>All data is stored in India on AWS Mumbai (ap-south-1) region. We implement:</p>
      <ul>
        <li>AES-256 encryption at rest and TLS 1.2+ in transit</li>
        <li>Row-level data isolation between tenants (your data cannot be read by other merchants)</li>
        <li>BCrypt password hashing with cost factor 12</li>
        <li>JWT access tokens (15-minute expiry) with refresh token rotation</li>
        <li>2FA OTP on every login — mandatory, not optional</li>
      </ul>

      <h2 id="rights">6. Your rights</h2>
      <p>Under the Indian Personal Data Protection Act (DPDPA) and GDPR (if applicable), you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a full export of your data</li>
        <li><strong>Correction:</strong> Update inaccurate personal data</li>
        <li><strong>Deletion:</strong> Request erasure of your account and data (within 30 days)</li>
        <li><strong>Portability:</strong> Export your data in CSV or JSON format</li>
        <li><strong>Objection:</strong> Opt out of non-essential communications</li>
      </ul>
      <p>To exercise any of these rights, email <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a>.</p>

      <h2 id="cookies">7. Cookies</h2>
      <p>QuantPOS uses only essential cookies for session management and authentication. We do not use advertising or tracking cookies. See our <a href="/cookie-policy">Cookie Policy</a> for details.</p>

      <h2 id="contact">8. Contact us</h2>
      <p>Data Protection Officer: <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a></p>
      <p>QuantPOS Technologies · India</p>
    </LegalPage>
  );
}

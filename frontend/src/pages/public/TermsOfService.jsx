import React from 'react';
import LegalPage from './LegalPage';

const TOC = [
  { id: 'acceptance', label: '1. Acceptance' },
  { id: 'service', label: '2. The service' },
  { id: 'accounts', label: '3. Accounts' },
  { id: 'billing', label: '4. Billing' },
  { id: 'acceptable-use', label: '5. Acceptable use' },
  { id: 'data', label: '6. Data ownership' },
  { id: 'liability', label: '7. Liability' },
  { id: 'termination', label: '8. Termination' },
  { id: 'changes', label: '9. Changes to terms' },
  { id: 'contact', label: '10. Contact' },
];

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" badge="Legal" updated="June 4, 2026" accentColor="#00A4A4" toc={TOC}>
      <h2 id="acceptance">1. Acceptance of terms</h2>
      <p>By accessing or using the QuantPOS service ("Service"), you agree to these Terms of Service ("Terms"). If you are using the Service on behalf of a business, you represent that you have authority to bind that business.</p>
      <p>These Terms are governed by the laws of India. Any dispute shall be subject to the jurisdiction of courts in India.</p>

      <h2 id="service">2. The service</h2>
      <p>QuantPOS provides a cloud-based point-of-sale and inventory management platform designed for Indian retail and F&B businesses. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.</p>

      <h2 id="accounts">3. Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised access. QuantPOS enforces mandatory 2FA on all accounts  do not share your OTP codes.</p>
      <p>One person or legal entity may not maintain more than one free account. We reserve the right to terminate duplicate accounts.</p>

      <h2 id="billing">4. Billing and payments</h2>
      <p>All paid plans are billed in Indian Rupees (INR) exclusive of 18% GST. Annual plans are billed upfront for the full year. Monthly plans are billed at the start of each billing cycle.</p>
      <p><strong>Refunds:</strong> Monthly plans are non-refundable once the billing cycle starts. Annual plans may receive a pro-rated refund within 30 days of purchase if you have not processed more than 100 transactions. Enterprise contracts are subject to separate SLA and refund terms.</p>
      <p>If payment fails, we will retry 3 times over 7 days. After that, your account will be downgraded to read-only mode. Your data is retained for 90 days before deletion.</p>

      <h2 id="acceptable-use">5. Acceptable use</h2>
      <p>You agree not to use QuantPOS to:</p>
      <ul>
        <li>Process illegal transactions or goods prohibited under Indian law</li>
        <li>Reverse-engineer, decompile, or scrape the Service</li>
        <li>Introduce malware, spam, or denial-of-service attacks</li>
        <li>Attempt to access another merchant's data</li>
        <li>Resell the Service without our written permission</li>
      </ul>

      <h2 id="data">6. Data ownership</h2>
      <p>You own your data. QuantPOS does not claim any ownership over your business data, products, sales records, or customer information. Upon account termination, you may export your data within 30 days. After 90 days, data is permanently deleted.</p>

      <h2 id="liability">7. Limitation of liability</h2>
      <p>QuantPOS is provided "as is". To the maximum extent permitted by Indian law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the fees you paid in the 3 months preceding the claim.</p>

      <h2 id="termination">8. Termination</h2>
      <p>You may cancel your account at any time from Account Settings. We may terminate your account immediately if you breach these Terms. Upon termination, your right to access the Service ceases immediately, but your data remains accessible for export for 30 days.</p>

      <h2 id="changes">9. Changes to terms</h2>
      <p>We may update these Terms at any time. Material changes will be communicated by email at least 30 days in advance. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

      <h2 id="contact">10. Contact</h2>
      <p>Legal inquiries: <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a></p>
      <p>QuantPOS Technologies · India</p>
    </LegalPage>
  );
}

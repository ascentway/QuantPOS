import React from 'react';
import LegalPage from './LegalPage';

export default function GDPR() {
  return (
    <LegalPage title="GDPR & Data Rights" badge="GDPR" updated="June 4, 2026" accentColor="#10b981"
      toc={[
        { id: 'basis', label: '1. Legal basis' },
        { id: 'rights', label: '2. Your rights' },
        { id: 'transfers', label: '3. Data transfers' },
        { id: 'retention', label: '4. Data retention' },
        { id: 'dpa', label: '5. Data processor agreements' },
        { id: 'contact', label: '6. Contact DPO' },
      ]}>
      <p>If you are a resident of the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR). QuantPOS is also aligned with India's Digital Personal Data Protection Act (DPDPA) 2023.</p>

      <h2 id="basis">1. Legal basis for processing</h2>
      <p>We process your personal data under the following lawful bases:</p>
      <ul>
        <li><strong>Contract:</strong> Processing necessary to provide the QuantPOS service you signed up for</li>
        <li><strong>Legitimate interests:</strong> Security monitoring, fraud prevention, service improvement</li>
        <li><strong>Legal obligation:</strong> GST compliance, income tax records, regulatory requirements</li>
        <li><strong>Consent:</strong> For optional marketing communications (you can withdraw at any time)</li>
      </ul>

      <h2 id="rights">2. Your rights under GDPR / DPDPA</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access (Article 15):</strong> Obtain a copy of all personal data we hold about you</li>
        <li><strong>Rectification (Article 16):</strong> Correct inaccurate or incomplete personal data</li>
        <li><strong>Erasure (Article 17):</strong> Request deletion of your personal data ("right to be forgotten")</li>
        <li><strong>Restriction (Article 18):</strong> Request we stop processing your data in certain circumstances</li>
        <li><strong>Portability (Article 20):</strong> Receive your data in a structured, machine-readable format</li>
        <li><strong>Objection (Article 21):</strong> Object to processing based on legitimate interests</li>
        <li><strong>Automated decisions:</strong> Not be subject to solely automated decisions that significantly affect you</li>
      </ul>
      <p>To exercise any right, email <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a>. We will respond within 30 days.</p>

      <h2 id="transfers">3. International data transfers</h2>
      <p>QuantPOS stores all data in India (AWS Mumbai — ap-south-1). If data is transferred outside India (e.g., for email delivery), it is done under Standard Contractual Clauses (SCCs) or equivalent safeguards.</p>

      <h2 id="retention">4. Data retention</h2>
      <ul>
        <li><strong>Active accounts:</strong> Data retained for the life of your account</li>
        <li><strong>After cancellation:</strong> Data retained in read-only form for 90 days, then deleted</li>
        <li><strong>Financial records:</strong> Retained for 7 years to comply with Indian tax law</li>
        <li><strong>Audit logs:</strong> Retained for 2 years for security and legal compliance</li>
      </ul>

      <h2 id="dpa">5. Data processor agreements</h2>
      <p>QuantPOS acts as a <strong>data controller</strong> for account and operational data. When processing data on behalf of your customers, QuantPOS acts as a <strong>data processor</strong>. Enterprise customers may request a Data Processing Agreement (DPA).</p>

      <h2 id="contact">6. Contact our Data Protection Officer</h2>
      <p>DPO email: <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a></p>
      <p>Subject line: "GDPR / Data Rights Request"</p>
      <p>We aim to respond to all data rights requests within <strong>15 business days</strong>.</p>
      <p>If you are not satisfied with our response, you may lodge a complaint with your national data protection authority or the Indian Ministry of Electronics and Information Technology (MeitY).</p>
    </LegalPage>
  );
}

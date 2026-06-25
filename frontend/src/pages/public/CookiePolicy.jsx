import React from 'react';
import LegalPage from './LegalPage';

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy" badge="Cookies" updated="June 4, 2026" accentColor="#00A4A4"
      toc={[
        { id: 'what', label: '1. What are cookies' },
        { id: 'we-use', label: '2. Cookies we use' },
        { id: 'no-tracking', label: '3. No tracking cookies' },
        { id: 'manage', label: '4. Managing cookies' },
        { id: 'contact', label: '5. Contact' },
      ]}>
      <h2 id="what">1. What are cookies?</h2>
      <p>Cookies are small text files stored on your device by your browser. They help websites remember your preferences and maintain sessions across page loads.</p>

      <h2 id="we-use">2. Cookies QuantPOS uses</h2>
      <p>QuantPOS uses only <strong>essential (strictly necessary) cookies</strong>. We do not use any advertising, tracking, or third-party analytics cookies.</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Cookie</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Purpose</th>
            <th style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Expiry</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['qp_access_token', 'JWT access token for API authentication', '15 minutes'],
            ['qp_refresh_token', 'Secure HttpOnly refresh token for session renewal', '7 days'],
            ['qp_theme', 'User theme preference (dark / light)', '1 year'],
            ['qp_session_id', 'Anonymous session identifier for security logging', 'Session'],
          ].map(([name, purpose, expiry]) => (
            <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#00A4A4' }}>{name}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{purpose}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{expiry}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="no-tracking">3. No tracking or advertising cookies</h2>
      <p>We do <strong>not</strong> use:</p>
      <ul>
        <li>Google Analytics or any analytics cookie</li>
        <li>Facebook Pixel or any social media tracking</li>
        <li>Any third-party advertising network</li>
        <li>Cross-site tracking of any kind</li>
      </ul>

      <h2 id="manage">4. Managing cookies</h2>
      <p>Because we only use essential cookies, blocking them may prevent the application from functioning. You can manage cookies through your browser settings. Note that disabling the access/refresh token cookies will log you out.</p>
      <p>For guidance on managing cookies in your browser, visit <a href="https://www.allaboutcookies.org" target="_blank" rel="noreferrer">allaboutcookies.org</a>.</p>

      <h2 id="contact">5. Contact</h2>
      <p>Questions about our cookie usage? Email <a href="mailto:quantpos@gmail.com">quantpos@gmail.com</a>.</p>
    </LegalPage>
  );
}

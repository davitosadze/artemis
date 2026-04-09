export default function Support() {
  return (
    <section className="support-section">
      <div className="container">
        <div className="support-panel">
          <div className="support-glow-ring" />
          <div className="support-content">
            <div className="support-badge">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="23" stroke="rgba(255,180,0,0.4)" strokeWidth="1" />
                <circle cx="24" cy="24" r="18" stroke="rgba(255,180,0,0.2)" strokeWidth="1" />
                <text x="24" y="30" textAnchor="middle" fontSize="22" fill="#FFB800">☕</text>
              </svg>
            </div>
            <div className="support-text">
              <h3 className="support-title">SUPPORT THIS PROJECT</h3>
              <p className="support-desc">
                An independent passion project — no ads, no tracking, no paywalls.
                Built entirely from love for space exploration.
                Live telemetry is powered by real NASA/JPL data.
              </p>
              <div className="support-tags">
                <span className="support-tag">✓ 100% FREE</span>
                <span className="support-tag">✓ NO ADS</span>
                <span className="support-tag">✓ REAL NASA DATA</span>
                <span className="support-tag">✓ OPEN SOURCE</span>
              </div>
            </div>
            <a
              href="https://ko-fi.com/davitosadze"
              target="_blank"
              rel="noopener noreferrer"
              className="kofi-btn"
              aria-label="Support on Ko-fi"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.91-2.059 3.015z" fill="#FF5E5B"/>
              </svg>
              BUY ME A COFFEE
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

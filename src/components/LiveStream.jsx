export default function LiveStream() {
  return (
    <section className="livestream-section">
      <div className="container">
        <h2 className="section-title">
          <span className="live-dot" />
          &nbsp;NASA LIVE TV
        </h2>
        <div className="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/m3kR2KK8TEs?si=aOq_OygBGqNRtAyU"
            title="NASA Live TV — Artemis II Mission Coverage"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <div className="video-overlay-label">
            NASA LIVE · ARTEMIS II COVERAGE
          </div>
        </div>
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <a
            href="https://www.youtube.com/@NASA/live"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "2px",
              color: "rgba(0,180,255,0.55)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.color = "rgba(0,220,255,0.9)")}
            onMouseOut={(e) => (e.target.style.color = "rgba(0,180,255,0.55)")}>
            ↗ WATCH DIRECTLY ON YOUTUBE NASA
          </a>
        </div>
      </div>
    </section>
  );
}

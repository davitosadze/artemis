export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="footer-title">ARTEMIS II LIVE TRACKER</span>
            <span className="footer-sub">Unofficial fan tracker · Data via JPL Horizons & NASA</span>
          </div>
          <div className="footer-links">
            <a href="https://www.nasa.gov/artemis" target="_blank" rel="noopener noreferrer">NASA Artemis</a>
            <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener noreferrer">JPL Horizons</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

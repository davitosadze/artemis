export default function Header({ utc }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-logo">
          <div className="nasa-logo">
            <svg
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48">
              <circle
                cx="30"
                cy="30"
                r="28"
                stroke="#E03030"
                strokeWidth="2.5"
              />
              <ellipse
                cx="30"
                cy="30"
                rx="28"
                ry="10"
                stroke="#E03030"
                strokeWidth="2"
                transform="rotate(-20 30 30)"
              />
              <text
                x="30"
                y="35"
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontFamily="Arial Black"
                fontWeight="900"
                letterSpacing="1">
                NASA
              </text>
            </svg>
          </div>
          <div className="logo-text">
            <span className="mission-name">ARTEMIS II</span>
            <span className="mission-sub">LIVE MISSION TRACKER</span>
          </div>
        </div>
        <div className="header-status">
          <div className="live-badge">
            <span className="live-dot" />
            LIVE
          </div>
          <div className="utc-clock">{utc}</div>
          <a
            href="https://ko-fi.com/davitosadze"
            target="_blank"
            rel="noopener noreferrer"
            className="header-kofi"
            title="Support this project on Ko-fi">
            ☕ <span>SUPPORT</span>
          </a>
        </div>
      </div>
    </header>
  );
}

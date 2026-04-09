import { CREW } from '../data/missionData';

export default function Crew() {
  return (
    <section className="crew-section">
      <div className="container">
        <h2 className="section-title">CREW</h2>
        <div className="crew-grid">
          {CREW.map((c, i) => (
            <div key={i} className="crew-card">
              <div
                className="crew-avatar"
                style={{ background: `linear-gradient(135deg, ${c.color1}, ${c.color2})` }}
              >
                <span>{c.initials}</span>
              </div>
              <div className="crew-name">{c.name}</div>
              <div className="crew-role">{c.role}</div>
              <div className="crew-agency">{c.agency}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Starfield from "./components/Starfield.jsx";
import Header from "./components/Header.jsx";
import MissionProgress from "./components/MissionProgress.jsx";
import Hero from "./components/Hero.jsx";
import TelemetryGrid from "./components/TelemetryGrid.jsx";
import EventsSection from "./components/EventsSection.jsx";
import LiveStream from "./components/LiveStream.jsx";
import Timeline from "./components/Timeline.jsx";
import Crew from "./components/Crew.jsx";
import Support from "./components/Support.jsx";
import Footer from "./components/Footer.jsx";
import useMissionClock from "./hooks/useMissionClock.js";
import useJPLHorizons from "./hooks/useJPLHorizons.js";

export default function App() {
  const clock = useMissionClock();
  const { distEarth, speedKmh, isLive } = useJPLHorizons();

  return (
    <>
      <Starfield />
      <Header utc={clock.utc} />
      <MissionProgress />
      <main>
        <Hero
          clock={clock}
          distEarth={distEarth}
          speedKmh={speedKmh}
          distMoon={clock.simDistMoon}
          isLive={isLive}
        />
        <section
          className="container"
          style={{ paddingTop: "40px", paddingBottom: "20px" }}>
          <h2 className="section-title">LIVE TELEMETRY</h2>
          <TelemetryGrid
            distEarth={distEarth}
            speedKmh={speedKmh}
            simDistEarth={clock.simDistEarth}
            simSpeedKmh={clock.simSpeedKmh}
            simDistMoon={clock.simDistMoon}
            isLive={isLive}
          />
        </section>
        <EventsSection
          nextManeuver={clock.nextManeuver}
          maneuverEta={clock.maneuverEta}
          nextCoverage={clock.nextCoverage}
          coverageEta={clock.coverageEta}
          splashdown={clock.splashdown}
          distEarth={
            isLive && distEarth != null ? distEarth : clock.simDistEarth
          }
          distEarthMi={
            (isLive && distEarth != null ? distEarth : clock.simDistEarth) *
            0.621371
          }
        />
        <LiveStream />
        <Timeline />
        <Crew />
        <Support />
      </main>
      <Footer />
    </>
  );
}

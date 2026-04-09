// Netlify serverless function — proxies JPL Horizons API server-side to avoid CORS
// Node 18+ built-in fetch is available on Netlify Functions runtime
exports.handler = async (event) => {
  // Use rawQuery to preserve exact encoding (e.g. %27 for single-quotes required by Horizons)
  const rawQuery = event.rawQuery || "";
  const jplUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${rawQuery}`;

  try {
    const response = await fetch(jplUrl, {
      headers: {
        "User-Agent":
          "ArtemisIILiveTracker/1.0 (https://artemislivetrack.netlify.app)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`JPL responded ${response.status}`);

    const data = await response.json();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};

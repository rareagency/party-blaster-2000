const { getBulbs } = require("../lamps");
const { getTempo, getLoudness } = require("../songProperties");

let runningId = null;

module.exports = async function onSongChange(id, songDetails, songAnalysis) {
  runningId = id;

  let tick = 0;
  const songStart = Date.now();

  const bulbs = Object.values(getBulbs());

  // Set song color
  const initialHue = Math.round(songDetails.energy * 360);

  const starts = songDetails.energy > 0.8 && songDetails.danceability < 0.7;

  if (starts) {
    await Promise.all(bulbs.map((b) => b.setHue(initialHue)));
  }

  const minLoudness = Math.min(
    ...songAnalysis.sections.map(({ loudness }) => loudness)
  );

  while (starts && runningId === id) {
    console.clear();

    const tickStart = Date.now();
    const duration = Date.now() - songStart;
    const tempo = getTempo(songAnalysis, duration);
    const loudness = getLoudness(songAnalysis, duration);

    const loudnessPercentage = Math.max(0.1, 1 - loudness / minLoudness);

    await Promise.all(
      bulbs.map((b) => {
        const brightness =
          tick % 2 === 0 ? 80 * loudnessPercentage : 100 * loudnessPercentage;
        return b.setBrightness(brightness, 0);
      })
    );

    console.log({
      // ...songDetails,
      loud: loudness / minLoudness,
      minLoudness,
      loudness,
      pattern: "strobo",
      id,
      duration: duration / 1000,
      bulbs: bulbs.length,
      tempo,
      loudness,
      energy: songDetails.energy,
    });

    const nextTickIn = (60 / tempo) * 1000;
    const tickDuration = Date.now() - tickStart;

    tick++;

    await new Promise((resolve) =>
      setTimeout(resolve, nextTickIn - tickDuration)
    );
  }
};

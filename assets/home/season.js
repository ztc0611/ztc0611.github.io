// The inlet follows the visitor's calendar the way it follows their clock.
// Every value is a smooth function of the day of year, so neighbouring days
// look nearly identical and no date produces a hard cut between seasons.

const DAY = 86400000;

function dayOfYear(date) {
  return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / DAY;
}

// A raised-cosine bump that is 1 across [start, end] and eases to 0 over `ramp`
// days on either side, wrapping across the new year.
function band(day, start, end, ramp) {
  const distance = d => Math.min(Math.abs(d), 365 - Math.abs(d));
  const inside = start <= end ? day >= start && day <= end : day >= start || day <= end;
  if (inside) return 1;
  const gap = Math.min(distance(day - start), distance(day - end));
  if (gap >= ramp) return 0;
  return .5 + .5 * Math.cos(Math.PI * gap / ramp);
}

// Share of days with measurable precipitation at Friday Harbor, by month
// (climate-normal days >= 0.01 in, divided by the days in each month).
const monthlyRain = [.54, .49, .46, .34, .31, .25, .16, .25, .39, .49, .54, .51];

function parseOverride() {
  if (typeof location === 'undefined') return null;
  const value = new URLSearchParams(location.search).get('season');
  if (!value) return null;
  const named = { summer: '08-12', fall: '10-18', autumn: '10-18', winter: '01-15', spring: '04-20' }[value] || value;
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(named);
  if (!match) return null;
  return new Date(new Date().getFullYear(), Number(match[1]) - 1, Number(match[2]), 12);
}

const override = parseOverride();

export function seasonForDate(date = override || new Date()) {
  const day = dayOfYear(date);
  return {
    date,
    override: date === override,
    // Late-summer grass cures to gold and only greens again once fall rain returns.
    cured: band(day, 190, 285, 32),
    // Bigleaf and vine maple turn from late September and are bare by late November.
    foliage: band(day, 280, 310, 22),
    bare: band(day, 330, 60, 25),
    // Larches at treeline peak in the first weeks of October.
    larch: band(day, 272, 292, 12),
    // Fresh snow on the lower ridges from mid-October through spring.
    dusting: band(day, 300, 120, 30),
    // Radiation fog pools in the channels on still autumn mornings.
    mist: band(day, 265, 330, 24),
    // Bioluminescent plankton bloom in the Sound's warmest water.
    glow: band(day, 196, 258, 20),
    rainChance: monthlyRain[date.getMonth()]
  };
}

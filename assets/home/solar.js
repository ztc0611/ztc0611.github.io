import SunCalc from './vendor/suncalc.mjs';

export const coast = { latitude: 48.54193, longitude: -122.83040 };

function instantAtLocalHour(hour, today) {
  const instant = new Date(today);
  // Set wall-clock fields, rather than adding elapsed hours from midnight:
  // the visitor's local day can contain a daylight-saving transition.
  instant.setHours(0, 0, 0, 0);
  instant.setSeconds(Math.round(hour * 3600));
  return instant;
}

export function sunAtLocalHour(hour, today = new Date()) {
  return SunCalc.getPosition(instantAtLocalHour(hour, today), coast.latitude, coast.longitude);
}

export function moonAtLocalHour(hour, today = new Date()) {
  const instant = instantAtLocalHour(hour, today);
  const { altitude, azimuth } = SunCalc.getMoonPosition(instant, coast.latitude, coast.longitude);
  const { fraction, phase } = SunCalc.getMoonIllumination(instant);
  return { altitude, azimuth, fraction, phase };
}

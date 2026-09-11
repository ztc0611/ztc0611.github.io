import SunCalc from './vendor/suncalc.mjs';

export const coast = { latitude: 48.54193, longitude: -122.83040 };

export function sunAtLocalHour(hour, today = new Date()) {
  const instant = new Date(today);
  // Set wall-clock fields, rather than adding elapsed hours from midnight:
  // the visitor's local day can contain a daylight-saving transition.
  instant.setHours(0, 0, 0, 0);
  instant.setSeconds(Math.round(hour * 3600));
  return SunCalc.getPosition(instant, coast.latitude, coast.longitude);
}

import cliReap from 'cli-reap';
import {
  ENV,
  GLOBAL_THIS,
} from 'globables';

export const ESC   = '\x1B';
export const RESET = '\x1B[0m';

export const ANSI = {
  black: 30,
  iblack: 90,
  red: 31,
  ired: 91,
  green: 32,
  igreen: 92,
  yellow: 33,
  iyellow: 93,
  blue: 34,
  iblue: 94,
  purple: 35,
  ipurple: 95,
  cyan: 36,
  icyan: 96,
  white: 37,
  iwhite: 97,
};
export const XTERM = Object.fromEntries(
  Array(256).fill(0).map((_v, i) => [`x${i}`, i] as [string, number]),
);
export const COLORS = {...ANSI, ...XTERM};


/**
 * color support level
 * @default 3
 * @see {@link https://nodejs.org/api/cli.html#force_color1-2-3|Node.js FORCE_COLOR docs}
 */
type ColorSpace = 0 | 1;


/**
 * COLOR_SPACE - covers all reasonable and most un-reasonable cases
 * @implements nodejs.org/api/cli.html#force_color1-2-3
 *             0=no-color, 1=16, 2=256, 3=true-color
 */
export const COLOR_SPACE: ColorSpace = /* @__PURE__ */ (() => {
  try {
    const reap = cliReap();
    const forceColor = reap.any('FORCE_COLOR');
    // force colors
    if (forceColor === '' || (forceColor && !isNaN(Number(forceColor)) && Number(forceColor) > 0)) {
      return 1;
    }
    // no proc
    if (typeof process === 'undefined') { return 0; }

    // no color var
    if (reap.any('NO_COLOR') !== null
      || reap.any('NODE_DISABLE_COLORS') !== null
      || (/-mono|dumb/i).test(ENV['TERM'] ?? '')) { return 0; }

    // no tty
    if (!(!!process.stdout?.isTTY
      || (!!ENV['PM2_HOME'] && !!ENV['pm_id'])
      || ((GLOBAL_THIS as never)?.['Deno']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (GLOBAL_THIS as any)?.['Deno']?.isatty(1)
        : !!process.stdout?.isTTY))) { return 0; }

    // cli
    if ((/^(false|never|no|0)$/i).test(`${reap.opt('color') ?? ''}`.trim())) {
      return 0;
    }
    return 1;
  } catch (_err) { /* ignore */ }
  // catch/error/fallthrough; plays it safe with no colors
  return 0;
})();


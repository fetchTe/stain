import {
  COLOR_ALL,
  COLOR_DEF,
  COLOR_SPACE,
  ESC,
  RESET,
  XTERM_DEF,
} from './constants.ts';

type EmptyObject = Record<never, never>;
type StrNum = string | number;

// fg=foreground
// bg=background
// ft=font
// ue=underline
// ie=inverse
// re=reset
// pr=previous (internal state)
type StyleKeys = 'fg' | 'bg' | 'ft' | 'ue' | 'ie' | 're' | 'pr';
type AnsiCodeTuple = [on: number, off: number, isCustom?: number];
type StyleState = Partial<Record<StyleKeys, AnsiCodeTuple>>;
type StainBase = 'black' | 'blue' | 'cyan' | 'green' | 'purple' | 'red' | 'white' | 'yellow';
export type StainAnsi = StainBase | `i${StainBase}`;

// generate xterms: x0 to x255
type XtermKeysFactory<N extends number, Acc extends string[] = []> =
  Acc['length'] extends N
    ? Acc[number]
    : XtermKeysFactory<N, [...Acc, `x${Acc['length']}`]>;
export type StainXterm = XtermKeysFactory<256>;

export type Stain<
  C extends Record<string, number> = EmptyObject,
  X extends boolean = false,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((...args: any[])=> string) &
  {
    bg: Stain<C, X>;
    bold: Stain<C, X>;
    dim: Stain<C, X>;
    normal: Stain<C, X>;
    reset: Stain<C, X>;
    underline: Stain<C, X>;
    inverse: Stain<C, X>;
  } &
  // built-in named colors
  { [K in StainAnsi]: Stain<C, X> } &
  // xterm colors if enabled
  (X extends true ? { [K in StainXterm]: Stain<C, X> } : EmptyObject) &
  // custom colors from opts.colors
  (keyof C extends never ? EmptyObject : { [K in keyof C]: Stain<C, X> });

export type StainOpts<C extends Record<string, number> = EmptyObject> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (...args: any[])=> string;
  noColor?: boolean;
  xterm?: boolean;
  colors?: C;
  simpleEscape?: boolean;
};


/**
 * ansi escape-er
 * @note -> without handlin/escapin nesting it simplifies to: `\x1b[${open}m${str}\x1b[${close}m`
 * @param  {string} str
 * @param  {StrNum} open
 * @param  {StrNum} close
 * @param  {StrNum} fontReplace
 * @return {[type]}
 */
const escStain = (str: string, open: StrNum, close: StrNum, fontReplace?: StrNum) => {
  str = typeof str !== 'string' ? String(str) : str; // just in case
  const openStr = ESC + `[${open}m`;
  const closeStr = ESC + `[${close}m`;
  const closeLen = closeStr.length;
  const parts: string[] = [];
  let cursor = 0;
  let seqCount = 0; // count of close sequences for alternating styles
  let resetCount = 0;
  while (true) {
    const idxClose = str.indexOf(closeStr, cursor);
    // next global reset unless it is the reset style
    const idxReset = open === 0 ? -1 : str.indexOf(RESET, cursor);
    let idx = -1;
    let isReset = false;
    // which comes first, cur close sequence or a global reset
    if (idxClose >= 0) {
      if (idxReset >= 0 && idxReset < idxClose) {
        idx = idxReset;
        isReset = true;
      } else {
        idx = idxClose;
      }
    } else if (idxReset >= 0) {
      idx = idxReset;
      isReset = true;
    } else {
      break;
    }
    parts.push(str.substring(cursor, idx));

    if (isReset) {
      parts.push(RESET);
      resetCount++;
      // after every second reset restore style
      // e.g: stain.red(`text ${stain.reset('reset')} text`)
      if (resetCount % 2 === 0) { parts.push(openStr); }
      cursor = idx + RESET.length;
      continue;
    }

    // a closing sequence; need to determine the correct replacement
    const segment = str.substring(cursor, idx);
    const openInSeg = segment.split(openStr).length;
    const closeInSeg = segment.split(closeStr).length;

    let rep = openStr;
    // this roundabout logic is for font styles nesting
    // e.g: stain.bold(`bold ${stain.normal('norm')} bold`)
    if (fontReplace !== undefined && openInSeg <= closeInSeg) {
      // use seqCount to treat the first closeStr as an 'opener' and the second as the 'closer'
      seqCount++;
      const on = ESC + `[${fontReplace}m`; // outer style's open code
      const off = ESC + `[${close}m`; // inner style's open/close code
      rep = (seqCount % 2 === 1) ? on + off : off + on;
    }

    parts.push(rep);
    cursor = idx + closeLen;
  }
  parts.push(str.substring(cursor));
  return openStr + parts.join('') + closeStr;
};

/**
 * simple escape that doesn't handle nested ansi; 1.5-4x+ faster depending on style complexity
 * nested example: stain.red.bold('Bold ' + stain.green.normal('normal') + ' Bold')
 * @param  {string} str
 * @param  {StrNum} open
 * @param  {StrNum} close
 * @param  {StrNum} _fontReplace
 * @return {[type]}
 */
const escStainSimple = (str: string, open: StrNum, close: StrNum, _fontReplace?: StrNum) =>
  `${ESC}[${open}m` + (typeof str !== 'string' ? String(str) : str) + `${ESC}[${close}m`;


/**
 * a nice node typed color api, that isn't "slow" at
 * @perf ~6million iter/s - NO_COLOR=~186million iter/s
 */
function createStain<C extends Record<string, number> = EmptyObject>(
  opts?: StainOpts<C> & { xterm?: false }
): Stain<C, false>;
function createStain<C extends Record<string, number> = EmptyObject>(
  opts: StainOpts<C> & { xterm: true }
): Stain<C, true>;
function createStain<C extends Record<string, number> = EmptyObject>(
  opts: StainOpts<C> = {},
): Stain<C, boolean> {
  const {
    colors,
    xterm,
    format = (...args) => args.length > 1
      ? args.join(' ')
      : typeof args[0] !== 'string' ? JSON.stringify(args[0]) : args[0],
    noColor = COLOR_SPACE === 0,
    simpleEscape = false,
  } = opts;

  const colorAll: Record<string, number> = colors
    ? {...(xterm ? COLOR_ALL : COLOR_DEF), ...colors}
    : (xterm ? COLOR_ALL : COLOR_DEF);

  // provies the same api, but doesn't add color, and much, much, much, faster
  if (noColor) {
    // wrapped to avoid poluting the proto on passed in format
    const ncFormat = opts?.format ? (...args: unknown[]) => format(...args) : format;
    for (const prop of Object.keys(colorAll)
      .concat(['bg', 'bold', 'dim', 'normal', 'reset', 'underline'])) {
      // @ts-expect-error not typable
      ncFormat[prop] = ncFormat;
    }
    return ncFormat as Stain<C, boolean>;
  }
  const escFn = simpleEscape ? escStainSimple : escStain;
  // xterm look-up map to determin if xterm
  // @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit}
  const color256: Record<string, number> = colors
    ? (xterm ? {...XTERM_DEF, ...colors} : colors)
    : (xterm ? XTERM_DEF : {});

  // our main stain
  const colorProxy = (cur: StyleState = {}) =>
    new Proxy((text: string) => text, {
      get: (_target, prop: string) => {
        const nxt = {...cur};
        const fg = nxt.fg;
        if (colorAll[prop] !== undefined) { // xterm logic
          // keeps track of previous for bg logic
          nxt.pr = [
            fg?.[0] ?? colorAll[prop],
            39,
            fg?.[2] ?? (color256[prop] !== undefined ? 1 : 0),
          ];
          nxt.fg = [colorAll[prop], 39, color256[prop] !== undefined ? 1 : 0];
        } else if (prop === 'bg' && fg) { // bg/fg logic
          nxt.bg = [fg[0] + (fg[2] || fg[1] === 49 ? 0 : 10), 49, fg[2]] as AnsiCodeTuple;
          // @ts-expect-error to make this type easier we ignore undefined
          if (nxt.pr?.[1] === 39) { nxt.fg = fg[0] === nxt.pr[0] ? undefined : [...nxt.pr]; }
        } else { // font style logic
          const fo = prop === 'bold' ? 1 : prop === 'dim' ? 2 : prop === 'normal' ? 22 : null;
          if (fo) {
            nxt.ft = [fo, 22, 0];
          } else if (prop === 'underline') {
            nxt.ue = [4, 24, 0];
          } else if (prop === 'inverse') {
            nxt.ie = [7, 27, 0];
          } else if (prop === 'reset') {
            nxt.re = [0, 0, 0];
          }
        }
        return colorProxy(nxt);
      },
      apply: (_target, _thisArg, args: string[]) => {
        let res = format(...args);
        // a loop here will dec perf by 6x
        if (cur.re) { return escFn(res, 0, 0); }
        if (cur.fg) { res = escFn(res, (cur.fg[2] ? '38;5;' : '') + cur.fg[0], cur.fg[1]); }
        if (cur.bg) { res = escFn(res, (cur.bg[2] ? '48;5;' : '') + cur.bg[0], cur.bg[1]); }
        if (cur.ft) { res = escFn(res, cur.ft[0], cur.ft[1], cur.ft[0]); }
        if (cur.ue) { res = escFn(res, cur.ue[0], cur.ue[1]); }
        if (cur.ie) { res = escFn(res, cur.ie[0], cur.ie[1]); }
        return res;
      },
    });
  return colorProxy() as Stain<C, boolean>;
}

const stain = /* @__PURE__ */ (() => createStain({ xterm: true }))();

export default stain;
export {
  stain,
  createStain,
};

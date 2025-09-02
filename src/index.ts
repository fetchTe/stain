
type EmptyObject = Record<never, never>;
type StrNum = string | number;


/**
 * color support level with cache control (negative=disable caching)
 * @NOTE negatives == positive, but a neg disables caching to force a plugin to always re-run
 * @nsole param:5
 * @default 3
 * @see {@link https://nodejs.org/api/cli.html#force_color1-2-3|Node.js FORCE_COLOR docs}
 */
export type ColorSpace = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3;

const ESC = '\x1B';
const RESET = ESC + '[0m';

// polly - just  in case
const GLOBAL_THIS = typeof globalThis !== 'undefined' ? globalThis : {} as typeof globalThis;

/**
 * env variables (pure/iffe wrapped so we can shake the tree)
 * @see {@link https://nodejs.org/api/process.html#processenv|Node.js env docs}
 */
const PROC_ENV = /* @__PURE__ */ (() => typeof process === 'undefined'
  ? {}
  /** deno {@link https://docs.deno.com/runtime/reference/env_variables/#built-in-deno.env} */
  : (!(GLOBAL_THIS as never)?.['Deno']
      ? process['env']
      // deno requires permission to access env: --allow-env
      : (() => {
          try {
            // if --allow-all is used, no toObject (like --allow-env), use default
            // @ts-expect-error deno perms
            return process['env']?.toObject ? process['env']?.toObject() : process['env'];
          } catch (_err) { /* ignore */ }
          return {};
        })())
)();


/**
 * command-line arguments (pure/iffe wrapped so we can shake the tree)
 * @see {@link https://nodejs.org/api/process.html#processargv|Node.js process.argv docs}
 */
const ARGV: string[] = /* @__PURE__ */ (() =>
  typeof process === 'undefined'
    /** quickJs {@link https://bellard.org/quickjs/quickjs.html#Global-objects} */
    ? typeof scriptArgs !== 'undefined'
      ? scriptArgs
      : []
    : ((GLOBAL_THIS as never)?.['Deno']
        // if --allow-all is used, no args (like --allow-env), use default
        // @ts-expect-error deno uses 'args' rather than 'argv'
        ? (process['args']?.length ? process['args'] : process['argv'])
        : process['argv']
      ) ?? []
)();


/**
 * checks for presence of key (flags) in argv
 * @example --example -flag
 * @param  {string | string[]} keys - argv key/id (--key, -key)
 * @param  {string[]} [argv=ARGV]   - command-line argv
 * @return {boolean}
 */
const hasArgvFlags = (keys: string | string[], argv = ARGV): boolean => !argv?.length
  ? false
  : !!([keys].flat().find(key =>
      (new RegExp(`(^|[^\\S])(?:--|-)${key}(=|\\s|$)`, 'i')).test(argv.join(' '))));


/**
 * gets any* reasonable argv option value by key (returns null for flags, must have value)
 * @example --key=value --key="value" --key="val ue" --key "val ue" (-- | - | "" | '')
 * @note   un-reasonable values: non-escaped multi-lines; malformed keys; mismatching quotes
 * @param  {string} key           - argv key/id (--key, -key)
 * @param  {string[]} [argv=ARGV] - command-line argv
 * @return {null | string}
 */
const getArgvOption = (key: string, argv = ARGV) => !argv?.length
  ? null
  : ` ${argv.join(' ')} `.match(
    // eslint-disable-next-line @stylistic/max-len
    new RegExp(`(^|[\\s])(?:--|-)${key}(?:=|\\s+)(['"]?)([^-\\s][^'"-\\s]*?|(?:\\D?[^-].*?))\\2(?:\\s|$)`, 'i'),
    // normalize empty single double quotes pairs:  --key="" | --key=''
  )?.[3]?.replace(/^(''|"")$/, '') ?? null;


/**
 * snags an argv by key/id including flags (a flag value is '', null-check-it)
 * @example
 *   --nsole-lvl=0 --nsole_lvl=0 -nsole-lvl=0 -nsole_lvl=0
 *   --nsole-lvl 0 --nsole_lvl 0 -nsole-lvl 0 -nsole_lvl 0
 *   --NSOLE-LVL=0 --NSOLE_LVL=0 -NSOLE-LVL=0 -NSOLE_LVL=0
 *   --NSOLE-LVL 0 --NSOLE_LVL 0 -NSOLE-LVL 0 -NSOLE_LVL 0
 * @param  {string} key         - argv key/id (--key=value)
 * @param  {string[]} [argv=ARGV]
 * @return {null | string | ''}
 */
const getArgv = (key: string, argv = ARGV): null | string | '' => !argv?.length
  ? null
  : hasArgvFlags(key, argv)
    ? (getArgvOption(key, argv) ?? '')
    // @meh, fix for when (i) use hyphens in argvs; NSOLE_LVL -> NSOLE-LVL
    : hasArgvFlags(key.replaceAll('_', '-'), argv)
      ? (getArgvOption(key.replaceAll('_', '-'), argv) ?? '')
      : null;

/**
 * gets env var key/value pairs; priority: argv > env > globalThis > null
 * @param  {string} key                  - key (argv not case sensitive, procEnv/globalThis is)
 * @param  {string[]} [argv=ARGV]        - process['argv']
 * @param  {NodeJS.ProcessEnv} [procEnv=PROC_ENV] - process['env']
 * @param  {globalThis} [gthis=globalThis] - globalThis
 */
const getEnvVar = (key: string, argv = ARGV, procEnv = PROC_ENV, gthis = GLOBAL_THIS as never) =>
  getArgv(key, argv)
    ?? ((key in procEnv)
      ? procEnv[key]
      : (key in gthis)
          ? gthis[key]
          : null) ?? null;

/**
 * COLOR_SPACE - covers all reasonable and most un-reasonable cases
 * @implements nodejs.org/api/cli.html#force_color1-2-3
 *             0=no-color, 1=16, 2=256, 3=true-color
 */
const COLOR_SPACE: ColorSpace = /* @__PURE__ */ (() => {
  try {
    const forceColor = getEnvVar('FORCE_COLOR');
    // force colors
    if (forceColor === '' || (forceColor && !isNaN(Number(forceColor)) && Number(forceColor) > 0)) {
      return 1;
    }
    // no proc
    if (typeof process === 'undefined') { return 0; }
    // no color var
    if (getEnvVar('NO_COLOR') !== null
      || getEnvVar('NODE_DISABLE_COLORS') !== null
      || (/-mono|dumb/i).test(PROC_ENV['TERM'] ?? '')) { return 0; }
    // no tty
    if (!(!!process.stdout?.isTTY
      || (!!PROC_ENV.PM2_HOME && !!PROC_ENV.pm_id)
      || ((GLOBAL_THIS as never)?.['Deno']
        ? (GLOBAL_THIS as any)?.['Deno']?.isatty(1)
        : !!process.stdout?.isTTY))) { return 0; }
    // cli
    if ((/^(false|never|no|0)$/i).test(`${getArgvOption('color') ?? ''}`.trim())) {
      return 0;
    }
    return 1;
  } catch (_err) { /* ignore */ }
  // catch/error/fallthrough; plays it safe with no colors
  return 0;
})();


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
type StainBaseColors = 'black' | 'blue' | 'cyan' | 'green' | 'purple' | 'red' | 'white' | 'yellow';
export type StainColors = StainBaseColors | `i${StainBaseColors}`;
// Generate XtermKeys from x0 to x255
type GenerateXtermKeys<N extends number, Acc extends string[] = []> =
  Acc['length'] extends N
    ? Acc[number]
    : GenerateXtermKeys<N, [...Acc, `x${Acc['length']}`]>;
type XtermKeys = GenerateXtermKeys<256>;
type CustomAnsiStainer<
  C extends Record<string, number> = EmptyObject,
  X extends boolean = false,
> =
  ((...args: any[])=> string) &
  {
    bg: CustomAnsiStainer<C, X>;
    bold: CustomAnsiStainer<C, X>;
    dim: CustomAnsiStainer<C, X>;
    normal: CustomAnsiStainer<C, X>;
    reset: CustomAnsiStainer<C, X>;
    underline: CustomAnsiStainer<C, X>;
    inverse: CustomAnsiStainer<C, X>;
  } &
  // built-in named colors
  { [K in StainColors]: CustomAnsiStainer<C, X> } &
  // xterm colors if enabled
  (X extends true ? { [K in XtermKeys]: CustomAnsiStainer<C, X> } : EmptyObject) &
  // custom colors from opts.colors
  (keyof C extends never ? EmptyObject : { [K in keyof C]: CustomAnsiStainer<C, X> });


type StainOpts<C extends Record<string, number> = EmptyObject> = {
  format?: (...args: unknown[])=> string;
  noColor?: boolean;
  xterm?: boolean;
  colors?: C;
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
      // after every second reset restore style - handles: stain.red(`text ${stain.reset('reset')} text`)
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
 * a nice node typed color api, that isn't "slow" at
 * @perf ~6million iter/s - NO_COLOR=~186million iter/s
 */
function createStain<C extends Record<string, number> = EmptyObject>(
  opts?: StainOpts<C> & { xterm?: false }
): CustomAnsiStainer<C, false>;
function createStain<C extends Record<string, number> = EmptyObject>(
  opts: StainOpts<C> & { xterm: true }
): CustomAnsiStainer<C, true>;
function createStain<C extends Record<string, number> = EmptyObject>(
  opts: StainOpts<C> = {},
): CustomAnsiStainer<C, boolean> {
  const {
    colors,
    xterm,
    format = (...args) => args.length > 1
      ? args.join(' ')
      : typeof args[0] !== 'string' ? JSON.stringify(args[0]) : args[0],
    noColor = COLOR_SPACE === 0,
  } = opts;
  const colorsAll: Record<string, number> = {};
  const colorsDef: null | number[] = colors || xterm ? [] : null;
  for (const [k, v] of Object.entries({
    black: 30, red: 31, green: 32, yellow: 33, blue: 34, purple: 35, cyan: 36, white: 37,
  })) {
    colorsAll[k] = v;
    colorsAll[`i${k}`] = v + 60;
    // add default colors
    colorsDef && [v, v + 60].forEach(i => {
      colorsDef.push(i);
      colorsDef.push(i + 10); // intense
    });
  }
  // tracks 8-bit palette for escaping, not elegant, but works, todo replace with maths
  const eBitColor: Record<string, number> = {};
  const customColor = ([k, v]: [k: string, v: number]) => {
    colorsAll[k] = v;
    eBitColor[k] = v;
  };
  // add xterm 255 colors
  xterm && Array(256).fill(0).map((_v, i) => [`x${i}`, i] as [string, number])
    .forEach(customColor);
  // add custom defined colors
  colors && Object.entries(colors).forEach(customColor);

  // provies the same api, but doesn't add color, and much, much, much, faster
  if (noColor) {
    // avoids poluting proto on passed in utils.format
    const plain = opts?.format ? (...args: unknown[]) => format(...args) : format;
    const chain = Object.keys(colorsAll).concat(['bg', 'bold', 'dim', 'normal', 'reset', 'underline']);
    // @ts-expect-error not typable
    for (const prop of chain) { plain[prop] = plain; }
    return plain as CustomAnsiStainer<C, boolean>;
  }

  // our main stain
  const colorProxy = (cur: StyleState = {}) =>
    new Proxy((text: string) => text, {
      get: (_target, prop: string) => {
        const nxt = {...cur};
        const fg = nxt.fg;
        if (colorsAll[prop] !== undefined) { // xterm logic -----------------------
          // need to keep previous for bg logic
          nxt.pr = [
            fg?.[0] ?? colorsAll[prop],
            39,
            fg?.[2] ?? (eBitColor[prop] !== undefined ? 1 : 0),
          ];
          nxt.fg = [colorsAll[prop], 39, eBitColor[prop] !== undefined ? 1 : 0];
        } else if (prop === 'bg' && fg) { // bg logic --------------------------
          nxt.bg = [fg[0] + (fg[2] || fg[1] === 49 ? 0 : 10), 49, fg[2]] as AnsiCodeTuple;
          // @ts-expect-error to make this type easier we ignore undefined
          if (nxt.pr?.[1] === 39) { nxt.fg = fg[0] === nxt.pr[0] ? undefined : [...nxt.pr]; }
        } else { // font style logic -------------------------------------------
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
        if (cur.re) { return escStain(res, 0, 0); }
        if (cur.fg) { res = escStain(res, (cur.fg[2] ? '38;5;' : '') + cur.fg[0], cur.fg[1]); }
        if (cur.bg) { res = escStain(res, (cur.bg[2] ? '48;5;' : '') + cur.bg[0], cur.bg[1]); }
        if (cur.ft) { res = escStain(res, cur.ft[0], cur.ft[1], cur.ft[0]); }
        if (cur.ue) { res = escStain(res, cur.ue[0], cur.ue[1]); }
        if (cur.ie) { res = escStain(res, cur.ie[0], cur.ie[1]); }
        return res;
      },
    });
  return colorProxy() as CustomAnsiStainer<C, boolean>;
}

const stain = createStain({ xterm: true });

export default stain
export {
  createStain,
};


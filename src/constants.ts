/**
 * color support level with cache control (negative=disable caching)
 * @NOTE negatives == positive, but a neg disables caching to force a plugin to always re-run
 * @nsole param:5
 * @default 3
 * @see {@link https://nodejs.org/api/cli.html#force_color1-2-3|Node.js FORCE_COLOR docs}
 */
export type ColorSpace = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3;

export const ESC   = '\x1B';
export const RESET = '\x1B[0m';


// pollyfill - just  in case
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
export const COLOR_SPACE: ColorSpace = /* @__PURE__ */ (() => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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


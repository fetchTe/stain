<h1>
Stain - ANSI Styling
<a href="https://mibecode.com">
  <img align="right" title="&#8805;95% Human Code" alt="&#8805;95% Human Code" src="https://mibecode.com/badge.svg" />
</a>
<img align="right" alt="empty space" src="https://mibecode.com/4px.svg" />
<img align="right" alt="NPM Version" src="https://img.shields.io/npm/v/stain?color=white" />
</h1>


Stain the pane without the pain of remembering if it's `bgRed`, `redBg`, or ordering for that matter

+ [Dyslectic](https://en.wikipedia.org/wiki/Dyslexia) friendly with any-[fluent](https://en.wikipedia.org/wiki/Fluent_interface)-chain API: `stain.white.bold.cyan.bg('No More Tears')`
+ Supports: [4-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit) (16 colors), [8-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit) (256 colors), **`bold`**, `dim`, <ins>`underline`</ins>, `inverse`, and [`NO_COLOR`](https://no-color.org)
+ Nest-able: `stain.red.bold('bold' + stain.normal.blue(' normal ') + 'bold')`
+ Fast-ish: ~180,000,000/sec (`NO_COLOR`), ~6,500,000/sec (`simpleEscape`), ~5,000,000/sec (default)
+ [TypeScript](https://www.typescriptlang.org)'ed with zero dependencies

<br />

### ▎USAGE


<img width="auto" height="672" alt="usage" src="https://raw.githubusercontent.com/fetchTe/stain/master/docs/usage.png" />


<blockquote >
<details>
<summary><b>Code</b></summary>

```ts
import stain, { createStain } from 'stain';

// chain it & stain it
console.log(stain.cyan('cyan fg'));
console.log(stain.iblue('intense blue fg'));
console.log(stain.bold.ired('bold intense red fg'));

// apply a background color simply by adding '.bg' property after the color
console.log(stain.icyan.bg.black('intense cyan bg with black fg'));
// order of operations makes no difference
console.log(stain.black.icyan.bg('intense cyan bg with black fg'));
// last prop/chain always wins
console.log(stain.blue.bg.red.black.icyan.bg('intense cyan bg with black fg'));

// chain anything & everything till to your heart's content
console.log(stain.blue.black.bg.yellow.underline('yellow fg with black bg and underlined'));
console.log(stain.blue.black.bg.yellow.underline.inverse('yellow bg with black fg and underlined'));
console.log(stain.even.this.works.yellow.bold('bold yellow fg'));

// nesting works
console.log(stain.purple.bold('bold-purple ' + stain.cyan.normal('normal-cyan') + ' bold-purple'));

// xterm/256-color 'stain.x<number>' notation
console.log(stain.x123('a lovely cornflower blue'));

// create your own xterm/256-color palette with easy pasy to remember names
const customStain = createStain({
  xterm: true,
  colors: {
    warn: 226, // yellow
    error: 196, // red
  },
});

console.log(customStain.warn('yellow/xterm=226 fg'));
console.log(customStain.error('red/xterm=196 fg'));
console.log(customStain.warn.error.bg('yellow/xterm=226 fg with red/xterm=196 bg'));
console.log(customStain.warn.bg.error('red/xterm=196 fg with yellow/xterm=226 bg'));
```

</details>
</blockquote>

<!-- 

<blockquote >
<details>
<summary><b>Colorized Output/Image</b></summary>
<img alt="quickstart-Screenshot_20250718_123526" src="https://github.com/user-attachments/assets/80efe964-9ed9-4b3a-80b4-5a749b396a8e" />
</details>
</blockquote>
 -->


### ▎INSTALL

```sh
# pick your poison
npm install stain
bun add stain
pnpm add stain
yarn add stain
```

<br />

## API


### ▎ `stain(?<options>)`

```ts
import stain from 'stain';

console.log(stain.cyan('The Main Stain'));
```
> Pre-initialized with `xterm` enabled


<br />

### ▎ `createStain(?<options>)`

```ts
import { createStain } from 'stain';

const myStain = createStain({
  noColor: !!process.env['CI'],
  xterm: true,
  colors: {
    peach: 216,
    navy: 18,
  },
  format: (...args) => args.join(' | '),
});

process.stdout.write(`
${myStain.x216('peach fg')}
${myStain.peach('peach fg')}
${myStain.x18.bg('navy bg')}
${myStain.navy.bg('navy bg')}
`);
// styled format output: 'multiple | args | format'
process.stdout.write(myStain.green('multiple', 'args', 'format'));
```

<br />


### ▎ OPTIONS

```ts
type StainOptions = {
  /**
   * Custom color mapping to 8-bit/256-color codes (0-255) (e.g: {error: 196})
   * @default undefined
   */
  colors?: Record<string, number>;
  /**
   * Custom format function
   * @default simplified `util.format` with with `JSON.stringify` fallback
   * @see {@link https://nodejs.org/api/util.html#utilformatformat-args}
   */
  format?: (...args: any[]) => string;
  /**
   * Disable ANSI color/styling (~50-250x faster)
   * @default false (unless the `NO_COLOR` environment/CLI variable is set)
   */
  noColor?: boolean;
  /**
   * Use a simpler ANSI escape function without nesting support (~1.5-4x faster)
   * @default false
   */
  simpleEscape?: boolean;
  /**
   * Enable 8-bit/256-color support via `x<number>` notation
   * @default false (for `createStain`)
   * @default true  (for default `stain` export)
   * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit}
   */
  xterm?: boolean;
};
```

<br />

### ▎ FLUENT METHODS

|                | Options                  |
|----------------------------|:--------------------------------|
| <stamp>**Background**</stamp>            | append `.bg` to any foreground (e.g: `stain.white.bg`, `stain.iblue.bg`) |
| <stamp>**[4-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit) Color**</stamp>                  | ` black`, ` red`, ` green`, ` yellow`, ` blue`, ` purple`, ` cyan`, ` white` |
| <stamp>**[4-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit) Color Intense**</stamp>          | `iblack`, `ired`, `igreen`, `iyellow`, `iblue`, `ipurple`, `icyan`, `iwhite` |
| <stamp>**[8-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit) Color**</stamp>           | `x0` through `x255` (e.g: `stain.x122`, `stain.x50`, `stain.x150.bg`)             |
| <stamp>**Font**</stamp>            | `bold`, `dim`, `normal`, `underline` |
| <stamp>**Other**</stamp>           | `inverse`, `reset` |


<blockquote >
<details>
<summary><b>8-bit Color Grid</b></summary>
  <img alt="8bit-256-xterm" src="https://raw.githubusercontent.com/fetchTe/stain/master/docs/8bit-256-xterm.png" />
</details>
</blockquote>


<br />

#### ▎ EXAMPLES
```ts
// bold - makes text bold
console.log(' ' + stain.bold('stain.bold'));
// dim - makes text dim
console.log(' ' + stain.dim('stain.dim'));
console.log(' ' + stain.dim.white('stain.dim.white (tends to work better than gray)'));
// underline - underlines text
console.log(' ' + stain.red.underline('stain.red.underline'));
// inverse - inverts the foreground and background colors
console.log(' ' + stain.red.black.bg('stain.red.black.bg'));
console.log(' ' + stain.red.black.bg.inverse('stain.red.black.bg.inverse'));
// normal - resets bold and dim styles
console.log(' ' + stain.cyan.bold(`stain.cyan.bold ${stain.normal(' stain.normal ')} stain.cyan.bold`));
console.log(' ' + stain.cyan.dim(`stain.cyan.dim  ${stain.normal(' stain.normal ')} stain.cyan.dim`));
// reset - resets all active styles, returning to the terminal default
console.log(' ' + stain.underline.yellow.bold(`stain.underline.yellow.bold${stain.reset(' reset ')}stain.underline.yellow.bold`));
```
> <img alt="examples" src="https://raw.githubusercontent.com/fetchTe/stain/master/docs/examples.png" /> <br />

<br />

#### ▎ ALL FONT STYLES

<img alt="all-font-color-styles" src="https://raw.githubusercontent.com/fetchTe/stain/master/docs/all-font-color-styles.png" />

<!-- 

#### ▎ ALL ANSI STAINS
 -->



<br />

## Development/Contributing
> Required build dependencies: [Bun](https://bun.sh) and [Make](https://www.gnu.org/software/make/manual/make.html) <br />


### ▎PULL REQUEST STEPS

1. Clone repository
2. Create and switch to a new branch for your work
3. Make and commit changes
4. Run `make release` to clean, setup, build, lint, and test
5. If everything checks out, push branch to repository and submit pull request
<br />

### ▎MAKEFILE REFERENCE

```
# USAGE
   make [flags...] <target>

# TARGET
  -------------------
   run                   executes entry-point (./src/index.ts) via 'bun run'
   release               clean, setup, build, lint, test, aok (everything but the kitchen sink)
  -------------------
   build                 builds the .{js,d.ts} (skips: lint, test, and .min.* build)
   build_cjs             builds the .cjs export
   build_esm             builds the .js (esm) export
   build_declarations    builds typescript .d.{ts,mts,cts} declarations
  -------------------
   install               installs dependencies via bun
   update                updates dependencies
   update_dry            lists dependencies that would be updated via 'make update'
  -------------------
   lint                  lints via tsc & eslint
   lint_eslint           lints via eslint
   lint_eslint_fix       lints and auto-fixes via eslint --fix
   lint_tsc              lints via tsc
   lint_watch            lints via eslint & tsc with fs.watch to continuously lint on change
  -------------------
   test                  runs bun test(s)
   test_watch            runs bun test(s) in watch mode
   test_update           runs bun test --update-snapshots
  -------------------
   help                  displays (this) help screen

# FLAGS
  -------------------
   BUN                   [? ] bun build flag(s) (e.g: make BUN="--banner='// bake until golden brown'")
  -------------------
   CJS                   [?1] builds the cjs (common js) target on 'make release'
   EXE                   [?js|mjs] default esm build extension
   TAR                   [?0] build target env (-1=bun, 0=node, 1=dom, 2=dom+iife, 3=dom+iife+userscript)
   MIN                   [?1] builds minified (*.min.{mjs,cjs,js}) targets on 'make release'
  -------------------
   BAIL                  [?1] fail fast (bail) on the first test or lint error
   ENV                   [?DEV|PROD|TEST] sets the 'ENV' & 'IS_*' static build variables (else auto-set)
   TEST                  [?0] sets the 'IS_TEST' static build variable (always 1 if test target)
   WATCH                 [?0] sets the '--watch' flag for bun/tsc (e.g: WATCH=1 make test)
  -------------------
   DEBUG                 [?0] enables verbose logging and sets the 'IS_DEBUG' static build variable
   QUIET                 [?0] disables pretty-printed/log target (INIT/DONE) info
   NO_COLOR              [?0] disables color logging/ANSI codes
```

<br />



## License

```
MIT License

Copyright (c) 2025 te <legal@fetchTe.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

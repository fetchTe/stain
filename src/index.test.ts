/* eslint-disable @stylistic/max-len */
import * as util from 'node:util';
import {
  expect,
  test,
  describe,
} from 'bun:test';
import {
  createStain,
} from './index.ts';

const LOG = true;

const esc = (code: string | number) => `\x1b[${code}m`;
const ANSI = {
  // styles
  bold: [esc(1), esc(22)],
  dim: [esc(2), esc(22)],
  underline: [esc(4), esc(24)],
  inverse: [esc(7), esc(27)],
  reset: [esc(0), esc(0)],

  // fg
  black: [esc(30), esc(39)],
  red: [esc(31), esc(39)],
  green: [esc(32), esc(39)],
  yellow: [esc(33), esc(39)],
  blue: [esc(34), esc(39)],
  purple: [esc(35), esc(39)],
  cyan: [esc(36), esc(39)],
  white: [esc(37), esc(39)],

  // fg intense
  iblack: [esc(90), esc(39)], // grey
  ired: [esc(91), esc(39)],
  igreen: [esc(92), esc(39)],
  iyellow: [esc(93), esc(39)],
  iblue: [esc(94), esc(39)],
  ipurple: [esc(95), esc(39)],
  icyan: [esc(96), esc(39)],
  iwhite: [esc(97), esc(39)],

  // fb
  bgBlack: [esc(40), esc(49)],
  bgRed: [esc(41), esc(49)],
  bgGreen: [esc(42), esc(49)],
  bgYellow: [esc(43), esc(49)],
  bgBlue: [esc(44), esc(49)],
  bgPurple: [esc(45), esc(49)],
  bgCyan: [esc(46), esc(49)],
  bgWhite: [esc(47), esc(49)],

  // bg intense
  bgiBlack: [esc(100), esc(49)],
  bgiRed: [esc(101), esc(49)],
  bgiGreen: [esc(102), esc(49)],
  bgiYellow: [esc(103), esc(49)],
  bgiBlue: [esc(104), esc(49)],
  bgiPurple: [esc(105), esc(49)],
  bgiCyan: [esc(106), esc(49)],
  bgiWhite: [esc(107), esc(49)],

  // 8-bit / xterm colors
  xterm: (n: number) => [esc(`38;5;${n}`), esc(39)],
  bgXterm: (n: number) => [esc(`48;5;${n}`), esc(49)],
};

describe('createStain', () => {

  describe('Initialization and Options', () => {
    test('should create a "noColor" instance when noColor: true', () => {
      const stain = createStain({ noColor: true });
      const r1 = stain.red.bold('hello');
      const e1 = 'hello';
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should create a color-enabled instance when noColor: false', () => {
      const stain = createStain({ noColor: false });
      const r1 = stain.red('hello');
      const e1 = `${ANSI.red[0]}hello${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should enable xterm colors when xterm: true', () => {
      const stain = createStain({ xterm: true, noColor: false });
      const r1 = stain.x123('hello');
      const e1 = `${ANSI.xterm(123)[0]}hello${ANSI.xterm(123)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should enable custom colors from the "colors" option', () => {
      const stain = createStain({
        noColor: false,
        colors: {
          hotpink: 205,
        },
      });
      const r1 = stain.hotpink('hello');
      const e1 = `${ANSI.xterm(205)[0]}hello${ANSI.xterm(205)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should work with node util.format', () => {
      const stainFmt = createStain({
        noColor: false,
        format: util.format,
      });
      const stain = createStain({noColor: false});
      const r1 = stainFmt.green('greenFmt');
      const e1 = stain.green('greenFmt');
      const r2 = stainFmt.green(1, 2, 3);
      const e2 = stain.green(1, 2, 3);
      const r3a = stainFmt.green([1, 2, 3, {a: 1}]);
      const r3b = stain.green([1, 2, 3, {a: 1}]);
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      LOG && console.log(`  r3: ${r3a}`);
      LOG && console.log(`  r3: ${r3b}`);
      expect(r1).toMatchInlineSnapshot(`"${ANSI.green[0]}greenFmt${ANSI.green[1]}"`);
      expect(r1).toBe(e1);
      expect(r2).toMatchInlineSnapshot(`"${ANSI.green[0]}1 2 3${ANSI.green[1]}"`);
      expect(r2).toBe(e2);
      expect(r3a).not.toBe(r3b);
      expect(r3a).toMatchInlineSnapshot(`"${ANSI.green[0]}[ 1, 2, 3, { a: 1 } ]${ANSI.green[1]}"`);
      expect(r3b).toMatchInlineSnapshot(`"${ANSI.green[0]}[1,2,3,{"a":1}]${ANSI.green[1]}"`);
    });

    test('should use a custom format function', () => {
      const stain = createStain({
        noColor: false,
        format: (a, b) => `[${a}-${b}]`,
      });
      const r1 = stain.green('foo', 'bar');
      const e1 = `${ANSI.green[0]}[foo-bar]${ANSI.green[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should use default options when called without arguments', () => {
      const stain = createStain({noColor: false});
      const r1 = stain.red('hello');
      // should work with default options (color enabled unless COLOR_SPACE is 0)
      expect(typeof r1).toBe('string');
      expect(r1).toContain('hello');
    });

    test('should handle empty colors object', () => {
      const stain = createStain({
        noColor: false,
        colors: {},
      });
      const r1 = stain.red('hello');
      const e1 = `${ANSI.red[0]}hello${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('Color Application', () => {
    const stain = createStain({ noColor: false });

    test('should apply basic foreground colors', () => {
      const r1 = stain.red('red');
      const e1 = `${ANSI.red[0]}red${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.blue('blue');
      const e2 = `${ANSI.blue[0]}blue${ANSI.blue[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should apply all foreground colors', () => {
      const colors = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'] as const;
      for (const color of colors) {
        const r = stain[color]('test');
        const e = `${ANSI[color][0]}test${ANSI[color][1]}`;
        LOG && console.log(`  r: ${r}`);
        LOG && console.log(`  e: ${e}`);
        expect(r).toMatchInlineSnapshot(`"${e}"`);
      }
    });

    test('should apply all intense foreground colors', () => {
      const colors = ['iblack', 'ired', 'igreen', 'iyellow', 'iblue', 'ipurple', 'icyan', 'iwhite'] as const;
      for (const color of colors) {
        const r = stain[color]('test');
        const e = `${ANSI[color][0]}test${ANSI[color][1]}`;
        LOG && console.log(`  r: ${r}`);
        LOG && console.log(`  e: ${e}`);
        expect(r).toMatchInlineSnapshot(`"${e}"`);
      }

    });

    test('should apply basic background colors', () => {
      const r1 = stain.red.bg('red bg');
      const e1 = `${ANSI.bgRed[0]}red bg${ANSI.bgRed[1]}`;
      console.log(JSON.stringify(e1));
      console.log(JSON.stringify(stain.red.bg('red bg')));

      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });


    test('should apply intense background colors', () => {
      const r1 = stain.ired.bg('ired bg');
      const e1 = `${ANSI.bgiRed[0]}ired bg${ANSI.bgiRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });


    test('should apply all background colors', () => {
      const colors = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'] as const;
      for (const color of colors) {
        const val = `bg${color[0]?.toUpperCase() + color.slice(1)}` as 'bgBlack';
        const r = stain[color].bg('test');
        const e = `${ANSI[val][0]}test${ANSI[val][1]}`;
        LOG && console.log(`  r: ${r}`);
        LOG && console.log(`  e: ${e}`);
        expect(r).toMatchInlineSnapshot(`"${e}"`);
      }
    });

    test('should apply all intense background colors', () => {
      const colors = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'] as const;
      for (const color of colors) {
        const val = `bgi${color[0]?.toUpperCase() + color.slice(1)}` as 'bgiBlack';
        const r = stain[`i${color}`].bg('test');
        const e = `${ANSI[val][0]}test${ANSI[val][1]}`;
        LOG && console.log(`  r: ${r}`);
        LOG && console.log(`  e: ${e}`);
        expect(r).toMatchInlineSnapshot(`"${e}"`);
      }
    });


    test('should chain foreground colors, with the last one taking precedence', () => {
      const r1 = stain.red.yellow.blue('text');
      const e1 = `${ANSI.blue[0]}text${ANSI.blue[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should correctly apply background color based on preceding foreground color', () => {
      // red.bg sets a red background, then .blue sets a blue foreground
      const r1 = stain.red.bg.blue('text');
      const e1 = `${ANSI.bgRed[0]}${ANSI.blue[0]}text${ANSI.blue[1]}${ANSI.bgRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle background color without changing foreground when colors match', () => {
      // when fg and bg are the same color, fg should be cleared
      const r1 = stain.red.bg('text');
      const e1 = `${ANSI.bgRed[0]}text${ANSI.bgRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle multiple background color applications', () => {
      const r1 = stain.red.bg.green.bg('text');
      const e1 = `${ANSI.bgGreen[0]}text${ANSI.bgGreen[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('Font Styles', () => {
    const stain = createStain({ noColor: false });

    test('should apply bold style', () => {
      const r1 = stain.bold('bold text');
      const e1 = `${ANSI.bold[0]}bold text${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should apply dim style', () => {
      const r1 = stain.dim('dim text');
      const e1 = `${ANSI.dim[0]}dim text${ANSI.dim[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should apply underline style', () => {
      const r1 = stain.underline('underline text');
      const e1 = `${ANSI.underline[0]}underline text${ANSI.underline[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should apply inverse style', () => {
      const r1 = stain.inverse('inverse text');
      const e1 = `${ANSI.inverse[0]}inverse text${ANSI.inverse[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should reset all styles with .reset()', () => {
      const plainText = 'plain text';
      const styledText = stain.red.bold.underline.bg.blue(plainText);
      expect(styledText).not.toBe(plainText);

      const r1 = stain.reset(plainText);
      const e1 = `${ANSI.reset[0]}${plainText}${ANSI.reset[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red.reset(plainText);
      const e2 = `${ANSI.reset[0]}${plainText}${ANSI.reset[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should combine color and font styles', () => {
      const expected = `${ANSI.bold[0]}${ANSI.red[0]}hello${ANSI.red[1]}${ANSI.bold[1]}`;

      const r1 = stain.red.bold('hello');
      const e1 = expected;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.bold.red('hello');
      const e2 = expected;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should combine multiple styles correctly', () => {
      const r1 = stain.yellow.icyan.bg.bold.underline('complex');
      const e1 = `${ANSI.underline[0]}${ANSI.bold[0]}${ANSI.bgiCyan[0]}${ANSI.yellow[0]}complex${ANSI.yellow[1]}${ANSI.bgiCyan[1]}${ANSI.bold[1]}${ANSI.underline[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('.normal should reset bold/dim', () => {
      const r1 = stain.red('red  red  red');
      const e1 = `${ANSI.red[0]}red  red  red${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red(`red ${stain.red(' red ')} red`);
      const e2 = `${ANSI.red[0]}red ${ANSI.red[0]} red ${ANSI.red[0]} red${ANSI.red[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);

      const r3 = stain.red.bold(`red.bold ${stain.normal(' red.normal ')} red.bold`);
      const e3 = `${ANSI.bold[0]}${ANSI.red[0]}red.bold ${ANSI.bold[0]}${ANSI.bold[1]} red.normal ${ANSI.bold[1]}${ANSI.bold[0]} red.bold${ANSI.red[1]}${ANSI.bold[1]}`;
      LOG && console.log(`  r3: ${r3}`);
      LOG && console.log(`  e3: ${e3}`);
      expect(r3).toMatchInlineSnapshot(`"${e3}"`);

      const r4_inner = stain.red.bold(`red.bold ${stain.reset(' reset ')} red.bold `);
      const r4 = stain.red.bold(r4_inner);
      const e4 = '\x1B[1m\x1B[31m\x1B[1m\x1B[31mred.bold \x1B[0m reset \x1B[0m\x1B[1m\x1B[31m\x1B[1m\x1B[31m red.bold \x1B[31m\x1B[1m\x1B[39m\x1B[22m';
      LOG && console.log(`  r4: ${r4}`);
      LOG && console.log(`  e4: ${e4}`);
      expect(r4).toMatchInlineSnapshot(`"${e4}"`);
    });

    test('should handle bold/dim/normal precedence correctly', () => {
      const r1 = stain.bold.dim('text');
      const e1 = `${ANSI.dim[0]}text${ANSI.dim[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.dim.bold('text');
      const e2 = `${ANSI.bold[0]}text${ANSI.bold[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);

      const r3 = stain.bold.normal('text');
      const e3 = `${esc(22)}text${esc(22)}`;
      LOG && console.log(`  r3: ${r3}`);
      LOG && console.log(`  e3: ${e3}`);
      expect(r3).toMatchInlineSnapshot(`"${e3}"`);
    });

    test('should handle all font styles in combination', () => {
      const r1 = stain.bold.dim.underline.inverse('text');
      const e1 = `${ANSI.inverse[0]}${ANSI.underline[0]}${ANSI.dim[0]}text${ANSI.dim[1]}${ANSI.underline[1]}${ANSI.inverse[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('Nesting and ANSI Escaping', () => {
    const stain = createStain({ noColor: false });

    test('should correctly handle nested colorized strings', () => {
      const r1 = stain.blue('world');
      const e1 = `${ANSI.blue[0]}world${ANSI.blue[1]}`;
      LOG && console.log(`  result r1: ${r1}`);
      LOG && console.log(`  expect e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red(`hello ${r1}`);
      const e2 = `${ANSI.red[0]}hello ${ANSI.blue[0]}world${ANSI.red[0]}${ANSI.red[1]}`;
      LOG && console.log(`  result r2: ${r2}`);
      LOG && console.log(`  expect e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should correctly re-apply styles after a nested reset', () => {
      const inner = stain.reset('world');
      const r1 = stain.green.bold(`hello ${inner}!`);
      const actualInner = `${ANSI.reset[0]}world${ANSI.reset[1]}`;
      const e1 = `${ANSI.bold[0]}${ANSI.green[0]}hello ${actualInner}${ANSI.bold[0]}${ANSI.green[0]}!${ANSI.green[1]}${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle deeply nested styles', () => {
      // stain.red('C') -> <red>C</red>
      // stain.cyan('B<red>C</red>D') -> <cyan>B<red>C<cyan>D</cyan>
      // stain.yellow('A<cyan>B<red>C<cyan>D</cyan>E') -> <yellow>A<cyan>B<red>C<cyan>D<yellow>E</yellow>
      const r1 = stain.yellow(`A${stain.cyan(`B${stain.red('C')}D`)}E`);
      const e1 = `${ANSI.yellow[0]}A${ANSI.cyan[0]}B${ANSI.red[0]}C${ANSI.cyan[0]}D${ANSI.yellow[0]}E${ANSI.yellow[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle multiple nested resets correctly', () => {
      const r1 = stain.red(`text ${stain.reset('reset')} text`);
      const e1 = `${ANSI.red[0]}text ${ANSI.reset[0]}reset${ANSI.reset[1]}${ANSI.red[0]} text${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle font style escaping with replacement logic', () => {
      const r1 = stain.bold(`outer ${stain.bold('inner')} outer`);
      const e1 = `${ANSI.bold[0]}outer ${ANSI.bold[0]}inner${ANSI.bold[0]} outer${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle mixed font and color nesting', () => {
      const r1 = stain.red.bold(`text ${stain.green.underline('nested')} text`);
      const innerGreen = `${ANSI.underline[0]}${ANSI.green[0]}nested${ANSI.red[0]}${ANSI.underline[1]}`;
      const e1 = `${ANSI.bold[0]}${ANSI.red[0]}text ${innerGreen} text${ANSI.red[1]}${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('xterm and Custom Colors', () => {
    const stain = createStain({
      noColor: false,
      xterm: true,
      colors: {
        peach: 216,
        navy: 18,
      },
    });

    test('should apply xterm foreground and background colors', () => {
      const r1 = stain.x199('hot pink');
      const e1 = `${ANSI.xterm(199)[0]}hot pink${ANSI.xterm(199)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.x226.bg('bright yellow bg');
      const e2 = `${ANSI.bgXterm(226)[0]}bright yellow bg${ANSI.bgXterm(226)[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should apply custom-named foreground and background colors', () => {
      const r1 = stain.peach('peach text');
      const e1 = `${ANSI.xterm(216)[0]}peach text${ANSI.xterm(216)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.navy.bg('navy bg');
      const e2 = `${ANSI.bgXterm(18)[0]}navy bg${ANSI.bgXterm(18)[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should ignore xterm colors if xterm: false', () => {
      const noXtermStain = createStain({ noColor: false, xterm: false });
      // @ts-expect-error - testing invalid property access on purpose
      const r1 = noXtermStain.x123('text');
      const e1 = 'text';
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle xterm colors at boundaries (x0 and x255)', () => {
      const r1 = stain.x0('black');
      const e1 = `${ANSI.xterm(0)[0]}black${ANSI.xterm(0)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.x255('white');
      const e2 = `${ANSI.xterm(255)[0]}white${ANSI.xterm(255)[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle custom colors with background', () => {
      const r1 = stain.peach.bg('peach bg');
      const e1 = `${ANSI.bgXterm(216)[0]}peach bg${ANSI.bgXterm(216)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should combine xterm and custom colors', () => {
      const r1 = stain.x100.bg.peach('mixed');
      const e1 = `${ANSI.bgXterm(100)[0]}${ANSI.xterm(216)[0]}mixed${ANSI.xterm(216)[1]}${ANSI.bgXterm(100)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('noColor', () => {
    const stain = createStain({ noColor: true });

    test('should return a function that is its own property', () => {
      expect(stain.red).toBe(stain);
      expect(stain.bg).toBe(stain);
      expect(stain.red.blue.bold).toBe(stain);
    });

    test('should return unstyled text for any style chain', () => {
      const r1 = stain('text');
      const e1 = 'text';
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red('text');
      const e2 = 'text';
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
      const r3 = stain.blue.bg.bold.underline('text');
      const e3 = 'text';
      LOG && console.log(`  r3: ${r3}`);
      LOG && console.log(`  e3: ${e3}`);
      expect(r3).toMatchInlineSnapshot(`"${e3}"`);
    });

    test('should use the custom formatter if provided with no color', () => {
      const stainNoColorCustomFormat = createStain({
        noColor: true,
        format: (a: string, b: string) => `${a.toUpperCase()}-${b.toUpperCase()}`,
      });
      const r1 = stainNoColorCustomFormat.green('foo', 'bar');
      const e1 = 'FOO-BAR';
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should preserve default format function when no custom format provided', () => {
      const stainNoColor = createStain({ noColor: true });
      const r1 = stainNoColor('foo', 'bar');
      const e1 = 'foo bar';
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

  });

  describe('Input and Edge Cases', () => {
    const stain = createStain({ noColor: false });

    test('should format multiple arguments with default space joining', () => {
      const r1 = stain.cyan('hello', 'world');
      const e1 = `${ANSI.cyan[0]}hello world${ANSI.cyan[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should stringify non-string inputs', () => {
      const r1 = stain.yellow(123);
      const e1 = `${ANSI.yellow[0]}123${ANSI.yellow[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const obj = { a: 1, b: 'foo' };
      const r2 = stain.yellow(obj);
      const e2 = `${ANSI.yellow[0]}${JSON.stringify(obj)}${ANSI.yellow[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle arrays and complex objects', () => {
      const arr = [1, 2, 3];
      const r1 = stain.green(arr);
      const e1 = `${ANSI.green[0]}${JSON.stringify(arr)}${ANSI.green[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const complexObj = { nested: { value: 'test' }, array: [1, 2] };
      const r2 = stain.blue(complexObj);
      const e2 = `${ANSI.blue[0]}${JSON.stringify(complexObj)}${ANSI.blue[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle null and undefined inputs', () => {
      const r1 = stain.red(null);
      const e1 = `${ANSI.red[0]}null${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.blue(undefined);
      const e2 = `${ANSI.blue[0]}undefined${ANSI.blue[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle empty string input', () => {
      const r1 = stain.red('');
      const e1 = `${ANSI.red[0]}${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle single argument vs multiple arguments', () => {
      const r1 = stain.cyan('single');
      const e1 = `${ANSI.cyan[0]}single${ANSI.cyan[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.cyan('multiple', 'args', 'here');
      const e2 = `${ANSI.cyan[0]}multiple args here${ANSI.cyan[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should ignore invalid properties in the chain', () => {
      // @ts-expect-error - testing invalid property access on purpose
      const r1 = stain.notAColor.foo.red.bar('text');
      const e1 = `${ANSI.red[0]}text${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('.bg without a preceding color should not apply a background', () => {
      // .bg relies on the 'fg' state being set if not, it does nothing
      const r1 = stain.bg.green('text');
      const e1 = `${ANSI.green[0]}text${ANSI.green[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle chained .bg calls', () => {
      const r1 = stain.red.bg.bg.bg('text');
      const e1 = `${ANSI.bgRed[0]}text${ANSI.bgRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle boolean inputs', () => {
      const r1 = stain.green(true);
      const e1 = `${ANSI.green[0]}true${ANSI.green[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red(false);
      const e2 = `${ANSI.red[0]}false${ANSI.red[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle zero and negative numbers', () => {
      const r1 = stain.blue(0);
      const e1 = `${ANSI.blue[0]}0${ANSI.blue[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.yellow(-42);
      const e2 = `${ANSI.yellow[0]}-42${ANSI.yellow[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });
  });

  describe('Custom Format Function Edge Cases', () => {
    test('should handle custom format with no arguments', () => {
      const stain = createStain({
        noColor: false,
        format: () => 'empty',
      });
      const r1 = stain.red();
      const e1 = `${ANSI.red[0]}empty${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle custom format with single argument', () => {
      const stain = createStain({
        noColor: false,
        format: arg => `single: ${arg}`,
      });
      const r1 = stain.blue('test');
      const e1 = `${ANSI.blue[0]}single: test${ANSI.blue[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle custom format that returns non-string', () => {
      const stain = createStain({
        noColor: false,
        format: arg => (JSON.stringify({ wrapped: arg })),
      });
      const r1 = stain.green('test');
      const e1 = `${ANSI.green[0]}{"wrapped":"test"}${ANSI.green[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('Edge Cases in Style State Management', () => {
    const stain = createStain({ noColor: false });

    test('should handle rapid color changes', () => {
      const r1 = stain.red.blue.green.yellow.purple.cyan.white.black('text');
      const e1 = `${ANSI.black[0]}text${ANSI.black[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle mixed intense and normal colors', () => {
      const r1 = stain.red.ired.red('text');
      const e1 = `${ANSI.red[0]}text${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.ired.red.ired('text');
      const e2 = `${ANSI.ired[0]}text${ANSI.ired[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle multiple font style applications', () => {
      const r1 = stain.bold.bold.bold('text');
      const e1 = `${ANSI.bold[0]}text${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.underline.underline('text');
      const e2 = `${ANSI.underline[0]}text${ANSI.underline[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });

    test('should handle style order variations', () => {
      const text = 'test';
      const styles = [
        stain.red.bold.underline,
        stain.bold.red.underline,
        stain.underline.bold.red,
        stain.bold.underline.red,
      ];

      // all should produce the same result regardless of order
      const expected = `${ANSI.underline[0]}${ANSI.bold[0]}${ANSI.red[0]}${text}${ANSI.red[1]}${ANSI.bold[1]}${ANSI.underline[1]}`;
      styles.forEach((style, i) => {
        const r = style(text);
        const e = expected;
        LOG && console.log(`  r${i}: ${r}`);
        LOG && console.log(`  e${i}: ${e}`);
        expect(r).toMatchInlineSnapshot(`"${e}"`);
      });
    });

    test('should handle background color precedence correctly', () => {
      // test the logic where fg color affects bg color calculation
      const r1 = stain.red.bg.blue('text');
      const e1 = `${ANSI.bgRed[0]}${ANSI.blue[0]}text${ANSI.blue[1]}${ANSI.bgRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);

      const r2 = stain.red.bg.red('text');
      const e2 = `${ANSI.bgRed[0]}${ANSI.red[0]}text${ANSI.red[1]}${ANSI.bgRed[1]}`;
      LOG && console.log(`  r2: ${r2}`);
      LOG && console.log(`  e2: ${e2}`);
      expect(r2).toMatchInlineSnapshot(`"${e2}"`);
    });
  });

  describe('Complex Nesting Scenarios', () => {
    const stain = createStain({ noColor: false });

    test('should handle alternating font style replacement', () => {
      const inner1 = stain.bold('inner1');
      const inner2 = stain.bold('inner2');
      const r1 = stain.bold(`outer ${inner1} middle ${inner2} outer`);

      // should alternate between bold+reset and reset+bold for nested bold
      const expectedInner1 = `${ANSI.bold[0]}inner1${ANSI.bold[0]}`;
      const expectedInner2 = `${ANSI.bold[0]}inner2${ANSI.bold[0]}`;
      const e1 = `${ANSI.bold[0]}outer ${expectedInner1} middle ${expectedInner2} outer${ANSI.bold[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle reset sequences correctly', () => {
      const r1 = stain.red(`text ${stain.reset('reset')} ${stain.reset('reset2')} text`);
      const resetPart1 = `${ANSI.reset[0]}reset${ANSI.reset[1]}`;
      const resetPart2 = `${ANSI.reset[0]}reset2${ANSI.reset[1]}`;
      const e1 = `${ANSI.red[0]}text ${resetPart1}${ANSI.red[0]} ${resetPart2}${ANSI.red[0]} text${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle empty strings in nested contexts', () => {
      const r1 = stain.red(`text ${stain.blue('')} text`);
      const e1 = `${ANSI.red[0]}text ${ANSI.blue[0]}${ANSI.red[0]} text${ANSI.red[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle nested background colors', () => {
      const r1 = stain.red.bg(`text ${stain.blue.bg('nested')} text`);
      const nestedPart = `${ANSI.bgBlue[0]}nested${ANSI.bgRed[0]}`;
      const e1 = `${ANSI.bgRed[0]}text ${nestedPart} text${ANSI.bgRed[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('performance/memory cases', () => {
    const stain = createStain({ noColor: false });

    test('should handle long chains without issues', () => {
      let chain = stain;
      for (let i = 0; i < 100; i++) {
        chain = chain.red.blue.bold.dim.underline.inverse;
      }
      const result = chain('test');
      expect(typeof result).toBe('string');
      expect(result).toContain('test');
    });

    test('should handle deeply nested strings', () => {
      let nested = 'core';
      for (let i = 0; i < 10; i++) {
        nested = stain.red(`layer${i} ${nested} layer${i}`);
      }
      expect(typeof nested).toBe('string');
      expect(nested).toContain('core');
    });

    test('should handle large text inputs', () => {
      const largeText = 'a'.repeat(10000);
      const r1 = stain.red(largeText);
      const e1 = `${ANSI.red[0]}${largeText}${ANSI.red[1]}`;
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('api & type safety', () => {
    test('should maintain consistent API for all color methods', () => {
      const stain = createStain({ noColor: false });
      const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'white', 'black'] as const;

      colors.forEach(color => {
        const result = stain[color]('test');
        expect(typeof result).toBe('string');
        expect(result).toContain('test');

        const bgResult = stain[color].bg('test');
        expect(typeof bgResult).toBe('string');
        expect(bgResult).toContain('test');
      });
    });

    test('should maintain consistent API for all font styles', () => {
      const stain = createStain({ noColor: false });
      const styles = ['bold', 'dim', 'underline', 'inverse', 'reset', 'normal'] as const;

      styles.forEach(style => {
        const result = stain[style]('test');
        expect(typeof result).toBe('string');
        expect(result).toContain('test');
      });
    });

    test('should handle method chaining consistently', () => {
      const stain = createStain({ noColor: false });

      // all these should be valid chains
      const chains = [
        stain.red.bold,
        stain.bold.red,
        stain.red.bg.blue,
        stain.blue.bg.red.bold,
        stain.bold.underline.inverse.red,
        stain.reset.red.bold,
      ];

      chains.forEach(chain => {
        const result = chain('test');
        expect(typeof result).toBe('string');
        expect(result).toContain('test');
      });
    });
  });

  describe('integrations', () => {
    test('should work with different format functions', () => {
      const formatters = [
        (...args: unknown[]) => args.join('|'),
        (...args: unknown[]) => args.map(String).join(''),
        (...args: unknown[]) => JSON.stringify(args),
        (...args: unknown[]) => args.length > 0 ? String(args[0]) : '',
      ];

      formatters.forEach(format => {
        const stain = createStain({ noColor: false, format });
        const result = stain.red('test');
        expect(typeof result).toBe('string');
        // eslint-disable-next-line no-control-regex
        expect(result).toMatch(/\x1b\[31m.*\x1b\[39m/);
      });
    });

    test('should handle mixed xterm and custom colors correctly', () => {
      const stain = createStain({
        noColor: false,
        xterm: true,
        colors: {
          custom1: 100,
          custom2: 200,
        },
      });

      const r1 = stain.custom1.bg.x50('mixed');
      const e1 = `${ANSI.bgXterm(100)[0]}${ANSI.xterm(50)[0]}mixed${ANSI.xterm(50)[1]}${ANSI.bgXterm(100)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });
  });

  describe('error handling', () => {
    test('should handle undefined/null in custom colors', () => {
      // @ts-expect-error - testing invalid values
      const stain = createStain({
        noColor: false,
        colors: {
          invalid: null,
          invalid2: undefined,
          valid: 100,
        },
      });

      // @ts-expect-error - bad type so this wont work
      const r1 = stain.valid('test');
      const e1 = `${ANSI.xterm(100)[0]}test${ANSI.xterm(100)[1]}`;
      LOG && console.log(`  r1: ${r1}`);
      LOG && console.log(`  e1: ${e1}`);
      expect(r1).toMatchInlineSnapshot(`"${e1}"`);
    });

    test('should handle extreme color values', () => {
      const stain = createStain({
        noColor: false,
        xterm: true,
        colors: {
          extreme1: 999,
          extreme2: -1,
        },
      });

      // should still work even with invalid color codes
      const r1 = stain.extreme1('test');
      expect(typeof r1).toBe('string');
      expect(r1).toContain('test');
    });
  });
});

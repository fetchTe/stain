# Stain - ANSI Styling

Stain the pane without the pain of remembering if it's `bgRed`, `redBg`, or ordering for that matter

+ [Dyslectic](https://en.wikipedia.org/wiki/Dyslexia) friendly with any-[fluent](https://en.wikipedia.org/wiki/Fluent_interface)-chain API: `stain.white.bold.cyan.bg('No More Tears')`
+ Supports: [4-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit) (16 colors), [8-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit) (256 colors), **`bold`**, `dim`, <ins>`underline`</ins>, `inverse`, and [`NO_COLOR`](https://no-color.org)
+ Nest-able: `stain.red.bold('bold' + stain.normal.blue(' normal ') + 'bold')`
+ Fast-ish: ~180,000,000/sec (`NO_COLOR`), ~6,500,000/sec (`simpleEscape`), ~5,000,000/sec (default)
+ [TypeScript](https://www.typescriptlang.org)'ed with zero dependencies

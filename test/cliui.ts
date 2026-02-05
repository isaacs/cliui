// Force chalk to enable color, if it's disabled the test fails.
process.env.FORCE_COLOR = '1'

import t from 'tap'
import { cliui } from '../src/index.js'
import type { Column, ColumnArray } from '../src/index.js'
import { stripAnsi } from '../src/strip-ansi/index.js'
import chalk from 'chalk'

t.test('resetOutput', async t => {
  const ui = cliui()
  ui.div('i am a value that would be in a line')
  ui.resetOutput()
  t.equal(ui.toString().length, 0)
})

t.test('div', async t => {
  t.test("wraps text at 'width' if a single column is given", async t => {
    const ui = cliui({
      width: 10,
    })

    ui.div('i am a string that should be wrapped')

    ui.toString()
      .split('\n')
      .forEach((row: string) => {
        t.ok(row.length <= 10)
      })
  })

  t.test(
    'evenly divides text across columns if multiple columns are given',
    async t => {
      const ui = cliui({
        width: 40,
      })

      ui.div(
        { text: 'i am a string that should be wrapped', width: 15 },
        'i am a second string that should be wrapped',
        'i am a third string that should be wrapped',
      )

      // total width of all columns is <=
      // the width cliui is initialized with.
      ui.toString()
        .split('\n')
        .forEach((row: string) => {
          t.ok(row.length <= 40)
        })

      // it should wrap each column appropriately.
      const expected = [
        'i am a string  i am a      i am a third',
        'that should be second      string that',
        'wrapped        string that should be',
        '               should be   wrapped',
        '               wrapped',
      ]

      t.strictSame(ui.toString().split('\n'), expected)
    },
  )

  t.test('allows for a blank row to be appended', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div()

    // it should wrap each column appropriately.
    const expected = ['']

    t.strictSame(ui.toString().split('\n'), expected)
  })
})

t.test('_columnWidths', async t => {
  const cases: Record<string, [[Partial<Column>, Partial<Column>, Partial<Column>], [number, number, number]]> =
    {
      'uses same width for each column by default': [
        [{}, {}, {}],
        [13, 13, 13],
      ],
      'divides width over remaining columns if first column has width specified':
        [
          [{ width: 20 }, {}, {}],
          [20, 10, 10],
        ],
      'divides width over remaining columns if middle column has width specified':
        [
          [{}, { width: 10 }, {}],
          [15, 10, 15],
        ],

      'keeps track of remaining width if multiple columns have width specified':
        [
          [{ width: 20 }, { width: 12 }, {}],
          [20, 12, 8],
        ],
      'uses a sane default if impossible widths are specified': [
        [{ width: 30 }, { width: 30 }, { padding: [0, 2, 0, 1] }],
        [30, 30, 4],
      ],
    }
  for (const [n, [args, expect]] of Object.entries(cases)) {
    t.strictSame(cliui({ width: 40 }).columnWidths(args as unknown as ColumnArray), expect, n)
  }
})

t.test('alignment', async t => {
  t.test('allows a column to be right aligned', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div(
      'i am a string',
      { text: 'i am a second string', align: 'right' },
      'i am a third string that should be wrapped',
    )

    // it should right-align the second column.
    const expected = [
      'i am a stringi am a secondi am a third',
      '                    stringstring that',
      '                          should be',
      '                          wrapped',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })

  t.test('allows a column to be center aligned', async t => {
    const ui = cliui({
      width: 60,
    })

    ui.div(
      'i am a string',
      {
        text: 'i am a second string',
        align: 'center',
        padding: [0, 2, 0, 2],
      },
      'i am a third string that should be wrapped',
    )

    // it should right-align the second column.
    const expected = [
      'i am a string          i am a second       i am a third string',
      '                           string          that should be',
      '                                           wrapped',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })
})

t.test('padding', async t => {
  t.test('handles left/right padding', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div(
      { text: 'i have padding on my left', padding: [0, 0, 0, 4] },
      {
        text: 'i have padding on my right',
        padding: [0, 2, 0, 0],
        align: 'center',
      },
      { text: 'i have no padding', padding: [0, 0, 0, 0] },
    )

    // it should add left/right padding to columns.
    const expected = [
      '    i have     i have      i have no',
      '    padding  padding on    padding',
      '    on my     my right',
      '    left',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })

  t.test('handles top/bottom padding', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div(
      'i am a string',
      { text: 'i am a second string', padding: [2, 0, 0, 0] },
      {
        text: 'i am a third string that should be wrapped',
        padding: [0, 0, 1, 0],
      },
    )

    // it should add top/bottom padding to second
    // and third columns.
    const expected = [
      'i am a string             i am a third',
      '                          string that',
      '             i am a secondshould be',
      '             string       wrapped',
      '',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })

  t.test('preserves leading whitespace as padding', async t => {
    const ui = cliui()

    ui.div('     LEADING WHITESPACE')
    ui.div('\u001b[34m     with ansi\u001b[39m')

    const expected = ['     LEADING WHITESPACE', '     with ansi']

    t.strictSame(
      ui
        .toString()
        .split('\n')
        .map((l: string) => stripAnsi(l)),
      expected,
    )
  })
})

t.test('border', async t => {
  t.test('allows a border to be placed around a div', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div(
      { text: 'i am a first string', padding: [0, 0, 0, 0], border: true },
      {
        text: 'i am a second string',
        padding: [1, 0, 0, 0],
        border: true,
      },
    )

    const expected = [
      '.------------------.',
      '| i am a first     |.------------------.',
      '| string           || i am a second    |',
      "'------------------'| string           |",
      "                    '------------------'",
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })
})

t.test('wrap', async t => {
  t.test('allows wordwrap to be disabled', async t => {
    const ui = cliui({
      wrap: false,
    })

    ui.div(
      { text: 'i am a string', padding: [0, 1, 0, 0] },
      { text: 'i am a second string', padding: [0, 2, 0, 0] },
      {
        text: 'i am a third string that should not be wrapped',
        padding: [0, 0, 0, 2],
      },
    )

    t.equal(
      ui.toString(),
      'i am a string i am a second string    i am a third string that should not be wrapped',
    )
  })
})

t.test('span', async t => {
  t.test(
    'appends the next row to the end of the prior row if it fits',
    async t => {
      const ui = cliui({
        width: 40,
      })

      ui.span({ text: 'i am a string that will be wrapped', width: 30 })

      ui.div({ text: ' [required] [default: 99]', align: 'right' })

      const expected = [
        'i am a string that will be',
        'wrapped         [required] [default: 99]',
      ]

      t.strictSame(ui.toString().split('\n'), expected)
    },
  )

  t.test(
    'does not append the string if it does not fit on the prior row',
    async t => {
      const ui = cliui({
        width: 40,
      })

      ui.span({ text: 'i am a string that will be wrapped', width: 30 })

      ui.div({ text: 'i am a second row', align: 'left' })

      const expected = [
        'i am a string that will be',
        'wrapped',
        'i am a second row',
      ]

      t.strictSame(ui.toString().split('\n'), expected)
    },
  )

  t.test(
    'always appends text to prior span if wrap is disabled',
    async t => {
      const ui = cliui({
        wrap: false,
        width: 40,
      })

      ui.span({ text: 'i am a string that will be wrapped', width: 30 })

      ui.div({
        text: 'i am a second row',
        align: 'left',
        padding: [0, 0, 0, 3],
      })

      ui.div('a third line')

      const expected = [
        'i am a string that will be wrapped   i am a second row',
        'a third line',
      ]

      t.strictSame(ui.toString().split('\n'), expected)
    },
  )

  t.test(
    'appends to prior line appropriately when strings contain ansi escape codes',
    async t => {
      const ui = cliui({
        width: 40,
      })

      ui.span({
        text: chalk.green('i am a string that will be wrapped'),
        width: 30,
      })

      ui.div({
        text: chalk.blue(' [required] [default: 99]'),
        align: 'right',
      })

      const expected = [
        'i am a string that will be',
        'wrapped         [required] [default: 99]',
      ]

      t.strictSame(
        ui
          .toString()
          .split('\n')
          .map((l: string) => stripAnsi(l)),
        expected,
      )
    },
  )
})

t.test('layoutDSL', async t => {
  t.test('turns tab into multiple columns', async t => {
    const ui = cliui({
      width: 60,
    })

    ui.div(
      '  <regex>  \tmy awesome regex\n  <my second thing>  \tanother row\t  a third column',
    )

    const expected = [
      '  <regex>            my awesome regex',
      '  <my second thing>  another row          a third column',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })

  t.test('turns newline into multiple rows', async t => {
    const ui = cliui({
      width: 40,
    })

    ui.div(
      'Usage: $0\n  <regex>\t  my awesome regex\n  <glob>\t  my awesome glob\t  [required]',
    )
    const expected = [
      'Usage: $0',
      '  <regex>  my awesome regex',
      '  <glob>   my awesome     [required]',
      '           glob',
    ]

    t.strictSame(ui.toString().split('\n'), expected)
  })

  t.test(
    'aligns rows appropriately when they contain ansi escape codes',
    async t => {
      const ui = cliui({
        width: 40,
      })

      ui.div(
        '  <regex>\t  ' +
          chalk.red('my awesome regex') +
          '\t  [regex]\n  ' +
          chalk.blue('<glob>') +
          '\t  my awesome glob\t  [required]',
      )

      const expected = [
        '  <regex>  my awesome     [regex]',
        '           regex',
        '  <glob>   my awesome     [required]',
        '           glob',
      ]

      t.strictSame(
        ui
          .toString()
          .split('\n')
          .map((l: string) => stripAnsi(l)),
        expected,
      )
    },
  )

  t.test('ignores ansi escape codes when measuring padding', async t => {
    // Forcefully enable color-codes for this test
    const { level } = chalk
    chalk.level = 1

    const ui = cliui({
      width: 25,
    })

    // using figlet font 'Shadow' rendering of text 'true' here
    ui.div(
      chalk.blue(
        '  |                      \n  __|   __|  |   |   _ \\ \n  |    |     |   |   __/ \n \\__| _|    \\__,_| \\___| \n                         ',
      ),
    )

    // relevant part is first line - leading whitespace should be preserved as left padding
    const expected = [
      '  |',
      '  __|   __|  |   |   _ \\',
      '  |    |     |   |   __/',
      ' \\__| _|    \\__,_| \\___|',
      '                         ',
    ]

    t.strictSame(
      ui
        .toString()
        .split('\n')
        .map((l: string) => stripAnsi(l)),
      expected,
    )
    chalk.level = level
  })

  t.test(
    'correctly handles lack of ansi escape codes when measuring padding',
    async t => {
      const ui = cliui({
        width: 25,
      })

      // using figlet font 'Shadow' rendering of text 'true' here
      ui.div(
        '  |                      \n  __|   __|  |   |   _ \\ \n  |    |     |   |   __/ \n \\__| _|    \\__,_| \\___| \n                         ',
      )

      // The difference
      const expected = [
        '  |',
        '  __|   __|  |   |   _ \\',
        '  |    |     |   |   __/',
        ' \\__| _|    \\__,_| \\___|',
        '',
      ]

      t.strictSame(
        ui
          .toString()
          .split('\n')
          .map((l: string) => stripAnsi(l)),
        expected,
      )
    },
  )

  t.test('does not apply DSL if wrap is false', async t => {
    const ui = cliui({
      width: 40,
      wrap: false,
    })

    ui.div('Usage: $0\ttwo\tthree')

    t.strictSame(ui.toString(), 'Usage: $0\ttwo\tthree')
  })
})

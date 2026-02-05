import t from 'tap'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const text = `usage: git tag [-a | -s | -u <key-id>] [-f] [-m <msg> | -F <file>] [-e]
               <tagname> [<commit> | <object>]
   or: git tag -d <tagname>...
   or: git tag [-n[<num>]] -l [--contains <commit>] [--no-contains <commit>]
               [--points-at <object>] [--column[=<options>] | --no-column]
               [--create-reflog] [--sort=<key>] [--format=<format>]
               [--merged <commit>] [--no-merged <commit>] [<pattern>...]
   or: git tag -v [--format=<format>] <tagname>...`

const { cliui: cliuiCJS } = require('../dist/commonjs/index.js')
import { cliui as cliuiESM } from '../dist/esm/index.js'

t.test('consistent wrapping', async t => {
  const uiCJS = cliuiCJS({})
  const uiESM = cliuiESM({})
  uiCJS.div({
    padding: [0, 0, 0, 0],
    text,
  })
  uiESM.div({
    padding: [0, 0, 0, 0],
    text,
  })
  t.equal(uiCJS.toString(), uiESM.toString())
})

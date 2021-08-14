import { loadPartialConfig } from "@babel/core"
import { parse, ParserOptions } from "@babel/parser"
import traverse from "@babel/traverse"
import { merge } from "lodash"
import { parsers as babelParsers } from "prettier/parser-babel"
import { parsers as flowParsers } from "prettier/parser-flow"
import { parsers as typescriptParsers } from "prettier/parser-typescript"

export const preprocess = function (code: string) {
  const defaultConfig = {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  } as ParserOptions
  const babelConfig = loadPartialConfig() as ParserOptions
  const mergedOptions = merge(defaultConfig, babelConfig)

  type Position = [blockStart: number, propertyStart: number]
  const positions: Position[] = []

  const ast = parse(code, mergedOptions)
  traverse(ast, {
    enter(path) {
      switch (path.node.type) {
        case "ObjectPattern":
        case "ObjectExpression": {
          const prop = path.node.properties[0]
          if (
            prop === undefined ||
            path.node.loc === null ||
            prop.loc === null ||
            path.node.start === null ||
            prop.start === null ||
            // if the property already follows in the same line then there's no
            // point in collapsing it
            path.node.loc.start.line === prop.loc.start.line
          ) {
            return
          }
          positions.push([path.node.start, prop.start])
          break
        }
      }
    },
  })

  let unshift = 0
  let pos: Position | undefined
  toNextPosition: while ((pos = positions.shift())) {
    // put the cursor immediately after the opening brace
    let cursor = pos[0] + 1 - unshift

    // figure out what follows the opening brace to decide if the node will be
    // collapsed
    toNextCursor: while (code[cursor]) {
      switch (code[cursor]) {
        case " ":
        case "\t":
        case "\r":
        case "\n": {
          // skip whitespace
          break
        }
        case "/": {
          // don't collapse this node if a comment follows the opening brace
          continue toNextPosition
        }
        default: {
          // found something other than whitespace or a comment after the opening brace
          break toNextCursor
        }
      }
      cursor += 1
    }

    // remove the whitespace following the opening brace
    code = `${code.slice(0, pos[0] + 1 - unshift)}${code.slice(
      pos[1] - unshift,
    )}`

    // take into account what was removed for future positions
    unshift += pos[1] - 1 - pos[0]
  }

  return code
}

module.exports = {
  parsers: {
    babel: { ...babelParsers.babel, preprocess },
    "babel-flow": { ...flowParsers.flow, preprocess },
    typescript: { ...typescriptParsers.typescript, preprocess },
  },
  options: {},
}

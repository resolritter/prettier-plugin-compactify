import { loadPartialConfig } from "@babel/core"
import { parse, ParserOptions } from "@babel/parser"
import traverse from "@babel/traverse"
import merge from "lodash.merge"
import { parsers as babelParsers } from "prettier/parser-babel"
import { parsers as flowParsers } from "prettier/parser-flow"
import { parsers as typescriptParsers } from "prettier/parser-typescript"

export const preprocess = function (code: string) {
  const defaultParserOptions: ParserOptions = {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  }
  const babelConfigParserOptions = loadPartialConfig()
  const mergedOptions = merge(
    defaultParserOptions,
    babelConfigParserOptions as ParserOptions,
  )

  type Position = { openBrace: number; propertyStart: number }
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
          positions.push({
            openBrace: path.node.start,
            propertyStart: prop.start,
          })
          break
        }
      }
    },
  })

  let unshift = 0
  let pos: Position | undefined
  toNextPosition: while ((pos = positions.shift())) {
    // position the cursor immediately after the node's open brace
    let cursor = pos.openBrace + 1 - unshift

    // figure out what follows the opening brace to decide if the node will be
    // collapsed
    toNextChar: while (code[cursor]) {
      switch (code[cursor]) {
        // whitespace is skipped
        case " ":
        case "\t":
        case "\r":
        case "\n": {
          break
        }
        // if a comment follows the opening brace, then don't collapse
        case "/": {
          continue toNextPosition
        }
        default: {
          break toNextChar
        }
      }
      cursor++
    }

    // remove whitespace following the opening brace
    code = `${code.slice(0, pos.openBrace + 1 - unshift)}${code.slice(
      pos.propertyStart - unshift,
    )}`

    // take into account what was removed for future positions
    unshift += pos.propertyStart - 1 - pos.openBrace
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

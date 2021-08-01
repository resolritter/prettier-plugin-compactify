import { parsers as babelParsers } from "prettier/parser-babel"
import { parsers as flowParsers } from "prettier/parser-flow"
import { parsers as typescriptParsers } from "prettier/parser-typescript"

import { preprocess } from "./preprocess"

module.exports = {
  parsers: {
    babel: { ...babelParsers.babel, preprocess },
    "babel-flow": { ...flowParsers.flow, preprocess },
    typescript: { ...typescriptParsers.typescript, preprocess },
  },
  options: {},
}

# prettier-plugin-compactify

Available on npm as `prettier-plugin-compactify`

# Archiving notice

Prettier 3.5 introduced `"objectWrap": "collapse"` which made this plugin obsolete for me. Big thanks to @pauldraper
 for implementing it!

- https://prettier.io/blog/2025/02/09/3.5.0
- https://github.com/prettier/prettier/pull/16163

# Introduction

This plugin collapses objects' formatting before passing the code to Prettier.

Effectively it preprocesses the code such that:

```js
const obj = {
  foo: "bar"
}
```

Becomes:

```js
const obj = {foo: "bar"
}
```

Which prettier will try to fit in a single line:

```js
const obj = { foo: "bar" }
```

This plugin was created because Prettier keeps arbitrary newlines after a `{`
even if the user does not want them. For more context see
[issue 10757](https://github.com/prettier/prettier/issues/10757).

# Development

1. Install [pre-commit](https://github.com/pre-commit/pre-commit)
2. Install pre-commit hooks
  1. `cd` to this repository
  2. Run `pre-commit install`

Additionally:

- `yarn fix` for formatting
- `yarn lint` for linting

# Release

`yarn release`

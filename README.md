# Generate translation json files for [vue-i18n](https://github.com/kazupon/vue-i18n)

This is a forked project of [webpack-i18n-generate-json](https://github.com/gkShine/i18n-generate-json) which we love and recommend. This was made to cater to our own workflow where we want to support vue-i18n's [Locale messages syntax](https://kazupon.github.io/vue-i18n/guide/messages.html). Right now it will only work with nested objects like $('message.hello') and not $('errors[0]')

## Planned features
  * Support for arrays like $('errors[0]')
  * Ability to import/export csv and yml files to make it easier to work with translators

## Basic Example

## Install
`npm i @code-ninja/i18n-lang-generator --save-dev`
or
`yarn add @code-ninja/i18n-lang-generator`

### package.json
```
  scripts: {
    "i18n-lang-generator": "i18n-lang-generator -d src -l 'en-US'"
  }
```

## Run
1. add a script (see example package.json)
2. `npm run i18n-lang-generator`

### App code
```
  <form>
    <p>{{ $t('Hello') }}</p>
    <button type="submit">{{ $t('button.save') }}</button>
    <button type="reset">{{ $t('button.cancel') }}</span> // variable replacement
  </form>
```

### Output translation json - send it to the translator. Regenerating it won't delete existing translations.
```
  {
    "Hello":"Hello",
    "button": {
      "save": "save",
      "cancel": "cancel"
    }
  }  
```

## Options
- `-d, -directory, default [cwd]`
- `-b, -base directory, default [none]`
- `-f, -functionName, default [\\$t]`
- `-o, -outputDirectory, default [lang]`
- `-l, -languages REQUIRED, default [none]`
- `-x, -deleteExpired, default [false] : deletes unused translations`
- `-r, -forceReWrite, default [false]: rewrites malformed json files`

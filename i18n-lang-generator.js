#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const _ = require('lodash')
const sortObject = require('deep-sort-object')

class i18nLangGenerator {
  constructor(options) {
    this.options = _.extend({
      base: '',
      from: [],
      to: '',
      languages: [],
      extensions: ['vue', 'js'],
      functionName: '\\$t',
      deleteExpired: false,
      ignoreDefault: false
    }, options)
  }

  run() {
    const {
      from,
      extensions,
      base
    } = this.options
    let path = from.join('|')
    let ext = extensions.join('|')
    glob(`${base}/@(${path})/**/*.@(${ext})`, {}, (err, files) => {
      if (err) throw err
      this.writeJSON(this.getText(files))
    })
  }

  getText(files) {
    const fn = '\\$t'
    let obj = {}
    let objMap = []
    let strMap = []

    files.forEach((file) => {
      const text = fs.readFileSync(file, 'utf8')
      const findTranslations = new RegExp(`\\W${fn}\\(\\'([^\\']*)\\'(\\)|,)`, 'g')
      let result
      let newObj = {}
      while (result = findTranslations.exec(text)) {

        let arr = result[1].split('.')
        let parentKey = ''

        arr.reduce((o, s, i) => {

          try {

            let last = (i + 1 == arr.length)

            if (!last && !o[s]) {

              if (strMap.indexOf(parentKey) > -1)
                throw ({
                  message: `key ${parentKey} exist as string`
                })

              objMap.push(s)
              parentKey += parentKey ? `.${s}` : s
              return o[s] = {}

            } else if (!last && o[s]) {

              parentKey += parentKey ? `.${s}` : s
              return o[s] = o[s]

            } else {

              if (objMap.indexOf(s) > -1)
                throw ({
                  message: `key ${s} exist as object`
                })

              if (strMap.indexOf(parentKey) > -1)
                throw ({
                  message: `key ${parentKey} exist as string`
                })

              strMap.push(result[1])
              parentKey += parentKey ? `.${s}` : s
              return o[s] = s

            }

          } catch (e) {

            console.log(`There's a conflict with ${result[1]}:`, e.message)
            process.exit(1)

          }
        }, newObj)

      }

      _.merge(obj, newObj)
    })

    return obj
  }

  writeJSON(result) {

    const {
      languages
    } = this.options

    languages.forEach((lang) => {
      this.processLanguage(lang, result)
    })

  }

  processLanguage(lang, result) {

    console.log(`\n${lang}.json`)

    const { base, to } = this.options

    const localeText = this.getLocaleConfig(lang)

    const localeMap = this.flatten(localeText)
    const resultMap = this.flatten(result)
    const report = {}

    localeMap.forEach((item) => {
      if (resultMap.indexOf(item) < 0)
        report[item] = "unused"
      //add delete function here
    })

    resultMap.forEach((item) => {
      if (localeMap.indexOf(item) < 0)
        report[item] = "new item added"
    })

    const mergedObj = sortObject(_.merge({}, result, localeText))

    fs.writeFileSync(
      `${base}/${to}/${lang}.json`,
      JSON.stringify(mergedObj, null, 2),
      'utf8'
    )

    const iterate = (obj, parent = '') => {
      Object.keys(obj).forEach(key => {
        let newParent = parent ? parent + '.' + key : key
        if (typeof obj[key] === 'object')
          iterate(obj[key], newParent)
        else if (key === obj[key] && !report[newParent])
          report[newParent] = 'needs translation'
      })
    }

    iterate(mergedObj)

    if (Object.keys(report).length)
      console.table(report)
    else
      console.log('No issues')


  }

  getLocaleConfig(language) {
    try {
      const { base, to } = this.options
      const content = fs.readFileSync(`${base}/${to}/${language}.json`)
      return JSON.parse(content)
    } catch (error) {
      console.warn(`No translation file exists for language "${language}"`)
    }
    return {}
  }


  flatten(value) {

    let arr = []

    const iterate = (obj, parent = '') => {
      Object.keys(obj).forEach(key => {
        let newParent = parent ? parent + '.' + key : key
        if (typeof obj[key] === 'object')
          iterate(obj[key], newParent)
        else
          arr.push(newParent)
      })
    }

    iterate(value)

    return arr

  }


}

const argv = require('minimist')(process.argv.slice(2))
const languages = argv.l || argv.languages || ''
const baseDir = argv.b || argv.baseDirectory || '.'
const dir = argv.d || argv.directory || ''
const functionName = argv.f || argv.functionName || '\\$t'
const outputDirectory = argv.o || argv.output || 'lang'
const deleteExpired = argv.x || argv.deleteExpired || false
const ignoreDefault = argv.g || argv.ignoreDefault || false

new i18nLangGenerator({
  base: baseDir.replace(/\/$/, ''),
  from: dir ? dir.split(' ') : [],
  to: outputDirectory,
  languages: languages ? languages.split(' ') : [],
  functionName: functionName,
  deleteExpired: deleteExpired,
  ignoreDefault: ignoreDefault
}).run()

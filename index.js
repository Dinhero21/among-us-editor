const sus = require('./sus.js')
const path = require('path')
const util = require('util')
const fs = require('fs')
const figlet = require('figlet')
const inquirer = require('inquirer')
// const fs = require('fs')

const amongUsPath = sus.getAmongUsPath(process.env.USERPROFILE)
const gameHostOptionsPath = sus.gameHostOptions.getPath(amongUsPath)

let gameHostOptionsBuffer = sus.gameHostOptions.getBuffer(gameHostOptionsPath)
let gameHostOptions = sus.gameHostOptions.parse(gameHostOptionsBuffer)
let parsed = sus.gameHostOptions.format(gameHostOptions)

cli()

async function cli () {
  while (true) await menu()

  async function menu () {
    console.clear()

    await title()

    const response = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Edit game host options',
          value: 'edit'
        },
        {
          name: 'Save to file',
          value: 'save'
        },
        {
          name: 'Load file',
          value: 'load'
        },
        {
          name: 'Exit',
          value: 'exit'
        }
      ]
    })

    switch (response.action) {
      case 'edit':
        await edit()
        break
      case 'save':
        await save()
        break
      case 'load':
        await load()
        break
      case 'exit':
        process.exit(0)
        // break
      default:
        throw new Error(`Unknown action: ${response.action}`)
        // break
    }
  }

  async function edit () {
    console.clear()

    await title()

    const { option } = await inquirer.prompt({
      type: 'list',
      name: 'option',
      message: 'What option would you like to edit?',
      choices: Object.values(parsed).map((value, index) => {
        return {
          name: value,
          value: Object.keys(gameHostOptions)[index]
        }
      })
    })

    console.clear()

    await title()

    let min
    let max
    let isFloat

    switch (sus.gameHostOptions.table[option].type) {
      case 'Int8':
        min = 0
        max = 255

        isFloat = false
        break
      case 'UInt8':
        min = -128
        max = 127

        isFloat = false
        break
      case 'Int32LE':
        min = 2147483648
        max = 2147483647

        isFloat = false
        break
      case 'FloatLE':
        min = -340282346638528859811704183484516925440
        max = 340282346638528859811704183484516925440

        isFloat = true
        break
      default:
        throw new Error(`Unknown type: ${sus.gameHostOptions.table[option].type}`)
    }

    if (!isFloat) console.log('Please enter a natural number.')

    console.log(`Min: ${min}.`)
    console.log(`Max: ${max}.`)

    const { value } = await inquirer.prompt({
      type: 'number',
      name: 'value',
      message: 'Set to: ',
      validate: value => {
        if (isNaN(value)) return 'Please enter a number.'
        if (value < min) return `Value too small! Please enter a value bigger or equal to ${min}.`
        if (value > max) return `Value too big! Please enter a value smaller or equal to ${max}.`
        if (value % 1 !== 0) return `Please enter a natural number like ${Math.floor(value)}.`

        return true
      }
    })

    gameHostOptions[option] = value

    gameHostOptionsBuffer = sus.gameHostOptions.encode(gameHostOptions)

    sus.gameHostOptions.writeBuffer(gameHostOptionsPath, gameHostOptionsBuffer)
  }

  async function save () {
    const { name } = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'Save name:'
    })

    const savePath = path.join('./saves', name)

    if (fs.existsSync(savePath)) {
      const { overwrite } = await inquirer.prompt({
        type: 'confirm',
        name: 'overwrite',
        message: `${name} already exists. Do you want to overwrite it?`
      })

      if (!overwrite) await save()

      if (!save) return await save()
    }

    fs.writeFileSync(savePath, gameHostOptionsBuffer)
  }

  async function load () {
    if (!fs.existsSync('./saves')) fs.mkdirSync('./saves')

    const saves = fs.readdirSync('./saves')

    if (saves.length === 0) return

    const { name } = await inquirer.prompt({
      type: 'list',
      name: 'name',
      message: 'Load file:',
      choices: saves
    })

    const savePath = path.join('./saves', name)

    const { saveCurrent } = await inquirer.prompt({
      type: 'confirm',
      name: 'saveCurrent',
      message: 'Would you like to save the current game host options?'
    })

    if (saveCurrent) await save()

    gameHostOptionsBuffer = fs.readFileSync(savePath)
    gameHostOptions = sus.gameHostOptions.parse(gameHostOptionsBuffer)
    parsed = sus.gameHostOptions.format(gameHostOptions)
  }

  async function title () {
    const title = await util.promisify(figlet)('Among Us Editor')

    console.log(title)
  }
}

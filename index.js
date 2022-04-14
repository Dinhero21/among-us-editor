const sus = require('./sus.js')
const path = require('path')
const util = require('util')
const figlet = require('figlet')
const inquirer = require('inquirer')
// const fs = require('fs')

const amongUsPath = path.join(process.env.USERPROFILE, 'Appdata/LocalLow/Innersloth/Among Us')

cli()

async function cli () {
  await menu() // while (true) await menu()

  async function menu () {
    // console.clear()

    await title()

    const response = await inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Edit',
          value: 'edit'
        },
        {
          name: 'Quit',
          value: 'quit'
        }
      ]
    })

    switch (response.action) {
      case 'edit':
        await edit()
        break
      case 'quit':
        process.exit(0)
        // break
      default:
        throw new Error(`Unknown action: ${response.action}`)
        // break
    }
  }

  async function edit () {
    let gameHostOptionsBuffer = sus.gameHostOptions.getBuffer(amongUsPath)
    const gameHostOptions = sus.gameHostOptions.parse(gameHostOptionsBuffer)
    const parsed = sus.gameHostOptions.format(gameHostOptions)

    console.clear()

    await title()

    console.log(gameHostOptions)

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

    sus.gameHostOptions.writeBuffer(amongUsPath, gameHostOptionsBuffer)
  }

  async function title () {
    const title = await util.promisify(figlet)('Among Us Editor')

    console.log(title)
  }
}

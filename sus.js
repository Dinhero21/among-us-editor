const path = require('path')
const fs = require('fs')

// Boolean Switch
function BS (value) {
  return value === 0 ? 'Off' : 'On'
}

// ID Choice
function IDC (choices, value, IDN = 'ID') {
  return choices[value] ?? `${IDN}: ${value}`
}

function seconds (value) {
  return `${value}s`
}

function multiplier (value) {
  return `${value}x`
}

function none (value) {
  return value
}

const gameHostOptions = {
  getPath (amongUsPath) {
    return path.join(amongUsPath, 'gameHostOptions')
  },
  getBuffer (gameHostOptionsPath) {
    if (fs.existsSync(gameHostOptionsPath)) console.info(`Found game host options in "${gameHostOptionsPath}".`)
    else throw new Error(`Could not find game host options in "${gameHostOptionsPath}".`)

    return fs.readFileSync(gameHostOptionsPath)
  },
  writeBuffer (gameHostOptionsPath, gameHostOptionsBuffer) {
    return fs.writeFileSync(gameHostOptionsPath, gameHostOptionsBuffer)
  },
  parse (buffer) {
    return Object.fromEntries(Object.entries(gameHostOptions.table).map(([key, value]) => {
      let data

      switch (value.type) {
        case 'Int8':
          data = buffer.readInt8(value.address)
          break
        case 'UInt8':
          data = buffer.readUInt8(value.address)
          break
        case 'Int32LE':
          data = buffer.readInt32LE(value.address)
          break
        case 'FloatLE':
          data = buffer.readFloatLE(value.address)
          break
        default:
          throw new Error(`Unknown type: ${value.type}`)
      }

      return [key, data]
    }))
    /*
    return {
      RECOMMENDED_SETTINGS: gameHostOptionsBuffer.readInt8(0x28), // * Could be .readUInt16LE or boolean
      MAP: gameHostOptionsBuffer.readInt8(0x06), // * Could be readUInt8
      IMPOSTORS: gameHostOptionsBuffer.readInt8(0x1E), // ? IMPOSTOR_COUNT
      CONFIRM_EJECTS: gameHostOptionsBuffer.readUInt8(0x2A),
      EMERGENCY_MEETINGS: gameHostOptionsBuffer.readInt32LE(0x1A),
      ANONYMOUS_VOTES: gameHostOptionsBuffer.readUInt8(0x2C),
      EMERGENCY_COOLDOWN: gameHostOptionsBuffer.readUInt8(0x29),
      DISCUSSION_TIME: gameHostOptionsBuffer.readInt32LE(0x20),
      VOTING_TIME: gameHostOptionsBuffer.readInt32LE(0x24), // * Negative values become Infinity
      PLAYER_SPEED: gameHostOptionsBuffer.readFloatLE(0x07),
      CREWMATE_VISION: gameHostOptionsBuffer.readFloatLE(0x0B),
      IMPOSTOR_VISION: gameHostOptionsBuffer.readFloatLE(0x0F),
      KILL_COOLDOWN: gameHostOptionsBuffer.readFloatLE(0x13),
      KILL_DISTANCE: gameHostOptionsBuffer.readUInt8(0x1F), // * Not very sure (Possibly impossible experimenting)
      TASK_BAR_UPDATES: gameHostOptionsBuffer.readInt8(0x2D), // * Could be readUInt8
      VISUAL_TASKS: gameHostOptionsBuffer.readUInt8(0x2B),
      COMMON_TASKS: gameHostOptionsBuffer.readUInt8(0x17),
      LONG_TASKS: gameHostOptionsBuffer.readUInt8(0x18),
      SHORT_TASKS: gameHostOptionsBuffer.readUInt8(0x19)
    }
    */
  },
  encode (object) {
    const buffer = Buffer.alloc(60)

    for (const [option, value] of Object.entries(object)) {
      const properties = gameHostOptions.table[option]

      switch (properties.type) {
        case 'Int8':
          buffer.writeInt8(value, properties.address)
          break
        case 'UInt8':
          buffer.writeUInt8(value, properties.address)
          break
        case 'Int32LE':
          buffer.writeInt32LE(value, properties.address)
          break
        case 'FloatLE':
          buffer.writeFloatLE(value, properties.address)
          break
        default:
          throw new Error(`Unknown type: ${properties.type}`)
      }
    }

    return buffer
  },
  table: {
    RECOMMENDED_SETTINGS: {
      type: 'Int8',
      address: 0x28,
      name: 'Recommended Settings',
      parse: BS
    },
    MAP: {
      type: 'Int8',
      address: 0x06,
      name: 'Map',
      parse: value => IDC(['The Skeld', 'MIRA HQ', 'Polus', 'Airship'], value) // TODO: Check for more maps
    },
    IMPOSTORS: {
      type: 'Int8',
      address: 0x1E,
      name: '# Impostors',
      parse: none
    },
    CONFIRM_EJECTS: {
      type: 'UInt8',
      address: 0x2A,
      name: 'Confirm Ejects',
      parse: BS
    },
    EMERGENCY_MEETINGS: {
      type: 'Int32LE',
      address: 0x1A,
      name: '# Emergency Meetings',
      parse: none
    },
    ANONYMOUS_VOTES: {
      type: 'UInt8',
      address: 0x2C,
      name: 'Anonymous Votes',
      parse: BS
    },
    EMERGENCY_COOLDOWN: {
      type: 'UInt8',
      address: 0x29,
      name: 'Emergency Cooldown',
      parse: seconds
    },
    DISCUSSION_TIME: {
      type: 'Int32LE',
      address: 0x20,
      name: 'Discussion Time',
      parse: none
    },
    VOTING_TIME: {
      type: 'Int32LE',
      address: 0x2A,
      name: 'Voting Time',
      parse: value => seconds(value < 0 ? '∞' : value)
    },
    PLAYER_SPEED: {
      type: 'FloatLE',
      address: 0x07,
      name: 'Player Speed',
      parse: multiplier
    },
    CREWMATE_VISION: {
      type: 'FloatLE',
      address: 0x0B,
      name: 'Crewmate Vision',
      parse: multiplier
    },
    IMPOSTOR_VISION: {
      type: 'FloatLE',
      address: 0x0B,
      name: 'Impostor Vision',
      parse: multiplier
    },
    KILL_COOLDOWN: {
      type: 'FloatLE',
      address: 0x13,
      name: 'Kill Cooldown',
      parse: seconds
    },
    KILL_DISTANCE: {
      type: 'UInt8',
      address: 0x13,
      name: 'Kill Distance',
      parse: value => IDC(['Short', 'Medium', 'Long'], value)
    },
    TASK_BAR_UPDATES: {
      type: 'Int8',
      address: 0x2D,
      name: 'Task Bar Updates',
      parse: value => IDC(['Allways', 'Meetings', 'Never'], value)
    },
    VISUAL_TASKS: {
      type: 'UInt8',
      address: 0x2D,
      name: 'Visual Tasks',
      parse: BS
    },
    COMMON_TASKS: {
      type: 'UInt8',
      address: 0x17,
      name: 'Common Tasks',
      parse: none
    },
    LONG_TASKS: {
      type: 'UInt8',
      address: 0x18,
      name: 'Long Tasks',
      parse: none
    },
    SHORT_TASKS: {
      type: 'UInt8',
      address: 0x19,
      name: 'Short Tasks',
      parse: none
    }
  },
  format (gameHostOptionsParsed) {
    function format (name, value) {
      const table = gameHostOptions.table[name]

      return `${table.name}: ${table.parse(value)}`
    }

    return Object.fromEntries(Object.entries(gameHostOptionsParsed).map(([key, value]) => [key, format(key, value)]))
  }
}

function getAmongUsPath (user) {
  return path.join(user, 'Appdata/LocalLow/Innersloth/Among Us')
}

module.exports = { gameHostOptions, getAmongUsPath }

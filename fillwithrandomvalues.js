const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const amongUsPath = path.join(process.env.USERPROFILE, 'Appdata/LocalLow/Innersloth/Among Us')
const gameHostOptionsPath = path.join(amongUsPath, 'gameHostOptions')
const gameHostOptionsBuffer = fs.readFileSync(gameHostOptionsPath)

const randomBuffer = crypto.randomBytes(gameHostOptionsBuffer.length)

fs.writeFileSync(gameHostOptionsPath, randomBuffer)

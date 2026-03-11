import Ajv from 'ajv'
import { readFileSync } from 'fs'

const schema = JSON.parse(readFileSync('./changes.schema.json', 'utf8'))
const data   = JSON.parse(readFileSync('./changes.json', 'utf8'))

const ajv = new Ajv()
const valid = ajv.validate(schema, data)

if (!valid) {
  console.error('changes.json is invalid:\n')
  for (const err of ajv.errors) {
    console.error(`  ${err.instancePath || '(root)'} ${err.message}`)
  }
  process.exit(1)
}

console.log('changes.json valid')

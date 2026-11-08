#!/usr/bin/env node
/**
 * Pre-publish guard: the package name is repeated in three places, and a
 * mismatch is silent until the plugin fails to load in a running DSH.
 *
 *   1. package.json            "name"          — the npm package identity
 *   2. cordis.patch.yml        name            — the module the Loader mounts
 *   3. client.js               __ModuleLoader__.load({ id }) — the bundle it registers
 *
 * All three must be identical. This runs from "prepublishOnly", so a wrong
 * name aborts the publish instead of shipping a broken bundle.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (name) => readFileSync(join(root, name), 'utf8')

const pkg = JSON.parse(read('package.json'))
const patch = read('cordis.patch.yml')
const client = read('client.js')

const patchName = /name:\s*'([^']+)'/u.exec(patch)?.[1]
const clientId = /__ModuleLoader__\.load\(\{\s*id:\s*'([^']+)'/u.exec(client)?.[1]

/** @type {string[]} */
const issues = []
if (patchName !== pkg.name) {
  issues.push(`cordis.patch.yml name "${patchName}" !== package.json name "${pkg.name}"`)
}
if (clientId !== pkg.name) {
  issues.push(`client.js load id "${clientId}" !== package.json name "${pkg.name}"`)
}
if (pkg.private === true) issues.push('package.json still sets "private": true; npm publish would refuse it')
if (typeof pkg.license !== 'string' || pkg.license === '') issues.push('package.json has no "license"')
if (pkg.dsh?.bundle?.patch === undefined) issues.push('package.json has no dsh.bundle.patch')
if (pkg.dsh?.client === undefined) issues.push('package.json has no dsh.client')

if (issues.length > 0) {
  console.error('check-manifest: refusing to publish')
  for (const issue of issues) console.error(`  - ${issue}`)
  process.exit(1)
}
console.log(`check-manifest: ok ${pkg.name}@${pkg.version}`)

#!/usr/bin/env node

/** dinwwwh */

import pkg from '../package.json'

import { start } from './commands/start'

const program = start.name(pkg.name).alias('start').version(pkg.version)

program.parse()

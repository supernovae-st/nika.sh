#!/usr/bin/env node
// LENS-011 · exact post-generation guard.
//
// A path allow-list is not provenance: an attacker can change bytes inside an
// allowed generated file. This guard checks the literal path set AND every
// byte digest against the versioned pin-specific resync contract.
import {
  ROOT,
  loadContract,
  verifyOutputTree,
  verifyPublishInputContract,
} from './spec-resync-lib.mjs'

try {
  const contract = loadContract()
  verifyPublishInputContract(ROOT, contract)
  const outputs = verifyOutputTree(ROOT, contract, { checkChanges: true })
  console.log(`LENS-011: ${Object.keys(outputs).length} declared outputs match exact contract digests — ok`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

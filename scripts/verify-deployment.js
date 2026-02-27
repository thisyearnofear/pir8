#!/usr/bin/env node

/**
 * PIR8 Deployment Verification Script
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let hasErrors = false;

function check(name, condition, errorMsg, successMsg) {
  const result = { name, passed: condition };
  if (condition) {
    console.log(`✅ ${successMsg || name}`);
  } else {
    console.error(`❌ ${errorMsg || name}`);
    hasErrors = true;
  }
  checks.push(result);
}

console.log('🏴‍☠️ PIR8 Deployment Verification\n');

// Check 1: IDL file exists
const publicIdlPath = path.join(process.cwd(), 'public/idl/pir8_game.json');
check(
  'IDL File',
  fs.existsSync(publicIdlPath),
  'IDL file not found at public/idl/pir8_game.json',
  'IDL file exists at public/idl/pir8_game.json'
);

// Check 2: IDL is valid JSON
if (fs.existsSync(publicIdlPath)) {
  try {
    const idl = JSON.parse(fs.readFileSync(publicIdlPath, 'utf8'));
    check(
      'IDL Valid',
      idl.version && idl.instructions && idl.metadata,
      'IDL file is not valid or missing required fields',
      `IDL is valid (version: ${idl.version}, ${idl.instructions.length} instructions)`
    );
    
    // Check program address
    check(
      'Program Address',
      idl.metadata && idl.metadata.address,
      'IDL missing program address in metadata',
      `Program address: ${idl.metadata.address}`
    );
  } catch (e) {
    check('IDL Valid', false, `IDL file is not valid JSON: ${e.message}`);
  }
}

// Check 3: IDL is tracked by git
try {
  const { execSync } = require('child_process');
  const gitFiles = execSync('git ls-files public/idl/pir8_game.json', { encoding: 'utf8' });
  check(
    'IDL Tracked',
    gitFiles.trim().length > 0,
    'IDL file is not tracked by git (run: git add public/idl/pir8_game.json)',
    'IDL file is tracked by git'
  );
} catch (e) {
  check('IDL Tracked', false, 'Could not verify git tracking (not a git repo?)');
}

// Check 4: Environment variables
const envExample = path.join(process.cwd(), '.env.local.example');
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  const requiredVars = [
    { name: 'NEXT_PUBLIC_PROGRAM_ID', required: true },
    { name: 'NEXT_PUBLIC_RPC_URL', alternatives: ['NEXT_PUBLIC_HELIUS_RPC_URL'], required: true },
    { name: 'HELIUS_API_KEY', required: false }
  ];
  
  requiredVars.forEach(varConfig => {
    const varName = varConfig.name;
    const alternatives = varConfig.alternatives || [];
    const hasVar = envContent.includes(varName) || alternatives.some(alt => envContent.includes(alt));
    
    check(
      `Env: ${varName}`,
      hasVar,
      `${varName} not documented in .env.local.example`,
      `${varName} is documented${alternatives.length > 0 && !envContent.includes(varName) ? ` (via ${alternatives.find(alt => envContent.includes(alt))})` : ''}`
    );
  });
}

// Check 5: Package.json has sync script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
check(
  'Sync Script',
  packageJson.scripts && packageJson.scripts['anchor:sync-idl'],
  'anchor:sync-idl script not found in package.json',
  'anchor:sync-idl script is available'
);

// Check 6: Build artifacts don't exist (clean state)
const nextDir = path.join(process.cwd(), '.next');
check(
  'Clean Build',
  !fs.existsSync(nextDir),
  'Build artifacts exist (.next/). Run: npm run clean',
  'No build artifacts (clean state)'
);

// Summary
console.log('\n' + '='.repeat(50));
const passed = checks.filter(c => c.passed).length;
const total = checks.length;
console.log(`\n${passed}/${total} checks passed\n`);

if (hasErrors) {
  console.error('❌ Deployment verification failed. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('✅ All checks passed! Ready for deployment.\n');
  console.log('Next steps:');
  console.log('  1. npm run build');
  console.log('  2. Test locally: npm run start');
  console.log('  3. Deploy to production\n');
  process.exit(0);
}

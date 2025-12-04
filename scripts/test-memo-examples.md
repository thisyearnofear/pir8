# Zcash Memo Testing Examples

## Running the Zcash Memo Watcher Test

### Method 1: Using environment variable
```bash
export ZCASH_MEMO_TEST='{"v":"1","gameId":"pirate_7","action":"join","solanaPubkey":"4FzyJeDxqRn2SKwVLdh2gi9MCvrSvgkCvHDZnNyBpd5v","timestamp":1764855013000}'
npm run test:memo
```

### Method 2: Using command line argument
```bash
npx tsx tests/zcash-memo-watcher.ts --memo '{"v":"1","gameId":"pirate_7","action":"join","solanaPubkey":"4FzyJeDxqRn2SKwVLdh2gi9MCvrSvgkHDZnNyBpd5v","timestamp":1764855013000}'
```

## Running the CLI Memo Command

### Correct way (using single quotes to avoid shell escaping issues):
```bash
npm run cli -- memo --memo '{"v":"1","gameId":"pirate_7","action":"join","solanaPubkey":"4FzyJeDxqRn2SKwVLdh2gi9MCvrSvgkCvHDZnNyBpd5v","timestamp":1764855013000}'
```

### With dynamic timestamp:
```bash
npm run cli -- memo --memo "{\"v\":\"1\",\"gameId\":\"pirate_7\",\"action\":\"join\",\"solanaPubkey\":\"4FzyJeDxqRn2SKwVLdh2gi9MCvrSvgkCvHDZnNyBpd5v\",\"timestamp\":$(date +%s)000}"
```

## What Was Fixed

1. **CLI Error Handling**: Improved JSON parsing error messages with validation for required fields
2. **Test Script**: Added `npm run test:memo` script for running the Zcash memo watcher test directly
3. **Better Error Messages**: Added helpful examples when commands fail

## Common Issues and Solutions

### "Unrecognized CLI Parameter" when running Jest with --memo
- **Problem**: Jest doesn't recognize custom parameters
- **Solution**: Use `npm run test:memo` or set `ZCASH_MEMO_TEST` environment variable

### "invalid memo JSON" error
- **Problem**: Shell escaping issues with complex JSON
- **Solution**: Use single quotes around the JSON or escape properly with double quotes

### JSON parsing errors
- **Problem**: Malformed JSON structure
- **Solution**: Ensure the JSON contains required fields: `v`, `gameId`, `action`, `solanaPubkey`, `timestamp`
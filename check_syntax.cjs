const fs = require('fs');
const babel = require('@babel/core');

try {
  babel.parseSync(fs.readFileSync('src/main.tsx', 'utf8'), {
    filename: 'src/main.tsx',
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    plugins: ['@babel/plugin-syntax-jsx']
  });
  console.log('No syntax errors found by Babel!');
} catch (e) {
  console.error(e.message);
}

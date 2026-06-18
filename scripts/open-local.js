const { exec } = require('child_process');

const url = 'http://localhost:3333';

const command = process.platform === 'win32'
  ? `start ${url}`
  : process.platform === 'darwin'
    ? `open ${url}`
    : `xdg-open ${url}`;

exec(command, (error) => {
  if (error) {
    console.log(`Abra manualmente: ${url}`);
  }
});

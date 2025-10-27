const http = require('http');
const fs = require('fs').promises; 
const path = require('path');
const { program } = require('commander');
const superagent = require('superagent');

program
  .option('-h, --host <type>', 'Server host')
  .option('-p, --port <type>', 'Server port')
  .option('-c, --cache <type>', 'Cache folder path');

program.parse(process.argv);
const options = program.opts();
const cache_path = path.resolve(options.cache);

if (!options.host || !options.port || !options.cache) {
  console.error('Error : please specify the neccesary input parameters! (host, port and cache folder)');
  process.exit(1);
}

(async () => {
  try {
    await fs.mkdir(cache_path, { recursive: true });
    console.log('Cache folder directory', cache_path);
  } catch (err) {
    console.error('Error :', err.message);
    process.exit(1);
  }

const server = http.createServer(async (req, res) => {
});
server.listen(options.port, options.host, () => {console.log('Server started at http://'+options.host+':'+options.port);});
})();

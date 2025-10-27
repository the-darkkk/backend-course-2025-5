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

const httpCode = req.url.slice(1);
if (isNaN(httpCode) || httpCode.trim() === '') {
  res.writeHead(400); 
  res.end('Error : Invalid http code in request');
  return;
};

const filePath = path.join(cache_path, `${httpCode}.jpeg`);
try {
      switch (req.method) {
        case 'GET':
          try {
            const data = await fs.readFile(filePath);
            console.log('Sent from cache :', httpCode);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
          } catch (fileError) {
            if (fileError.code === 'ENOENT') {
              console.log('Not found in cache :', httpCode);
              try {
                const httpCatUrl = `https://http.cat/${httpCode}`;
                const response = await superagent.get(httpCatUrl).responseType('blob');
                
                await fs.writeFile(filePath, response.body);
                console.log('Saved to cache (from http.cat) :', httpCode);
                console.log('Sent from cache :', httpCode);
                
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(response.body);
              } catch (proxyError) {
                console.error('Error :', proxyError.message);
                res.writeHead(404);
                res.end('Not Found');
              } 
            } else {
              throw fileError; 
            }
          }
          break;

        case 'PUT':
          const body = [];
          req.on('data', (chunk) => body.push(chunk));
          req.on('end', async () => {
            try {
              const buffer = Buffer.concat(body);
              await fs.writeFile(filePath, buffer);
              console.log('Written to cache :', httpCode);
              res.writeHead(201);
              res.end('Created');
            } catch (writeError) {
              console.error('Error :', writeError.message);
              res.writeHead(500);
              res.end('Server Error');
            }
          });
          break;

        case 'DELETE':
          try {
            await fs.unlink(filePath);
            console.log('Deleted from cache :',httpCode);
            res.writeHead(200);
            res.end('OK');
          } catch (deleteError) {
            if (deleteError.code === 'ENOENT') {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              throw deleteError;
            }
          }
          break;

        default:
          res.writeHead(405);
          res.end('Method Not Allowed');
          break;
      }
    } catch (error) {
      console.error('Error :', error.message);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
});
server.listen(options.port, options.host, () => {console.log('Server started at http://'+options.host+':'+options.port);});
})();

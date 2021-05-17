import morgan from 'morgan';
import debug from 'debug';
import stream from 'stream';

const morganDebugStream = new stream.Writable({
  write(chunk, encoding, done) {
    // strip newlines (to avoid extra empty log items in the 'tiny' morgan protocol)
    const chunkData = chunk.toString().replace(/[\n\r]/g, '');

    if (chunkData.length > 0) {
      debug(chunkData);
    }
    done();
  },
});

const logger = morgan(
  'tiny',
  { stream: morganDebugStream },
);

export default logger;

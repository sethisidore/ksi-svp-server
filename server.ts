#!/usr/bin/env node

// set up environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';

if (process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: path.join(__dirname, `config/env/.env.${process.env.NODE_ENV}`) });
  } else {
    dotenv.config({ path: path.join(__dirname, 'config/env/.env') });
  }
}

/**
 * Module dependencies.
 */
import { app } from './app';
import debug from 'debug';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as mongoose from 'mongoose';

debug('polac:server');

class AppServer {
  port: number | string | boolean = false;
  server: http.Server | https.Server;

  constructor() {
    this.init();
  }

  init(): void {
    /**
    * Get port from environment and store in Express.
    */
    this.port = this.normalizePort(process.env.PORT || '3000');
    app.set('port', this.port);

    /**
     * Create HTTP server.
     *
    this.server = http.createServer(app);
    */
    // Create HTTPS server
    this.server = https.createServer({
      key: fs.readFileSync('./config/env/certs/server.key'),
      cert: fs.readFileSync('./config/env/certs/server.cert')
    }, app);

    /**
     * Listen on provided port, on all network interfaces.
     */
    this.server.listen(this.port);
    this.server.on('error', this.onError);
    this.server.on('listening', this.onListening.bind(this));
  }

  /**
  * Normalize a port into a number, string, or false.
  */
  private normalizePort(val: number|string): number|string|boolean {
    const port = (typeof val === 'string') ? parseInt(val, 10) : val;

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
  * Event listener for HTTP server "error" event.
  */
  private onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof this.port === 'string'
      ? 'Pipe ' + this.port
      : 'Port ' + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
  * Event listener for HTTP server "listening" event.
  */
  private onListening(): void {
    const addr = this.server.address();
    if (addr !== null) {
    const bind = (typeof addr === 'string')
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug(`Listening on  ${bind}`);
    }
  }

  watch() {
    /**
     * Watch for all process and gracefully shutdown
     */
    function gracefulShutdown(this: any, message: string, done: Function): void {
      this.server.close(() => {
        mongoose.connection.close(() => {
          console.log(`App shutdown at: ${message}`);
        });
        done();
      });
    }

    process.once('SIGUSR2', () => {
      gracefulShutdown('Nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
      });
    });

    process.on('SIGINT', () => {
      gracefulShutdown('Interruption', () => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      gracefulShutdown('App termination', () => {
        process.exit(0);
      });
    });
  }
}

export const server = new AppServer().server;

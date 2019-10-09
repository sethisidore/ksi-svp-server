import bluebird from 'bluebird';
import mongoose from 'mongoose';

import { logger } from '.';

export class Database {
  private instance: Database;

  MONGO_URI: string;
  constructor() {
    this.setup();
  }

  public getInstance() {
    if (!this.instance) {
      return this.instance = new Database;
    }
    return this.instance;
  }

  setup() {
    (<any>mongoose).Promise = bluebird;
    mongoose.set('debug', true);
    mongoose.set('runValidators', true);

    this.MONGO_URI = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  }

  start() {
    mongoose.connect(this.MONGO_URI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
      // pass: process.env.DB_PASS || '',
      // user: process.env.DB_USER || '',
    })
      .then(() => {
        logger.info('Connection to database successful');
      })
      .catch((err: any) => {
        logger.error(`error connecting to database: ${err}`);
        process.exit(1);
      });

    // CONNECTION EVENTS
    mongoose.connection.on('connected', () => {
      logger.info(`Mongoose connected to ${this.MONGO_URI}`);
    });
    mongoose.connection.on('error', (err: any) => {
      logger.error(`Mongoose connection error: ${err}`);
    });
    mongoose.connection.on('disconnected', (reason: any) => {
      logger.info(`Mongoose disconnected: ${reason}`);
    });
  }
}

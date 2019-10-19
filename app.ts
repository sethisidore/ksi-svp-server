import express from 'express';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import cors from 'cors';
import methodOverride from 'method-override';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { Application, Request, Response, NextFunction } from 'express';

import { asyncHandler, csrfHandler, Database, RouteHandler, logger } from './config';

class App {
  public app: Application;
  private database: Database;
  private connection: Database;
  private routes: RouteHandler;

  constructor() {
    this.app = express();

    this.database = new Database();
    this.middlewares();
    this.handlers();
    this.mongoSetup();
  }

  private handlers() {
    // Configure and Authenticate Route MiddleWare
    this.routes = new RouteHandler();
    this.routes.init(this.app, passport);

    // catch all favicon requests and ignore them
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if(req.originalUrl === '/favicon.ico') {
        res.status(204).json({ none: true });
      } else { next(); }
    });

    // catch 404 and forward to error handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const err = new Error('Not Found: Requested resource does not exist!!!');
      res.statusCode = 404;
      next(err);
    });
    // register handlers for Async Operations and XSRF
    this.app.use(asyncHandler);
    this.app.use(csrfHandler);

    // error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // log errors to log file
      logger.error(`${err.name || 500} - ${err.message} - ${req.originalUrl}
         - ${req.method} - ${req.ip}`);

      // render the error page
      res.status(500).json(err);
    });
  }

  private middlewares() {
    // log all request with successful response to stdout
    this.app.use(morgan('combined', {
      skip: (req: Request, res: Response) => {
        return res.statusCode < 400;
      }, stream: process.stderr
    }));
    // log all request with failed response to stderr
    this.app.use(morgan('combined', {
      skip: (req: Request, res: Response) => {
        return res.statusCode > 500;
      }, stream: process.stdout
    }));
    this.app.use(compression());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(csurf({ cookie: true }));
    /**
    * Ensure CSRF tokens is validated for all GET & POST request
    * */
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.cookie('XSRF-TOKEN', req.csrfToken(), {
        path: '/',
        httpOnly: false,
        sameSite: false,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        expires: new Date(Date.now() + 1000 * 3600 * 3),
      });
      next();
    });
    this.app.use(methodOverride());
    this.app.use(helmet({
      hidePoweredBy: { setTo: 'django 0.5.2' },
      hsts: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc:["'self'"],
          scriptSrc: ["'self'"]
        },
        browserSniff: false
      }
    }));
    this.app.use(hpp());
    this.app.use(cors({
      origin: ['localhost', 'http://localhost:8100']
    }));
    this.app.use(passport.initialize());
    // this.app.use(express.static(path.join(__dirname, '../../dist/polac')));
  }

  private mongoSetup() {
    this.connection = this.database.getInstance();
    this.connection.start();
  }
}

export const app = new App().app;

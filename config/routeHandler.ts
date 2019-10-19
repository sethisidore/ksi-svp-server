import { Request, Response, Application } from 'express';
import { PassportStatic } from 'passport';
// import * as path from 'path';

import { AdminRouter, AuthRouter, MonitoringRouter, VotingRouter } from '../components';

// import './passport-strategy';

export class RouteHandler {
  constructor() { }

  init(app: Application, passport: PassportStatic) {
    app.use('/api/admin', AdminRouter);
    app.use('/api/auth', AuthRouter);
    app.use('/api/monitor', /*passport.authenticate('validate', { session: false }),*/ MonitoringRouter);
    app.use('/api/voting', /*passport.authenticate('validate', { session: false }),*/ VotingRouter);

    app.use('/api/support', MonitoringRouter);
    app.use('/api/error', passport.authenticate('admin', { session: false }));
  }
}

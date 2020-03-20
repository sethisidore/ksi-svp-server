import { Router } from 'express';

import { asyncHandler } from '../../config'
import { MonitoringController } from './monitoring.controller';

class MonitoringAPI {
  router: Router;
  handler: MonitoringController;

  constructor () {
    this.router = Router();
    this.handler = new MonitoringController();
    this.init();
  }

  init () {
    this.router.get('/fg', asyncHandler(this.handler.fetchAndCollateToNationals));
    this.router.get('/zones', asyncHandler(this.handler.fetchAndCollateToPoliticalZones));
    this.router.get('states', asyncHandler(this.handler.fetchAndCollateToStates));
    this.router.get('lg', asyncHandler(this.handler.fetchAndCollateToLG))
  }
 }

export const MonitoringRouter = new MonitoringAPI().router;

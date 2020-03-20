import { Router } from 'express';

import { asyncHandler } from '../../config';
import { VotingController } from './voting.controller';

class VotingAPI {
  router: Router;
  handler: VotingController;

  constructor () {
    this.router = Router();
    this.handler = new VotingController();
    this.init();
  }

  init () {
    this.router.get('/', asyncHandler(this.handler.availableElections));
    this.router.get('/request', asyncHandler(this.handler.prepareBallot));
    this.router.post('/vote', asyncHandler(this.handler.castBallot));
    this.router.post('/verify', asyncHandler(this.handler.verifyAndRecordBallot));
  }
}

export const VotingRouter = new VotingAPI().router;

import { Router } from "express";
// import passport from 'passport';

import { asyncHandler, multerUploader } from "../../config";
import { AdminController } from "./admin.controller";

class AdminAPI {
  router: Router;
  handler: AdminController;

  constructor() {
    this.router = Router();
    this.handler = new AdminController();
    this.init();
  }

  init() {
    this.router.post('/login', asyncHandler(this.handler.adminLogin));
    this.router.get('/logout', asyncHandler(this.handler.adminLogout));

    this.router.get('/parties', /*passport.authenticate('admin', { session: false }),*/ asyncHandler(this.handler.fetchAllParties));
    this.router.get('/parties/:id', /*passport.authenticate('admin', { session: false }),*/ asyncHandler(this.handler.fetchParty));
    this.router.delete('/parties/:id', /* passport.authenticate('admin', { session: false }),*/
      asyncHandler(this.handler.removePartyFromAllList));
    this.router.post('/parties', /*passport.authenticate('admin', { session: false }),*/ multerUploader.single('logo'),
      asyncHandler(this.handler.addParty));
    this.router.post('/schedule', /*passport.authenticate('admin', { session: false }),*/ asyncHandler(this.handler.scheduleElections));
    this.router.get('/users', /*passport.authenticate('admin', { session: false }),*/ asyncHandler(this.handler.getUsers));
  }
}

export const AdminRouter = new AdminAPI().router;

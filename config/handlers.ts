import { Request, Response, NextFunction } from 'express';
import multer = require('multer');

export const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const csrfHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') { return next(err); }
  return res.status(403).json('Form tampered with');
};

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    return cb(null, file.originalname);
  }
});

export const multerUploader = multer({
  storage: storage,
  limits: { fileSize: 2000000 },
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    return sanitizeImage(file, cb);
  }
});

const sanitizeImage = (file: Express.Multer.File, cb: Function) => {
  let fileExt = ['gif','jpg', 'jpeg', 'png', 'svg'];

  let isAllowedExt = fileExt.includes(file.originalname.split('.')[1].toLowerCase());
  let isAllowedMimeType = file.mimetype.startsWith('image/');
  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true);
  }
  return cb('File type not Allowed', false);
}

import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine, Instance } from 'multer'; 

export const asyncHandler = (fn: (req: Request, res: Response, next?: NextFunction) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const csrfHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') { return next(err); }
  return res.status(403).json('Form has been tampered with');
};

const storage: StorageEngine = multer.diskStorage({
  destination: './uploads',
  filename: (req: Request, file: Express.Multer.File, done: Function) => {
    return done(null, file.originalname);
  }
});

export const multerUploader: Instance = multer({
  storage: storage,
  limits: { fileSize: 2000000 },
  fileFilter: (req: Request, file: Express.Multer.File, done: Function) => {
    return sanitizeImage(file, done);
  }
});

const sanitizeImage = (file: Express.Multer.File, done: Function) => {
  let fileExt = ['gif','jpg', 'jpeg', 'png', 'svg'];

  let isAllowedExt = fileExt.includes(file.originalname.split('.')[1].toLowerCase());
  let isAllowedMimeType = file.mimetype.startsWith('image/');
  if (isAllowedExt && isAllowedMimeType) {
    return done(null, true);
  }
  return done('File type not Allowed', false);
}

import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { format } from 'date-fns';
const allowedFileTypes = ['.txt'];

// returns list of files saved
export const multerConfig = {
  storage: diskStorage({
    destination: './src/files/uploads',
    filename: (req, file, callback) => {
      const timestamp = Date.now();
      const formattedTime = format(timestamp, 'dd-MM-Y:HH:mm:ss');
      const AI_ID = req.query.ai_id
      const uniqueSuffix = formattedTime + '-' + AI_ID + '-' + Math.round(Math.random() * 1e9);
      callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
    },
  }),


  fileFilter: (req, file, callback) => {
    const ext = extname(file.originalname);
    if (!allowedFileTypes.includes(ext)){
      return callback(new BadRequestException('Invalid file type'), false);
    }
    callback(null, true);
  },

};

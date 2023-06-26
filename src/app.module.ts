import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PineconeModule } from './pinecone/pinecone.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './helpers/multer.config';
// import { PineconeinitService } from './services/pineconeinit/pineconeinit.service';

@Module({
  imports: [PineconeModule ,
    MulterModule.register(multerConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

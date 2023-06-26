import { Module } from '@nestjs/common';
import { PineconeController } from './controller/pinecone.controller';
import { PineconeService } from './services/pinecone.service';
// import { PineconeInit } from './services/pineconeinit.service';
// import { PineconeinitService } from './services/pineconeinit/pineconeinit.service';
// import { PineconeinitService } from './services/pineconeinit.service';
// import { PineconeinitService } from './services/pineconeinit.service';

@Module({
  controllers: [PineconeController],
  providers: [PineconeService ]
})
export class PineconeModule {}

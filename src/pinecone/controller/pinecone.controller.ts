import { BadRequestException, Controller, Delete, Get, Param, Post, Query, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PineconeService } from '../services/pinecone.service';
import * as fs from 'fs/promises';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/helpers/multer.config';
import { Request } from 'express';


@Controller('api/knowledge/')
export class PineconeController {
  constructor(private readonly pineconeService: PineconeService) { }


  // api endpoint to upload file and store in pinecone
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Query('ai_id') ai_id: any, @Req() req: Request){
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const uploadedFileNames = files.map((file) => file.filename);
    return await this.pineconeService.createvectorstore(uploadedFileNames, ai_id);
  }


  // api endpoint to retrive data from query
  @Get('/retrieve')
  async getVectors(@Query('ai_id') ai_id: any, @Query('query') query: any) {
    return await this.pineconeService.getVectors(query, ai_id);
  }


  // api endpoint to get list of all documents 
  @Get()
  async listDocuments(@Query('ai_id') ai_id: any) {
    return await this.pineconeService.listDocuments(ai_id);
  }


  // api endpoint to delete document 
  @Delete()
  async deleteVectors(@Query('ai_id') ai_id: any, @Query('document_id') document_id: any) {
    return await this.pineconeService.deleteVectors(document_id, ai_id);
  }

}

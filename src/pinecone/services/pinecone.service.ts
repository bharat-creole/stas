import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import * as dotenv from 'dotenv';
dotenv.config();
const { PineconeClient } = require("@pinecone-database/pinecone");
import { Container, CosmosClient } from "@azure/cosmos";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { upsert, queryfetch, chunkArticlesf, pinecone } from 'src/helpers/pinecone';
import { createEmbedding } from 'src/helpers/openAI';
import { createCosmosDB } from 'src/helpers/azure';




@Injectable()
export class PineconeService {

  // create vector store and save to pinecone
  async createvectorstore(fileArrays: string[], ai_id: string) {

    // save file metadata to azure CosmosDB 
    try {
      const cosmosDB = createCosmosDB();
      const aiId = ai_id;
      for (const fileName of fileArrays) {
        await cosmosDB.saveFile(aiId, fileName);
        console.log(`File saved: ${fileName}`);
      }
    } catch (error) {
      console.error('Error:', error);
      return error
    }


    for (let i = 0; i < fileArrays.length; i++) {
      const file = await fs.readFileSync(`./src/files/uploads/${fileArrays[i]}`, { encoding: 'utf-8' });
      const filename = fileArrays[i];
      const chunkedArticles = await chunkArticlesf(file);
      for (let i = 0; i < chunkedArticles.length; i++) {
        const embedding = await createEmbedding(chunkedArticles[i].content);
        const result = await upsert({
          content: chunkedArticles[i].content,
          content_tokens: chunkedArticles[i].content_tokens,
          filenames: filename,
          embedding,
          ai_id
        });
      }
    }
    return "file successfully stored to vector Database ..."
  }


  // returns data based on query
  async getVectors(query: string, ai_id: string) {
    const q = query;
    const embedding = await createEmbedding(q);
    const { data, error } = await queryfetch(embedding, ai_id);

    if (error) {
      console.log(error);
      return `${q} doesn't match any search`;
      //res.status(404).send({ message: `${q} doesn't match any search` });
    } else {
      const filter_data = data.matches
      const filteredData = filter_data.map(obj => {
        return {
          knowledge: obj.metadata.content,
          file: obj.metadata.file,
          score: ((obj.score) * 100).toFixed(2) + '%',
        };
      });
      return filteredData
    }

  }


  // returns list of documents in ai memory
  async listDocuments(ai_id: string) {
    try {
      const cosmosDB = createCosmosDB();
      const aiId = ai_id;
      const files = await cosmosDB.getFilesForAI(aiId);
      const fileNames = files.map(file => file.file_name);
      console.log('File Names:', fileNames);
      return fileNames
    } catch (error) {
      console.error('Error:', error);
    }

  }


  // deletes document from ai memory
  async deleteVectors(document_id: string, ai_id: string) {
    try {
      const cosmosDB = createCosmosDB();
      const aiId = ai_id;
      const fileNameToDelete = document_id;
      const files = await cosmosDB.getFilesForAI(aiId);
      const fileToDelete = files.find(file => file.file_name === fileNameToDelete);

      if (fileToDelete) {
        await cosmosDB.deleteFile(aiId, fileToDelete.file_name);
        console.log(`File deleted: ${fileToDelete.file_name}`);
      } else {
        console.log(`File not found: ${fileNameToDelete}`);
      }
      // Retrieve files again to verify deletion
      const updatedFiles = await cosmosDB.getFilesForAI(aiId);
      console.log('Updated Files:', updatedFiles);

      //  ****delete operation from pinecone
      const index = pinecone.Index(process.env.INDEX_NAME);
      const result = await index._delete({
        deleteRequest: {
          filter: {
            file: document_id
          },
          namespace: ai_id
        }
      });
      // console.log(result);
      return `document - ${document_id} removed successfully...`
    } catch (error) {
        return error
    }
  }
}

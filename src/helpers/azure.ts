import {Container, CosmosClient} from "@azure/cosmos";

type FileData = {
    _self: string;
    id: string;
    ai_id: string
    file_name: string
}

export class CosmosAIMemory {
  

    aiMemoryContainer: Container;

    constructor(
        aiMemoryContainer: Container,
    ) {
        this.aiMemoryContainer = aiMemoryContainer;
    }

    async deleteFile(ai_id: string, file_name: string): Promise<void> {
        const querySpec = {
            query: `
                SELECT * FROM c WHERE c.ai_id = @ai_id AND c.file_name = @file_name
                `,
            parameters: [
                { name: "@ai_id", value: ai_id },
                { name: "@file_name", value: file_name }
            ]
        };
    
        const { resources: files } = await this.aiMemoryContainer.items.query<FileData>(querySpec).fetchAll();
        if (files.length > 0) {
            const file = files[0];
           console.log(file.id);
           
            await this.aiMemoryContainer.item(file.id, file.ai_id).delete();
            console.log(`File deleted: ${file.file_name}`);
        } else {
            console.log(`File not found: ${file_name}`);
        }
    }
    


    async getFilesForAI(ai_a: string): Promise<FileData[]> {
        const querySpec = {
            query: `
                SELECT * FROM c WHERE c.ai_id = @ai_id
                `,
            parameters: [
                { name: "@ai_id", value: ai_a }
            ]
        };

        const { resources: files } = await this.aiMemoryContainer.items.query<FileData>(querySpec).fetchAll();
        return files
    }


    async saveFile(ai_id: string, file_name: string,): Promise<void> {
        await this.aiMemoryContainer.items.create({
            file_name: file_name,
            ai_id: ai_id,
        });
    }
}


const getAzureDBConnectionString = () => {
    return process.env.AZURE_KEY_ENDPOINT
}

export const createCosmosDB = () => {
    const connectionString = getAzureDBConnectionString()
    if (!connectionString)
        throw new Error('No Azure DB connection string provided')

    const client = new CosmosClient(
        connectionString
    );

    const database = client.database('default');

    return new CosmosAIMemory(
        database.container('ai_memory'),
    );
};

const main = async () => {
    const cosmosDB = createCosmosDB();

    await cosmosDB.saveFile("ai_name", "filename_here" + new Date().getTime());

    const files = await cosmosDB.getFilesForAI("ai_name");

    console.log(files)
}

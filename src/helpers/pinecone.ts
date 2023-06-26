const { PineconeClient } = require("@pinecone-database/pinecone");
const uuid = require('uuid').v4; 
const { encode } = require('gpt-3-encoder');
const fs = require('fs');
const CHUNK_LIMIT = 200;
const CHUNK_MINIMAL = 100;


export const pinecone = new PineconeClient();
pinecone.init({
  environment: process.env.PINECONE_ENV,
  apiKey: process.env.PINECONE_API_KEY,
});


// upload vectors to pinecone
export const upsert = async (data) => {
    const index = pinecone.Index(process.env.INDEX_NAME);
    const { content, content_tokens, embedding, ai_id , filenames } = data;
    const upsertRequest = {
        vectors: [
            {
                id: uuid(),
                values: embedding,
                metadata: {
                    content,
                    content_tokens,
                    file : filenames
                }
            }
        ],
        namespace : ai_id 
    }
    try {
        const upsertResponse = await index.upsert({ upsertRequest });
        return upsertResponse;
    }catch(err) {
        console.log(err);
        return {}
    }
   
};


// return data from given query
export const queryfetch = async (embed,ai_id) => {
    const index = pinecone.Index(process.env.INDEX_NAME);
    const queryRequest = {
        vector: embed,
        topK: 3,
        includeValues: false,
        includeMetadata: true,
        namespace: ai_id
    }
    try {
        const response = await index.query({ queryRequest })
        return { data: response }
    }catch(err) {
        return { error: err }
    }
    
}

// make data chunks for vector embeddings 
export const chunkArticlesf = (article) => {
    let articleTextChunks = [];

    if (encode(article).length > CHUNK_LIMIT) {
        const split = article.split(".");
        let chunkText = "";

        for (let i = 0; i < split.length; i++) {
            const sentence = split[i];
            const sentenceTokenLength = encode(sentence);
            const chunkTextTokenLength = encode(chunkText).length;

            if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_LIMIT) {
                articleTextChunks.push(chunkText);
                chunkText = "";
            }

            if (sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
                chunkText += sentence + ". ";
            } else {
                chunkText += sentence + " ";
            }
        }

        articleTextChunks.push(chunkText.trim());
    } else {
        articleTextChunks.push(article.trim());
    }

    const articleChunks = articleTextChunks.map((text) => {
        const trimmedText = text.trim();

        const chunk = {
            content: trimmedText,
            content_length: trimmedText.length,
            content_tokens: encode(trimmedText).length,

            embedding: []
        };

        return chunk;
    });

    if (articleChunks.length > 1) {
        for (let i = 0; i < articleChunks.length; i++) {
            const chunk = articleChunks[i];
            const prevChunk = articleChunks[i - 1];

            if (chunk.content_tokens < CHUNK_MINIMAL && prevChunk) {
                prevChunk.content += " " + chunk.content;
                prevChunk.content_length += chunk.content_length;
                prevChunk.content_tokens += chunk.content_tokens;
                articleChunks.splice(i, 1);
                i--;
            }
        }
    }

    const chunkedSection = [
        ...articleChunks
    ];

    return chunkedSection;
};






import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";



const systemPrompt=`
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.`



export async function POST(req){
    const data = await req.json()
    // console.log("data",data) working

    const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const generation_model= genai.getGenerativeModel({model:"gemini-1.5-flash"}) 
    const embedding_model= genai.getGenerativeModel({model: "text-embedding-004"}) 

    const pc= new Pinecone({apiKey:process.env.PINECONE_API_KEY})
    const index= pc.index('rmp-assistant').namespace('ns1')
    // console.log("index",index) working 
    const last= data[data.length -1]
    // console.log("last",last) working 
    const text=  last.content;
    // console.log("last content text",text) working 
    const response = await embedding_model.embedContent(text)
    // console.log("response", response) working 
    const embedding= response.embedding
    // console.log("embedding", embedding) working 
// Ensure embedding.values is an array of numbers
const vector = embedding.values.map(value => parseFloat(value));
// console.log("vector",vector)  working 

    const results= await index.query({
        topK:5,
        includeMetadata:true,
        vector:vector
    })

    let resultString=''
    results.matches.forEach((match)=>{
        // console.log(match)
        resultString+=`
        Returned Results:
        Professor: ${match.id}
        Review:${match.metadata.stars}
        Subject:${match.metadata.subject}
        Stars:${match.metadata.stars}
        \n\n
        `
    })

    // prepare the gemini api request
    const lastMessage = data[data.length-1]
    // console.log("last message", lastMessage)
    const lastMessageContent= lastMessage.content + resultString

    // console.log("got the content from the last message", lastMessageContent)

    const lastDataWithoutLastMessage= data.slice(0,data.length-1)

    // send request to gemini api
    let promptMessage= `System: ${systemPrompt}\n`
    lastDataWithoutLastMessage.forEach(message=>{
        promptMessage+=`${ message.role.charAt(0).toUpperCase() + message.role.slice(1)} :${message.content} \n`
    })
    promptMessage+= ` User: ${lastMessageContent}`

    const completion = await generation_model.generateContentStream(promptMessage)
    // console.log("completion",completion)

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion.stream){
                    // console.log("chunk",chunk) working 
                    const content=chunk.candidates[0]?.content.parts[0]?.text
                    // console.log("content",content) working 
                    if (content){
                        const text= encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch(err){
                controller.error(err)
            }
        }
    })

    console.log("stream",stream)

    return new NextResponse(stream)




}
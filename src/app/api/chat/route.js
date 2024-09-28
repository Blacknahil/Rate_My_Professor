import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";



const systemPrompt=`
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.`



export async function POST(req){
    const data = await req.json()
    const genai = new GoogleGenerativeAI(process.env.API_KEY);

    const pc= new Pinecone({apiKey:process.env.PINECONE_API_KEY})
    const index= pc.index('rmp-assistant').namespace('ns1')

    const text= data[data.length-1].context
    const response = genai.embed_content(
        content=text,
        model="models/text-embedding-004",
    )
    const embedding= response["embedding"]
    embedding.values.map(value=>parseFloat(value))

    const results= await index.query({
        topK:5,
        includeMetadata:true,
        vector:embedding
    })

    let resultString=''
    results.matches.forEach((match)=>{
        console.log(match)
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
    const lastMessageContent= lastMessage.content + resultString

    const lastDataWithoutLastMessage= data.slice(0,data.length-1)

    // send request to gemini api
    const promptMessage= `System: ${systemPrompt}\n`
    lastDataWithoutLastMessage.forEach(message=>{
        promptMessage+=`${ message.role.charAt(0).toUpperCase() + message.role.slice(1)} :${message.content} \n`
    })
    promptMessage+= ` User: ${lastMessageContent}`

    const completion = await model.generateContentStream(promptMessage)

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                    const content=chunk.choices[0]?.delta?.content
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

    return NextResponse(stream)




}
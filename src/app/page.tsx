'use client'
import { Box,Button,Stack,TextField } from "@mui/material"
import { useState } from "react"

export default function Home(){

  const [messages,setMessages] = useState([{
    role:"assistant",
    content:`Hi! I'm the Rate My Professor support assistant. How can I help you today?`
  }])
  const [message,setMessage]= useState('')




  const sendMessage= async() =>{

    setMessage('')
    setMessages((messages)=>[
      ...messages,
      {role:'user', content:message},
      {role:'assistant',content:''}
    ])

    const response = await fetch('api/chat',{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify([...messages,{role:'user',content:message}])

    }).then(async (res)=>{
      console.log(messages)
      const decoder= new TextDecoder()
      if (res.body){
        const reader= res.body.getReader()
        const  result=''

        return reader.read().then(function processText({done, value}):Promise<string> {
          if (done) {
            return Promise.resolve(result)
          }
          const text = decoder.decode(value || new Uint8Array(), {stream: true})
          console.log("text",text)
          setMessages((messages) => {
            const  lastMessage = messages[messages.length - 1]
            const  otherMessages = messages.slice(0, messages.length - 1)
            return [
              ...otherMessages,
              {...lastMessage, content: lastMessage.content + text},
            ]
          })
          return reader.read().then(processText)
        })
    
  }
})
  }


  return (
    <Box
    width="100vw"
    height="100vh"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    >
      <Stack
            direction={'column'}
            width="500px"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
      >

        <Stack 
        direction={'column'}
        spacing={2}
        flexGrow={1}
        overflow='auto'
        maxHeight='100%'
        >
        {messages.map((message,index)=>(
          <Box key={index} display="flex" 
          justifyContent={ message.role=="assistant" ? 'flex-start':'flex-end'}>
            <Box bgcolor={ message.role=="assistant" ? 'primary.main': 'secondary.main'}
            p={2}
            
            >{message.content}</Box>

          </Box>
        ))}
        </Stack>
        <Stack>
          <TextField
          label="Message"
          fullWidth 
          value={message}
          onChange={(e)=>{setMessage(e.target.value)}}
           />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  )

}
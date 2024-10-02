from dotenv import load_dotenv
load_dotenv()
from pinecone import Pinecone, ServerlessSpec,PineconeApiException
import google.generativeai as genai

import os
import json

load_dotenv(dotenv_path='../.env.local')
# intialize pinecone and gemini api
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
pc=Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# creat the pinecone index
try:
    index = pc.Index("rmp-assistant")
except PineconeApiException as e:
    print(f"Error during index creation: {e}")
    exit()

# Connect to the index
print("Setup completed successfully")

# laod the review data
data= json.load(open('./reviews.json'))

processed_data=[]
# response = model.generate_content("Write a story about a magic backpack.")
for review in data["reviews"]:
    response=genai.embed_content(
        content=review['review'],
        model="models/text-embedding-004"
    )
    # print("response",response)
    print("embedding length", len(response["embedding"]))
    embedding= response["embedding"]
    processed_data.append(
        {
            "values":embedding,
            "id":review["professor"],
            "metadata":{
                "review": review["review"],
                "subject":review["subject"],
                "stars":review["stars"]
            }
        }
    )

# print("processed data",processed_data)
#insert the embedding into the pinocone index
try:
    upsert_response=index.upsert(
        vectors=processed_data,
        namespace='ns1'
    )
    print(f"Upserted count: {upsert_response['upserted_count']}")
except PineconeApiException as e:
    print(f"Error during upsert: {e}")
    exit()


print("working")
print(index.describe_index_stats())

#! /bin/bash

#set up python environment if not already installed 

if ! command -v python3 &> /dev/null

then 

    echo "Python3 can not be found, installing Python3"
    sudo apt-get update 
    sudo apt-get install python3

fi

# step2 : install python dependecies from the requirement.txt file
pip3 install -r rmp_assistant_python/requirements.txt

#step 3 run your python setup script
python3 rmp_assistant_python/setup_rag.py

# step 4: build the next.js 
npm run build
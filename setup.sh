#!/bin/bash

sudo apt install nodejs npm 
sudo apt install python3 
sudo apt install python3-pip

git clone https://github.com/lint12/refinedELLEWebPortal.git templates
cd templates
npm install
npm run build

cd ..
pip3 install -r requirements.txt

read -p 'MYSQL DATABASE USER: ' ev1
read -p 'MYSQL DATABASE PASSWORD: ' ev2
read -p 'MYSQL DATABASE NAME: ' ev3
read -p 'MYSQL DATABASE HOST: ' ev4
read -p 'ENTER A SECRET KEY: ' ev5

echo "export MYSQL_DATABASE_USER="\"$ev1\" >> /etc/environment
echo "export MYSQL_DATABASE_PASSWORD="\"$ev2\" >> /etc/environment
echo "export MYSQL_DATABASE_DB="\"$ev3\" >> /etc/environment
echo "export MYSQL_DATABASE_HOST="\"$ev4\" >> /etc/environment
echo "export SECRET_KEY="\"$ev5\" >> /etc/environment

source /etc/environment

python3 __init__.py
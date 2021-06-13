# Project Status
In development
# Blackjack
A blackjack game to gamble cryptocurrencies and learn about blockchain development
## Deployment Instructions
```
npm install
npm run build
sudo docker build -t <<IMAGE_DEV>/<IMAGE_NAME>> .
sudo docker run -p 3011:3011 -d --name <CONTAINER_NAME> <<IMAGE_DEV>/<IMAGE_NAME>>
```
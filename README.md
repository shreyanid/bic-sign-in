# Sign In System

## Requirements
- [NodeJS](https://nodejs.org/en/download/)
- MongoDB Atlas (the chosen database backend for this project)

## Setup
```javascript
npm install
```

## Setup MongoDB Atlas
1. Create a cluster
2. Create an admin user
3. Conncet To Cluster > Connect Your Application > Node.js Version 3.0 or Later
4. Copy "Connection String Only"
5. Paste into config.JSON
```javascript
{
  "mongodbURL": ""
}
```
6. Add in your user password to the URL
7. Security > Network Access > Add IP Address > Allow Access From Anywhere

## Run App:
```javascript
node app.js
```

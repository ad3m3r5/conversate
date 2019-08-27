# conversate
Conversate is a web-based chat application running on NodeJS. It has real-time text communication for as many users as desired. It allows users to create custom chat channels with the option for a channel password. The admin account also has the ability to delete channels. If you couldn't tell, I'm not a UI developer.

## Why?
I use discord a lot, and many of my friends do as well. I thought it would be cool to create a chat application for basic use. This is the core of what that idea encompassed.

## Getting Started

 1. Clone the repository
 2. Install necessary packages

>  npm install

 4. Edit MongoDB (database) configuration in config/database.js
 5. Edit Redis (session) configuration in config/session.js
 6. Start both MongoDB and Redis
 7. Create the necessary database and collections for MongoDB
 8. Run the application

>  node server.js

 9. Register the "admin" account before opening the application to others

## Tech/Software Used

 - [NodeJS](https://nodejs.org/en/)
 - [MongoDB](https://www.mongodb.com/)
 - [Redis](https://redis.io/)
 - [Atom](https://atom.io/)

Main Packages Used

 - [ExpressJS](https://expressjs.com/)
 - [EJS](https://ejs.co/)
 - [Passport](http://www.passportjs.org/)
 - [Socket.IO](https://socket.io/)
 - [Mongoose](https://mongoosejs.com/)
 - [Morgan](https://github.com/expressjs/morgan)
 - [Async](https://github.com/caolan/async)

## Screenshots
Login Page
![Login Page](https://user-images.githubusercontent.com/11009228/63736486-3f373680-c851-11e9-9c89-eb234d60f11d.PNG)
Channel List
![Channel List](https://user-images.githubusercontent.com/11009228/63736492-43fbea80-c851-11e9-8f28-b38e149f9b15.PNG)
Channel Page
![Channel Page](https://user-images.githubusercontent.com/11009228/63736506-4c542580-c851-11e9-886f-62266013bb6f.PNG)
Profile Page
![Profile Page](https://user-images.githubusercontent.com/11009228/63736498-478f7180-c851-11e9-8844-1dcdaf1cd7fd.PNG)

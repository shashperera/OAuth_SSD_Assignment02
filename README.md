# SSD_Assignment02

Instructions to follow

1) cd OAuth_SSD_Assignment02
2) npm i express env-cmd
3) credentials.json file should be downloaded when creating the OAuth client ID
4) Create a config folder in the root directory,and create "dev.env" file inside. 
   Include CLIENT_ID=created google api client id, 
   CLIENT_SECRET=receieved google client secret,
   REFRESH_TOKEN=OAuth 2.0 Playground refresh token
5) npm run dev
6) View the event created from console and calendar and the email is sent to the attendees.

### Folder Structure
```
.
    ├── config                   # Configuration files 
    │   ├── dev.env          
    ├── src   
    │   ├── public               
    │       ├── css 
    │           ├── app.css      #css files
    │       ├── views            # Views
    │           ├── events.html   
    │           ├── index.html
    │   ├── app.js 
    ├── credentials.json
    ├── package.json
    └── README.md                #guidelines

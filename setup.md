# Chihwa Rentals setup

## Backend setup

### STEP 1

- Firstly you go to pgAdmin, create a new database (chihwa_rentals).
- Go to the table_schemas.sql and copy it
- Go to pgAdmin and the database you created, right click the tables - then say query tools, paste the code there and execute the script.
- Now go to LETS_SEE.sql, copy the contents, clear the query and past it there and execute it.
- Now everything is fine, the password to all accounts is Wekeza2004#, change it to whatever you want.
- If you wanna view the data in the tables, go to that table, right click and then View/Edit data and then all rows.

### STEP 2

- Now you have everything in the database set up, go to the files in the backend folder and go to the database.js and .env files change the password of postgres to be the password of your postgress.
- Now perfect the backend should work, if it doesn't work then `npm install`.
- Now the backend is good to go, goodluck😉.
- open a terminal and cd to backend and then `npm run dev`.

## Frondend Set

- Here everything should be fine I don't see any problem, just `npm run dev` and if it doesn't work that then just `npm install`. 

### Mobile setup

- This one is kinda tricky, mostly depends on what type of network you use.
- The keypoint is in the `utils/api.js`.
- There you change the api url to whatever you want to use, which should be `http://IPADDRESS:4000`.
- I use ngrok and so similarly you can create an account on ngrok and create whatever you need to create (chatGPT can help with this one, I am not AI guys😓).
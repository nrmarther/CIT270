const express = require('express'); //import the express library
const https = require('https');
const fs = require('fs');
const port = 443; 
const app = express(); //using express library to get application module
const md5 = require('md5');
const bodyparser = require('body-parser'); //import body-parser
const {createClient} = require('redis');
const redisClient  = createClient(
{
    url: 'redis://default@10.128.0.4:6379',
}
); //creates connection to redis client


app.use(bodyparser.json()); //use the middleware (call it before anything else happens on each request)

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
    passphrase: 'P@ssw0rd'
}, app).listen(port, async() => {
    console.log('Listening on port: '+port)
    await redisClient.connect();
    console.log('successfully connected to redis server');
})


//validate password function
const validatePassword = async(request,response) => {
    //await redisClient.connect();
    const requestHashedPassword = md5(request.body.password); //hashes password given by user and stores in variable
    const redisHashedPassword = await redisClient.hmGet('passwords', request.body.userName); //reads 'passwords' from redis server
    const loginRequest = request.body
    console.log("Request Body", JSON.stringify(loginRequest));
    //search database for username and retrieve current password

    //compare hashed version of password with what we have stored on database
    if(loginRequest.userName == "nathan@martherus.com" && requestHashedPassword == redisHashedPassword){
        response.status(200); //200 means OK
        response.send("Welcome");
    } else {
        response.status(401); //401 means Unauthorized
        response.send("Unauthorized: Invalid userName or password");
    }
}

const savePassword = async (request, response)=>{
    const clearTextPassword = request.body.password; //browser gives CLEAR TEXT password
    const hashedTextPassword = md5(clearTextPassword); //hash the password given by browser
    await redisClient.hSet('passwords',request.body.userName, hashedTextPassword); //save the password in redis database
    response.status(200); //200 means OK
    response.send({result:"Saved"});
}


app.get('/',(request,response)=>{
    response.send("hello")
});



redisClient.on('connected', function(){
    console.log('connected');
})

app.post('/signup', savePassword);
app.post('/login',validatePassword);


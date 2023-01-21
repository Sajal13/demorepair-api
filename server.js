require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose')

const { logEvents,logger } = require('./middleware/loggers');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const credentials = require('./middleware/credentials');

const PORT = process.env.PORT || 3500;

connectDB();

app.use(logger);

app.use(credentials);

app.use(cors(corsOptions));

app.use(express.json());

app.use(cookieParser());

app.use('/', express.static(
    path.join(__dirname, 'public')
    )
);

app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/notes',require('./routes/notesRoutes'));

app.all('*', (req, res)=>{
    res.status(404);
    if(req.accepts('html')){
       res.sendFile(path.join(__dirname, 'views', '404.html')) 
    } else if(req.accepts('json')){
        res.json({ message : 'Page does not found' })
    }else{
        res.type('txt').send('404 Not Found')
    }
});

app.use(errorHandler);

mongoose.connection.once('open', ()=>{
    console.log('Connected to mongoDB');
    app.listen(PORT, ()=>{
        console.log(`Server running on port ${PORT}`)
    });
});

mongoose.connection.on('error', err =>{
    console.log(err);
    logEvents(
        `${err.no}: ${err.code}\t${err.syscall}${err.hostname}`,
        'mongoErrorLog.log'
    )
})

//main entry point for the app

const express = require('express')
const app = express()
const env = require('dotenv').config()
const port = process.env.port || 8888;
const server = app.listen(port)
const io = require('socket.io').listen(server)
const request = require('request')
const moment = require('moment')


app.use(express.static(__dirname + "/public"))

//five mins in ms
const FIVE_MINS = 300000
//info for basic auth
const NEXUDUS_USERNAME = process.env.NEXUDUS_USERNAME
const NEXUDUS_PASSWORD = process.env.NEXUDUS_PASSWORD
const now = moment().format("YYYY-M-DD")
const oneMonth = moment().add(1, 'month').format("YYYY-M-DD")

const nexudusApiRequestOpts = {
    method: 'GET',
    url: 'https://spaces.nexudus.com/api/content/calendarevents',
    'Content-Type': 'application/jsonp',
    qs: 
    { 
        page: '1',
        size: '50',
        orderBy: 'StartDate',
        dir: 'Descending',
        From_CalendarEvent_StartDate: now,
        To_CalendarEvent_EndDate: oneMonth,
        CalendarEvent_Business: '377677363'
    }
}
let calDataUpdatedAt
let events = []

//initially get calendar events
getEvents()
//get calendar events every 5 mins
setInterval(getEvents, FIVE_MINS)


//setup express endpoint
app.get('/', (req, res) => {
    res.render('public/index')
    sendData(events)
    res.end()
})

//cal api endpoint
app.get('/events', (req, res) => {
    if (events.length != 0) {
        const parentObj = {}
        parentObj.requestedAt = new Date().toISOString()
        parentObj.calDataUpdatedAt = calDataUpdatedAt
        parentObj.numberOfEvents = events.length
        parentObj.events = events
        res.json(parentObj)
        res.end()
    } else {
        res.status(500).send("Calendar data not ready yet")
    }
})


//detect socket connection
io.on('connection', (socket) => {
    console.log('Client connected to server...')
    socket.emit('connection', {
        'connected': true
    })
    sendData(events)
})

function sendData(eventsArray) {
    if (events.length != 0) {
        io.emit('calendarData', eventsArray)
    }
}

function getEvents() {
    // download cal data
    getEventsFromNexudusApi()
        .then((data) => {
            events.size = 0
            events = data.Records
        })
        .catch((e) => {
            throw "Error while getting api data " + e
        })
}

function getEventsFromNexudusApi() {
    return new Promise((resolve, reject) => {
        request(`https://${NEXUDUS_USERNAME}:${NEXUDUS_PASSWORD}@spaces.nexudus.com/api/content/calendarevents`, nexudusApiRequestOpts, (err, res, body) => {
            if (err) {
                return reject(err)
            }
            try {
                calDataUpdatedAt = new Date().toISOString()
                return resolve(JSON.parse(body))
            }
            catch (e) {
               return reject(e)
            }
        })
    })
}

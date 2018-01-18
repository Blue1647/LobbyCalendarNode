//main entry point for the app

const express = require('express')
const app = express()
const port = process.env.port || 8888;
const server = app.listen(port)
const io = require('socket.io').listen(server)
const request = require('request')
const ical = require('ical')
const moment = require('moment')


app.use(express.static(__dirname + "/public"))

const iCalUrl = "http://bluelacuna.spaces.nexudus.com/en/feeds/bookings?bid=1395e812-662f-4108-a1c7-174aa232f7bd"
let events = []

downloadiCalData()


//get calendar events from ical file
function downloadiCalData() {
    console.log("Downlading iCal data...")
    const currDate = moment()
    ical.fromURL(iCalUrl, {}, (err, data) => {
        if (err) throw err
        //data returned is an array of events
        for (let k in data) {
            const ev = data[k]
            const evDate = moment(ev.start)
            if (data.hasOwnProperty(k)) {
                //parse through event objects and insert into the events array and filter out events more than a day old
                if (currDate.diff(evDate, 'days') <= 1) {
                    console.log(`Inserting ${evDate}`);
                    events.push(ev)
                }
            }
        }
        //initially send calendar events to client
        sendCalData(events)


        //send calendar events to client every minute
        setInterval(() => {
            sendCalData(events)
        }, 60000)
    })
}

//setup express endpoint
app.get('/', (req, res) => {
    res.render('public/index')
    res.end()
})



io.on('connection', (socket) => {
    console.log('Client connected to server...')
    socket.emit('connection', {
        'connected': true
    })
    if (events.length != 0) {
        sendCalData(events)
    }
})

function sendCalData(eventsArray) {
    io.emit('calendarData', eventsArray)
}
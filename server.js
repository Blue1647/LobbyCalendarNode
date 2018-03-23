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
const googleCalUrl = "https://www.googleapis.com/calendar/v3/calendars/oifj0r6ik0s58t7vm457irf0lk@group.calendar.google.com/events?key=AIzaSyCG4-gSYXFsIp_R7p1e7yuzQ64xgTKwhcU&singleEvents=true&orderBy=startTime&maxResults=20&timeMin=" + new Date().toJSON()
let events = []

downloadiCalData()
downloadGoogleCalData()

//get calendar events from ical file
function downloadiCalData() {
    const currDate = moment()
    ical.fromURL(iCalUrl, {}, (err, data) => {
        if (err) throw err
        let counter = 0
        //data returned is an array of events
        for (let k in data) {
            const ev = data[k]
            const evDate = moment(ev.start)
            if (data.hasOwnProperty(k)) {
                //parse through event objects and insert into the events array and filter out events more than a day old
                if (moment().diff(evDate, 'days', true) > 0 || counter >= 15) {
                    //move on to the next item in array
                    continue
                } else {
                    events.push(ev)
                }
            }
            counter++
        }
        //initially send calendar events to client
        sendCalData(events)
    })
    //send calendar events to client every minute
    setInterval(() => {
        sendCalData(events)
    }, 60000)
}

function downloadGoogleCalData() {
    request({
        url: googleCalUrl,
        json: true
    }, (err, res, body) => {
        if (err) throw err
        //reduce the amount of google cal events
        let sliced = body.items.slice(0, 5)
        for (let k in sliced) {
            //parse through event objects and insert into the events array and filter out events more than a day old; this should never happen, google always returns fresh data
            // if (moment().diff(sliced[k].start.dateTime, 'days', true)) {
            //     //move on to the next item in array
            //     continue
            // } else {
            //     events.push(normalizeEventObj(sliced[k]))
            // }
            events.push(normalizeEventObj(sliced[k]))
        }
    })
}

//setup express endpoint
app.get('/', (req, res) => {
    res.render('public/index')
    res.end()
})


//detect socket connection
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

//google calendar's JSON response is a little different than the ical response from up top, so recreating all the JSON objects to match
function normalizeEventObj(event) {
    let eventObj = {}
    eventObj.description = event.summary
    eventObj.start = event.start.dateTime
    eventObj.end = event.end.dateTime
    return eventObj
}
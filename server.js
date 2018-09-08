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

//five mins in ms
const FIVE_MINS = 300000
const iCalUrl = "http://bluelacuna.spaces.nexudus.com/en/feeds/events"
const googleCalUrl = "https://www.googleapis.com/calendar/v3/calendars/oifj0r6ik0s58t7vm457irf0lk@group.calendar.google.com/events?key=AIzaSyCG4-gSYXFsIp_R7p1e7yuzQ64xgTKwhcU&singleEvents=true&orderBy=startTime&maxResults=20&timeMin=" + new Date().toJSON()
let icalEvents = 0,
    googleCalEvents = 0,
    icalDataUpdatedAt, googleCalDataUpdatedAt
let events = []



//initially get calendar events
getEvents()
//get calendar events every 5 mins
setInterval(getEvents, FIVE_MINS)


//setup express endpoint
app.get('/', (req, res) => {
    res.render('public/index')
    sendCalData(events)
    res.end()
})

//ical api endpoint
app.get('/events', (req, res) => {
    if (events.length != 0) {
        const parentObj = {}
        parentObj.requestedAt = new Date().toISOString()
        parentObj.icalEvents = icalEvents
        parentObj.googleCalEvents = googleCalEvents
        parentObj.icalDataUpdatedAt = icalDataUpdatedAt
        parentObj.googleCalDataUpdatedAt = googleCalDataUpdatedAt
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
    sendCalData(events)
})

function sendCalData(eventsArray) {
    if (events.length != 0) {
        io.emit('calendarData', eventsArray)
    }
}

//gcal's JSON response is a little different than the ical response from up top, so recreating all the JSON objects to match
function normalizeEventObj(event) {
    let eventObj = {}
    eventObj.title = event.summary
    eventObj.start = event.start.dateTime
    eventObj.end = event.end.dateTime
    eventObj.source = "google"
    return eventObj
}

function getEvents() {
    //clear current array 
    events.size = 0
    //download ical data
    getiCalFromUrlAsync(iCalUrl)
        .then((data) => {
            for (d in data) {
                events.push(data[d])
            }
            sendCalData(events)
        })
        .catch((e) => {
            throw "Error while getting ical data " + e
        })
}

function getiCalFromUrlAsync(url) {
    return new Promise((resolve, reject) => {
        ical.fromURL(url, {}, (err, data) => {
            if (err) return reject(err)
            let counter = 0,
                icalEventsArr = []
            //data returned is an array of events
            for (let k in data) {
                const ev = data[k]
                const evDate = moment(ev.start)
                icalDataUpdatedAt = new Date().toISOString()
                if (data.hasOwnProperty(k)) {
                    //parse through event objects and insert into the events array and filter out events more than a day old
                    if (moment().diff(evDate, 'days', true) > 0 || counter >= 15) {
                        //move on to the next item in array
                        continue
                    } else {
                        ev.title = ev.summary
                        ev.source = "ical"
                        icalEventsArr.push(ev)
                        icalEvents++
                    }
                }
                counter++
            }
            return resolve(icalEventsArr)
        })
    })
}

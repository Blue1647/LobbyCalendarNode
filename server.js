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




// getEvents()
// //get calendar events every 5 mins
// setInterval(getEvents, FIVE_MINS)

dblProm()

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
            icalDataUpdatedAt = new Date().toISOString()
            if (data.hasOwnProperty(k)) {
                //parse through event objects and insert into the events array and filter out events more than a day old
                if (moment().diff(evDate, 'days', true) > 0 || counter >= 15) {
                    //move on to the next item in array
                    continue
                } else {
                    ev.title = ev.summary
                    ev.source = "ical"
                    events.push(ev)
                    icalEvents++
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
        googleCalDataUpdatedAt = new Date().toISOString()
        for (let k in sliced) {
            for (let e in events) {
                console.log(events[e])
                if (normalizeEventObj(sliced[k]).title === events[e].title) {
                    //if the event is a duplicate, don't add it to the array
                    console.log('same');
                    continue
                } else if (e <= sliced.length) {
                    console.log(sliced.length)
                }
            }
            googleCalEvents++
        }
    })
}

//setup express endpoint
app.get('/', (req, res) => {
    res.render('public/index')
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
    if (events.length != 0) {
        sendCalData(events)
    }
})

function sendCalData(eventsArray) {
    io.emit('calendarData', eventsArray)
}

//gcal's JSON response is a little different than the ical response from up top, so recreating all the JSON objects to match
function normalizeEventObj(event, dupe) {
    let eventObj = {}
    eventObj.title = event.summary
    eventObj.start = event.start.dateTime
    eventObj.end = event.end.dateTime
    eventObj.source = "google"
    eventObj.dupe = dupe || false
    return eventObj
}

function getEvents() {
    //clear events array
    events.size = 0
    //download calendar data
    downloadiCalData()
    downloadGoogleCalData()
}

function removeDupes(events) {
    return Array.from(new Set(events))
}

function dblProm() {
    getiCalFromUrlAsync(iCalUrl)
        .then(data => {
            for (k in data) {
                events.push(data[k])
            }
            getGoogleCalDataAsync(googleCalUrl)
                .then(data => {
                    for (k in data) {
                        events.push(data[k])
                    }
                })
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

function getGoogleCalDataAsync(url) {
    return new Promise((resolve, reject) => {
        request({
            url: url,
            json: true
        }, (err, res, body) => {
            let googleCalEventsArr = [], indexesToRemove = [], gCalev = []
            if (err) return reject(err)
            //reduce the amount of google cal events
            let sliced = body.items.slice(0, 5)
            googleCalDataUpdatedAt = new Date().toISOString()
            for (let k in sliced) {
                const event = normalizeEventObj(sliced[k])
                for(let e in events) {
                    if (e <= k && event.title === events[e].title) {
                        indexesToRemove.push(k)
                        googleCalEventsArr.push(normalizeEventObj(sliced[k], true))
                        // return resolve(googleCalEventsArr)
                    }
                }
                googleCalEventsArr.push(event)
                googleCalEvents++
            }
            for(let i = googleCalEventsArr.length - 1; i >= 0; i--) {
                googleCalEventsArr.splice(indexesToRemove[i], 1)
            } 
            return resolve(googleCalEventsArr)
        })
    })
}
//main entry point for the app

const express = require('express')
const app = express()
const port = process.env.port || 8888;
const server = app.listen(port)
const io = require('socket.io').listen(server)
const request = require('request')
const ical = require('ical')
const moment = require('moment')
const businessHours = require('./businessHours.json')


app.use(express.static(__dirname + "/public"))

//five mins in ms
const FIVE_MINS = 300000
const iCalUrl = "http://bluelacuna.spaces.nexudus.com/en/feeds/events"
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
    sendData(events)
    res.end()
})
//business hours endpoint
app.get('/hours', (req, res) => {
    res.json(businessHours)
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
    sendData(events)
})

function sendData(eventsArray) {
    if (events.length != 0) {
        io.emit('calendarData', eventsArray)
    }
}
//are we open for business?
function isOpen() {
    let now = moment()
    let day = now.format('dddd').toLocaleLowerCase()
    let open, close
    switch (day) {
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
            open = moment(businessHours.open.weekday.from, ['hh:m a'])
            close = moment(businessHours.open.weekday.to, ['hh:m a'])
        case 'saturday':
            open = moment(businessHours.open.saturday.from, ['hh:m a'])
            close = moment(businessHours.open.saturday.to, ['hh:m a'])
            break
        default:
            return false
    }
    if (now.isBetween(open,close) || now.isSame(open)) {
        return true
    }
    else {
        return false
    }
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
            sendData(events)
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
                    if (moment().diff(evDate, 'days', true) > 1 || counter >= 15) {
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

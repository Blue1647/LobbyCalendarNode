const socket = io.connect()
socket.on('connection', (data) => {
    console.log("Connected to server")
})
socket.on('calendarData', eventsArray => {
    //clear previous data
    document.getElementById('calendar-data-table-today').innerHTML = ""
    document.getElementById('calendar-data-table-next').innerHTML = ""

    //sort the events array by date (earliest to latest event)
    eventsArray.sort((date1, date2) => {
        return new Date(date1.start) - new Date(date2.start)
    })

    //remove dupulicate events from array
    let dups = []
    let dupLess = eventsArray.filter((e) => {
        if(dups.indexOf(e.title) == -1) {
            dups.push(e.title)
            return true
        }
        return false
    })
    
    let todayEvents = 0
    //loop through array and enter in new data
    for (let e in dupLess) {
        const ev = dupLess[e]
        const todayDateDay = new Date().getDate()
        const todayDateMonth = new Date().getMonth()
        const eventDateDay = new Date(ev.start).getDate()
        const eventDateMonth = new Date(ev.start).getMonth()
        if ((todayDateDay == eventDateDay) && (todayDateMonth == eventDateMonth)) {
            insertIntoTodayTable(ev)
            todayEvents++
        } else {
            insertIntoNextTable(ev)
        }
    }
    //hide the today table if there aren't any events today
    if (todayEvents == 0) {
        document.querySelector('.today').style.display = 'none'
    }
})

function insertIntoTodayTable(ev) {
    const evTitle = ev.title || ev.summary
    const evDate = ev.start
    const evEnd = ev.end
    const evTime = moment(evDate).format('hh:mm A') + " - " + moment(evEnd).format('hh:mm A')
    const evDateFormatted = moment(evDate).format('MMMM DD')
    //enter in new data
    document.getElementById('calendar-data-table-today').innerHTML += "<tr class=\"table-info\"><td>" + evTitle +
        "</td>" + "<td>" + evDateFormatted +
        "</td>" + "<td>" + evTime +
        "</td></tr>"
}

function insertIntoNextTable(ev) {
    const evTitle = ev.title || ev.summary
    const evDate = ev.start
    const evEnd = ev.end
    const evTime = moment(evDate).format('hh:mm A') + " - " + moment(evEnd).format('hh:mm A')
    const evDateFormatted = moment(evDate).format('MMMM DD')
    //enter in new data
    document.getElementById('calendar-data-table-next').innerHTML += "<tr class=\"table-success\"><td>" + evTitle +
        "</td>" + "<td>" + evDateFormatted +
        "</td>" + "<td>" + evTime +
        "</td></tr>"
}

function clock() {
    var date = moment().format('dddd, MMMM DD, YYYY')
    var time = moment().format('hh:mm A')
    var dateField = document.getElementById('date')
    var timeField = document.getElementById('time')
    dateField.innerHTML = date
    timeField.innerHTML = time
}


function removeDupeEvs(events) {
    let indexesToRemove = []
    for (evOuter in events) {
        let currentEvTitle = events[evOuter]
        for (evInner in events) {
            if ((events[evInner].title == events[evOuter].title) && (events[evInner].source != events[evOuter].source)) {
                console.log(JSON.stringify(events[evInner]) + " \n has same title as \n " + JSON.stringify(events[evOuter]))
                console.log('Inner: ' + evInner)
                console.log('Outer: ' + evOuter)
                indexesToRemove.push(evOuter)
            }
        }
    }
    removeIndexesFromArray(events, indexesToRemove)
    console.log('Events array after removal: ')
    console.log(events)
    
}

function removeIndexesFromArray(events, indexes) {
    for (let i = indexes.length - 1; i >= 0; i--)
        events.splice(indexes[i], 1)
}

window.addEventListener('load', () => {
    clock()
    setInterval(clock, 1000)
})
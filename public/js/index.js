const socket = io.connect()
socket.on('connection', () => {
    console.log("Connected to server")
})

socket.on('calendarData', eventsArray => {
    //clear previous data
    document.getElementById('calendar-data-table-today').innerHTML = ""
    document.getElementById('calendar-data-table-next').innerHTML = ""

    //total number of events to show on the table
    const numOfEvs = 5

    //sort the events array by date (earliest to latest event)
    eventsArray.sort((date1, date2) => {
        return new Date(date1.StartDate) - new Date(date2.StartDate)
    })
    showUpNextTable()
    let todayEvents = 0
    //loop through array and enter in new data
    for (let e in eventsArray) {
        const ev = eventsArray[e]
        const localTime = moment(ev.StartDate).local()
        const todayDateDay = new Date().getDate()
        const todayDateMonth = new Date().getMonth()
        const eventDateDay = localTime.date()
        const eventDateMonth = localTime.month()
        if (e < numOfEvs) {
            // if date is today, insert into today table
            if ((todayDateDay == eventDateDay) && (todayDateMonth == eventDateMonth)) {
                showTodayTable()
                insertIntoTodayTable(ev)
                todayEvents++
            }
            //if date is in the past, skip it
            else if ((todayDateMonth == eventDateMonth) && (eventDateDay < todayDateDay)) {
                continue
            }
            // if date is in the future, insert into up next table
            else {
                insertIntoNextTable(ev)
            }
        }
        //skip putting the event into the table if it has reached the max number of events
        else {
            return
        }
    }
    //hide the today table if there aren't any events today
    if (todayEvents == 0) {
        hideTodayTable()
    }
})
function insertIntoTodayTable(ev) {
    const evTitle = ev.Name
    const evDate = ev.StartDate
    const evEnd = ev.EndDate
    const evTime = moment(evDate).format('hh:mm A') + " - " + moment(evEnd).format('hh:mm A')
    const evDateFormatted = moment(evDate).format('ddd, MMM DD')
    //enter in new data
    document.getElementById('calendar-data-table-today').innerHTML += "<tr class=\"table-info\"><td>" + evTitle +
        "</td>" + "<td>" + evDateFormatted +
        "</td>" + "<td>" + evTime +
        "</td></tr>"
}

function insertIntoNextTable(ev) {
    const evTitle = ev.Name
    const evDate = ev.StartDate
    const evEnd = ev.EndDate
    const evTime = moment(evDate).format('hh:mm A') + " - " + moment(evEnd).format('hh:mm A')
    const evDateFormatted = moment(evDate).format('ddd, MMM DD')
    //enter in new data
    document.getElementById('calendar-data-table-next').innerHTML += "<tr class=\"table-success\"><td>" + evTitle +
        "</td>" + "<td>" + evDateFormatted +
        "</td>" + "<td>" + evTime +
        "</td></tr>"
}

function clock() {
    let date = moment().format('dddd, MMMM DD, YYYY')
    let time = moment().format('hh:mm A')
    let dateField = document.getElementById('date')
    let timeField = document.getElementById('time')
    dateField.innerHTML = date
    timeField.innerHTML = time
}

function showTodayTable() {
    document.querySelector('.today').style.display = 'inline'
}

function showUpNextTable() {
    document.querySelector('.up-next').style.display = 'block'
}

function hideTodayTable() {
    document.querySelector('.today').style.display = 'none'
}

function hideUpNextTable() {
    document.querySelector('.up-next').style.display = 'none'
}

window.addEventListener('load', () => {
    clock()
    setInterval(clock, 1000)
})

socket.on('refresh', () => {
    window.location.reload()
    console.log('got reload signal')
})
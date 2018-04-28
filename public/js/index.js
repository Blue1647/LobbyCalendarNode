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
    });

    let todayEvents = 0
    //loop through array and enter in new data
    for (let e in eventsArray) {
        const ev = eventsArray[e]
        const todayDateDay = new Date().getDate()
        const eventDateDay = new Date(ev.start).getDate()
        if (todayDateDay == eventDateDay) {
            insertIntoTodayTable(ev)
            todayEvents++
        }
        else {
            insertIntoNextTable(ev)
        }
    }
    //hide the today table if there aren't any events today
    if (todayEvents == 0) {
        document.querySelector('.today').style.display= 'none'
    }
})

function insertIntoTodayTable(ev) {
    const evTitle = ev.description || ev.summary
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
    const evTitle = ev.description || ev.summary
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
};

window.addEventListener('load', () => {
    clock()
    setInterval(clock, 1000)
});
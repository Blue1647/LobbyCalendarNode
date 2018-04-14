const socket = io.connect()
socket.on('connection', (data) => {
    console.log("Connected to server")
})
socket.on('calendarData', eventsArray => {
    //clear previous data
    document.getElementById('calendar-data-table-today').innerHTML = ""
    document.getElementById('calendar-data-table-next').innerHTML = ""
    //loop through array and enter in new data
    for (let e in eventsArray) {
        const ev = eventsArray[e]
        const todayDateDay = new Date().getDate()
        const eventDateDay = new Date(ev.start).getDate()
        if (todayDateDay == eventDateDay) { //dateDiff is between 2 and -2 if event is today
            insertIntoTodayTable(ev)
        } 
        else {
            insertIntoNextTable(ev)
        }
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
    var date = moment().format("dddd, MMMM d, YYYY")
    var time = moment().format("hh:mm A")
    var dateField = document.getElementById('date')
    var timeField = document.getElementById('time')
    dateField.innerHTML = date
    timeField.innerHTML = time
};

window.addEventListener('load', () => {
    clock()
    setInterval(clock, 1000)
});
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
        //get date difference between now and event's date
        const dateDiff = moment().diff(ev.start, 'days', true)
        if (dateDiff < 0 && dateDiff > -1) {
            insertIntoTodayTable(ev)
        } else {
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
function runFunction() {
    var date = moment().format("dddd, MMMM d, YYYY");
    var time = moment().format("hh:mm A");
    var dateField = document.getElementById('date');
    var timeField = document.getElementById('time');
    dateField.innerHTML = date;
    timeField.innerHTML = time;
};

window.addEventListener('load', () => {
    runFunction();    
});
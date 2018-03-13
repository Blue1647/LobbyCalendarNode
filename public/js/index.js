const socket = io.connect()
socket.on('connection', (data) => {
    console.log("Connected to server")
})
socket.on('calendarData', eventsArray => {

    //clear previous data
    document.getElementById('calendar-data-table').innerHTML = ""
    for (let e in eventsArray) {
        const ev = eventsArray[e]
        const evTitle = ev.description
        const evDate = ev.start
        const evEnd = ev.end
        const evTime = moment(evDate).format('hh:mm A') + " - " + moment(evEnd).format('hh:mm A')
        console.log(evTime)
        const evDateFormatted = moment(evDate).format('MMMM DD')

        //enter in new data
        document.getElementById('calendar-data-table').innerHTML += "<tr><td>" + evTitle +
            "</td>" + "<td>" + evDateFormatted +
            "</td>" + "<td>" + evTime +
            "</td></tr>"
    }
})
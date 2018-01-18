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
        const evDateFormatted = moment(evDate).format("MMMM MM, YYYY")

        //enter in new data
        document.getElementById('calendar-data-table').innerHTML += "<tr><td>" + evTitle +
            " </td><td>" + evDateFormatted +
            "</td></tr>"
    }
})
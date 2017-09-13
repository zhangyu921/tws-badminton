module.exports.Ground = class Ground {
  constructor (name) {
    this.name = name
    this.bookingLog = []
    this.order = {}
    this.cancelledOrder = {}
  }

  getBookingCode (code) {
    if (code.isCancel) {
      this.makeCancel(code)
    } else {
      this.makeOrder(code)
    }
    this.bookingLog.push(code)
  }

  isExistingBooking (startTime, duration) {
    const date = startTime.format('YYYY-MM-DD')
    const startHour = startTime.hour()
    if (!this.order[date]) {
      this.order[date] = []
      return false
    }
    for (let i = 0; i < duration; i++) {
      if (this.order[date][startHour + i]) {return true}
    }
    return false
  }

  makeOrder (code) {
    const {startTime, endTime} = code
    const date = startTime.format('YYYY-MM-DD')
    const duration = endTime.diff(startTime, 'hour')
    if (this.isExistingBooking(startTime, duration)) {
      throw new Error('the booking conflicts with existing bookings! ')
    }
    for (let i = 0; i < duration; i++) {
      this.order[date][startTime.hour() + i] = code
    }
  }

  makeCancel (code) {
    const {startTime, endTime} = code
    const startHour = startTime.hour()
    const date = startTime.format('YYYY-MM-DD')
    const oldCode = this.order[date] && this.order[date][startHour]
    if (
      oldCode
      && oldCode.userId === code.userId
      && oldCode.date === code.date
      && oldCode.time === code.time
    ) {
      const duration = endTime.diff(startTime, 'hour')
      for (let i = 0; i < duration; i++) {
        this.order[date][startHour + i] = null
      }
      if (!this.cancelledOrder[date]) {this.cancelledOrder[date] = []}
      this.cancelledOrder[date].push(code)
    } else {
      throw new Error('the booking being cancelled does not exist!')
    }
  }

  getOrder () {
    return this.order
  }

  getTable () {
    let line = ''
    let priceCount = 0
    for (const key of Object.getOwnPropertyNames(this.order)) {
      for (let i = 0; i < this.order[key].length;) {
        if (!this.order[key][i]) {
          i += 1
        } else {
          const {date, time, startTime, endTime} = this.order[key][i]
          const duration = endTime.diff(startTime, 'hour')
          const price = getBookingPrice(this.order[key][i])
          line += `\n${date} ${time} ${price}元`
          priceCount += price
          i += duration
        }
      }
    }
    for (const key of Object.getOwnPropertyNames(this.cancelledOrder)) {
      for (let i = 0; i < this.cancelledOrder[key].length; i++) {
        const {date, time} = this.cancelledOrder[key][i]
        const price = getBookingPrice(this.cancelledOrder[key][i])
        priceCount += price
        line += `\n${date} ${time} 违约金 ${price}元`
      }
    }
    return {
      log: `场地：${this.name}${line}\n小计：${priceCount}元\n`,
      price: priceCount
    }

  }
}

function getPriceMidweek (startHour, isCancel) {
  let price
  if (startHour >= 9 && startHour < 12) {price = 30}
  else if (startHour >= 12 && startHour < 18) {price = 50}
  else if (startHour >= 18 && startHour < 20) {price = 80}
  else if (startHour >= 20 && startHour < 22) {price = 60}
  else {throw new Error('Invalid Hour')}
  return isCancel ? price / 2 : price
}

function getPriceWeekend (startHour, isCancel) {
  let price
  if (startHour >= 9 && startHour < 12) {price = 40}
  else if (startHour >= 12 && startHour < 18) {price = 50}
  else if (startHour >= 18 && startHour < 20) {price = 60}
  else if (startHour >= 20 && startHour < 22) {price = 60}
  else {throw new Error('Invalid Hour')}
  return isCancel ? price / 4 : price
}

function getBookingPrice (code) {
  const {startTime, endTime, isCancel} = code
  const isWeekend = startTime.day() === 0 || startTime.day() === 6
  let duration = endTime.diff(startTime, 'hour')
  let startHour = startTime.hour()
  let price = 0
  for (let i = 0; i < duration; i++) {
    price += isWeekend
      ? getPriceWeekend(startHour + i, isCancel)
      : getPriceMidweek(startHour + i, isCancel)
  }
  return price
}

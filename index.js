const moment = require('moment')
const readline = require('readline')
const rl = readline.createInterface({input: process.stdin, output: process.stdout})
const Ground = require('./ground').Ground

const GroundName = ['A', 'B', 'C', 'D']
const GroundMap = {}
for (const item of GroundName) {
  GroundMap[item] = new Ground(item)
}

;(async () => {
  rl.on('line', line => {
    switch (line) {
      case '':
        let logs = ''
        let priceCount = 0
        for (const key of Object.getOwnPropertyNames(GroundMap)) {
          let groundTable = GroundMap[key].getTable()
          logs += '\n' + groundTable.log
          priceCount += groundTable.price
        }
        console.log(`
收入汇总
---
${logs}
---
总计：${priceCount}
        `)
        break
      default :
        try {
          const code = booking2Code(line)
          GroundMap[code.place].getBookingCode(code)
          console.log('Success: the booking is accepted')
        }
        catch (e) {
          console.log(e.message)
        }
    }
  })
})()

/**
 * 效验并生成Code，以方便在对象中处理
 * @param str
 * @returns {{userId: *, date: *, time: *, startTime: (*|moment.Moment), endTime: (*|moment.Moment), place: *, isCancel: boolean}}
 */
function booking2Code (str) {
  if (typeof str !== 'string') {throw new Error('the booking is invalid')}
  let codeArr = str.trim().split(' ')
  if (codeArr.length !== 4 && codeArr.length !== 5) {throw new Error('the booking is invalid')}

  let userId = codeArr[0],
    date = codeArr[1],
    time = codeArr[2],
    timeArr = codeArr[2].split('~'),
    startTime = moment(codeArr[1] + ' ' + timeArr[0]),
    endTime = moment(codeArr[1] + ' ' + timeArr[1]),
    place = codeArr[3],
    isCancel = false

  if (endTime.diff(startTime, 'hour') < 1) {throw new Error('the booking is invalid')}
  if (
    startTime.minute() !== 0
    || endTime.minute() !== 0
    || startTime.seconds() !== 0
    || endTime.seconds() !== 0
  ) {throw new Error('the booking is invalid')}

  if (GroundName.indexOf(place) === -1) {throw new Error('Invalid Ground')}
  if (codeArr.length === 5) {
    if (codeArr[4] === 'C') {
      isCancel = true
    } else {
      throw new Error('Invalid cansel flag')
    }
  }
  return {
    userId,
    date,
    time,
    startTime,
    endTime,
    place,
    isCancel,
  }
}
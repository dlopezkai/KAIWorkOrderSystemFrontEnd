export function convertToDate(rawDateTime, origin) {
    let result = ""
    const convertedRawDateTime = Number(rawDateTime)
  
    const date = new Date(convertedRawDateTime)
    const year = date.getFullYear()
    const month = ("0" + (date.getMonth() + 1)).slice(-2)
    const day = ("0" + date.getDate()).slice(-2)
    const hours = ("0" + date.getHours()).slice(-2)
    const minutes = ("0" + date.getMinutes()).slice(-2)
  
    if (origin === "form") {
      result = year + "-" + month + "-" + day + 'T' + hours + ":" + minutes
    } else if (origin === "table") {
      result = year + "-" + month + "-" + day
    }
    
    return result
}

export function dateToISOStr(value) {
  return new Date(value).toISOString().substring(0,10)
}

export function hoursToMilliseconds(value) {
  return value * 60 * 60 * 1000
}

export function hoursToMinutes(value) {
  return value * 60
}

export function minutesToHours(value) {
  return value / 60
}
export default function getLastReadFormat(dateTime = null) {
  if (!dateTime) {
    dateTime = new Date();
  }

  let year = dateTime.getFullYear();
  let month = dateTime.getUTCMonth() + 1;
  let date = dateTime.getUTCDate();
  let hours = dateTime.getUTCHours();
  let minutes = dateTime.getUTCMinutes();
  let seconds = dateTime.getUTCSeconds();
  let milliseconds = dateTime.getUTCMilliseconds();

  if (month < 10) {
    month = `0${month}`;
  }

  if (hours < 10) {
    hours = `0${hours}`;
  }

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliseconds}000`;
};
require("dotenv").config();
require("cross-fetch/polyfill");
const {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMinutes,
} = require("date-fns");

const { logout, login, checkDakaDay, getSession } = require("./daka.js");

const IMMEDIATE_DAKA = process.env.IMMEDIATE_DAKA || false;
const DELAY_START_MINS = process.env.DELAY_START_MINS || 5;
const DELAY_END_MINS = process.env.DELAY_END_MINS || 15;
const MAX_RETRY_COUNT = process.env.MAX_RETRY_COUNT || 3;

const getCSTDate = (date) =>
  subMinutes(
    date,
    date.getTimezoneOffset() !== 0
      ? date.getTimezoneOffset()
      : CST_TIMEZONE_OFFSET
  );

const UTC_TODAY = new Date();
const TODAY = getCSTDate(UTC_TODAY);
const HOUR = TODAY.getUTCHours();

const getRandomMinute = (min, max) => {
  const minMinute = min * 60;
  const maxMinute = max * 60;
  return Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute;
};

let retryCount = 0;

const delay = () => {
  const delay =
    HOUR >= 12
      ? getRandomMinute(DELAY_START_MINS, DELAY_END_MINS)
      : getRandomMinute(0, DELAY_START_MINS);

  console.log(`daka delay ${delay / 60} mins`);

  return new Promise((resolve) => {
    setTimeout(resolve, delay * 1000);
  });
};

const main = async () => {
  console.log("===== start =====");

  if (!IMMEDIATE_DAKA && !retryCount) await delay();

  let session = "";

  try {
    getSessionResponse = await getSession();
    session = getSessionResponse.session;

    const { ClockRecordUserId, AttRecordUserId } = await login({ session });

    const isDakaDay = await checkDakaDay();

    if (isDakaDay) {
      await daka({ session, ClockRecordUserId, AttRecordUserId });
    }
    retryCount = 0;
  } catch (e) {
    console.log("Error:", e);

    if (retryCount < MAX_RETRY_COUNT) {
      console.log("Some error happen, retry in 3 secs");
      retryCount += 1;
      await logout({ session });
      setTimeout(main, 3000);
    }
  }
  logout({ session });
  console.log("===== end =====");
};

main();

var pollIntervalMin = 1000 * 60;       // 1 minute
var pollIntervalMax = 1000 * 60 * 60;  // 1 hour
var requestFailureCount = 0;           // used for exponential backoff

function init() {
  chrome.browserAction.setIcon({path: "/images/icon_on.png"});
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.url && isSynapUrl(changeInfo.url)) {
    	updateTweetCount(getMrtTs());
    }
  });
  startRequest();
}

function isSynapUrl(url) {
  var synapUrl = "http://intra1.synap.co.kr";
  if (url.indexOf(synapUrl) != 0)
    return false;
  return true;
}

function updateTweetCount(ts) {
  var req = new XMLHttpRequest();
  req.open("GET", "http://intra1.synap.co.kr/season2/tweet/index.ss?blahblah=&recentTimestamp="+ts, true);
  req.onload = function () {
    try {
      updateUnreadCount(JSON.parse(req.responseText).msgList.length);
    } catch (x) {
      requestFailureCount++;
      showLoggedOut();
    }
  };
  req.send(null);
}

function updateUnreadCount(cnt) {
  chrome.browserAction.setIcon({path: "/images/icon_on.png"});
  chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
  chrome.browserAction.setBadgeText({text: ((cnt==0)?"":cnt+"")});
}

function showLoggedOut() {
  chrome.browserAction.setIcon({path: "/images/icon_off.png"});
  chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
  chrome.browserAction.setBadgeText({text:"?"});
}

function scheduleRequest() {
  var randomness = Math.random() * 2;
  var exponent = Math.pow(2, requestFailureCount);
  var delay = Math.min(randomness * pollIntervalMin * exponent, pollIntervalMax);
  window.setTimeout(startRequest, Math.round(delay));
}

function getMrtTs() {
  var mrtTs = localStorage["mrtTs"];
  if (!mrtTs) {
    mrtTs = new Date().getTime();
    localStorage["mrtTs"] = mrtTs;
  }
  return mrtTs;
}

function startRequest() {
  updateTweetCount(getMrtTs());
  scheduleRequest();
}

init();

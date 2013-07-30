(function() {
  var tweetFormatStr =
        '<div class="outerbox" id="{0}">'
        + '<img class="icon" src="{1}">'
        + '<div class="msgbox">'
          + '<div class="header">'
            + '<span class="userId">{2}</span>'
            + '&nbsp;'
            + '<span class="name">{3}</span>'
            + '&nbsp;'
            + '<a class="deleteLink" userId={2} href="#" onclick="deleteTweet({0})">'
              + '<img class="trashcan" src="http://intra1.synap.co.kr/season2/images/trashcan_icon.gif" alt="delete"/>'
            + '</a>'
          + '</div>'
        + '<div class="msg">{4}</div>'
        + '<div class="time">{5}</div>'
        + '</div>'
      + '</div>';

  document.addEventListener("keydown", checkEnterKey);
  tweet();

  function tweet() {
    var req = new XMLHttpRequest();
    req.open("POST", "http://intra1.synap.co.kr/season2/tweet/index.ss", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function () {
      try {
        var resJson = JSON.parse(req.responseText);
        localStorage["userId"] = resJson.userId;
        showTweets(resJson.msgList);
        addDeleteButton();
        updateMrtTs();
        chrome.browserAction.setBadgeText({text:""});
        chrome.browserAction.setIcon({path: "/images/icon_on.png"});
      } catch (x) {
        showLoginMsg();
      }
    };

    var msg, ts;
    try {
      msg = document.getElementById("tweetMsg").value; 
      ts = document.getElementById("list").firstChild.id;
    } catch (x) {
      msg = "";
      ts = "0";
    }
    var params = "blahblah="+encodeURIComponent(msg)+"&recentTimestamp="+ts;
    setTimeout(function(){req.send(params);}, 0);
  }

  function showTweets(tweets) {
    var tweetHtml = [];
    for(var i=0; i<tweets.length; i++) {
      tweetHtml.unshift(getTweetHtml(tweets[i]));
    }
    if (tweetHtml.length > 50) {
      tweetHtml.splice(50);
    }
    document.getElementById("list").innerHTML = tweetHtml.join("");
    var icons = document.getElementsByClassName("icon");
    for(var i=0; i<icons.length; i++) { icons.item(0).onerror = defaultIcon(); }
    document.getElementById("mainPopup").style.display = "block";
  }

  function updateMrtTs() {
    var mrt = document.getElementById("list").firstChild; // most recent tweet
    var ts = (mrt)?mrt.id:"0";
    localStorage["mrtTs"] = ts;
  }

  function showLoginMsg() {
    document.body.innerHTML
      = '<div style="text-align:center;">'
      + 'Login required.'
      + 'Visit <b><a id="loginLink" href="http://intra1.synap.co.kr/season2/login.ss?cmd=loginForm">Synapsoft Intra1</a></b> and Login, first.'
      + '</div>';
    document.getElementById("loginLink").onclick = function(e) {
	  chrome.tabs.create({url: e.srcElement.href});
    };
  }

  function deleteTweet(id) {
    if(!confirm("Are you sure you want to delete this tweet?"))
      return;
    var req = new XMLHttpRequest();
    req.open("POST", "http://intra1.synap.co.kr/season2/tweet/index.ss", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function() {
      var tweet = document.getElementById(id);
      tweet.parentNode.removeChild(tweet);
    };
    var params = "cmd=delete&timestamp="+id;
    req.send(params);
  }

  function addDeleteButton() {
    var loginUserId = localStorage["userId"];
    var deleteLinks = document.getElementsByClassName("deleteLink");
    for (var i=0; i<deleteLinks.length; i++) {
      var linkUserId = deleteLinks[i].getAttribute("userId");
      if (linkUserId != loginUserId) {
        deleteLinks[i].style.display = "none";
      }
    }
  }

  function defaultIcon() {
    return "http://intra1.synap.co.kr/season2/images/no_avatar.png";
  }

  function getTweetHtml(tweet) {
    return String.format(tweetFormatStr,
                         tweet.timestamp,
                         getPictureUrl(tweet.id),
                         tweet.id,
                         tweet.userName,
                         tweet.blahblah.replace(/(\r\n|\n)/g, "<br/>"),
                         getTsStr(tweet.date));
  }

  function getPictureUrl(id) {
    return "http://intra1.synap.co.kr/season2/images/userphoto/" + id;
  }

  String.format = function(text) {
    if ( arguments.length <= 1 ) {
      return text;
    }
    var tokenCount = arguments.length - 2;
    for( var token = 0; token <= tokenCount; token++ ) {
      text = text.replace(new RegExp( "\\{" + token + "\\}", "gi" ),
						  arguments[ token + 1 ].replace("$", "$$$$") );
    }
    return text;
  };

  function getTsStr(dateStr) {
    var date = new Date(dateStr);
    var delta = (new Date() - date) / 1000; // in seconds

    if (delta < (60*60)) { // less than 1 hour
      var m = parseInt(delta / 60);
      return m + " minute" + ((m<=1)?"":"s") + " ago";
    } else if (delta < (24*60*60)) { // less than 24 hours
      var h = parseInt(delta / 60 / 60);
      return h +" hour" + ((h<=1)?"":"s") + " ago";
    } else {
      var m = date.getMonth()+1;
      var d = date.getDate();
      return (m<10?"0":"") + m + "/" + (d<10?"0":"") + d;
    }
  }

  function checkEnterKey(e) {
    if (e.srcElement.getAttribute("id") !== "tweetMsg") { // event src is not msg textarea
      return;
    }
    if (e.keyCode !== 13 || !(e.shiftKey || e.ctrlKey)) { // not Ctrl+Enter or Shift+Enter
      return;
    }

    tweet();
    var t = document.getElementById("tweetMsg");
    t.blur();
    t.value = "";
  }
})();

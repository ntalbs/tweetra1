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
            + '<img class="delete-button trashcan" data-userid="{2}" src="http://intra1.synap.co.kr/season2/images/trashcan_icon.gif" alt="delete"/>'
          + '</div>'
        + '<div class="msg">{4}</div>'
        + '<div class="time">{5}</div>'
        + '</div>'
      + '</div>';

  loadTweets();
  document.addEventListener("keydown", function(e) {
    if (e.srcElement !== $("tweetMsg")) { // event src is not msg textarea
      return;
    }
    if (e.keyCode !== 13 || !(e.shiftKey || e.ctrlKey)) { // not Ctrl+Enter or Shift+Enter
      return;
    }

    tweet();
  });

  document.addEventListener("click", function(e) {
    if (e.srcElement.getAttribute("class").indexOf("delete-button") < 0) {
      return;
    }
    e.preventDefault();
    setTimeout(function() { deleteTweet(e.srcElement.parentNode.parentNode.parentNode.id); }, 0);
  });

  function $(id) {
    return document.getElementById(id);
  }

  function sendRequset(params, callback) {
    var req = new XMLHttpRequest();
    req.open("POST", "http://intra1.synap.co.kr/season2/tweet/index.ss", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = callback;
    req.send(params);
  }

  function loadTweets() {
    sendRequset("blahblah=&recentTimestamp=0", function (e) {
      try {
        var resJson = JSON.parse(e.srcElement.responseText);
        localStorage["userId"] = resJson.userId;
        renderTweetList(resJson.msgList);
        addDeleteButton();
        updateMrtTs();
        chrome.browserAction.setBadgeText({text:""});
        chrome.browserAction.setIcon({path: "/images/icon_on.png"});
      } catch (x) {
        showLoginMsg();
      }
    });
  }
 
  function tweet() {
    var msg = $("tweetMsg").value,
        ts = $("list").firstChild.id,
        params = "blahblah="+encodeURIComponent(msg)+"&recentTimestamp="+ts;
    sendRequset(params, function (e) {
      try {
        var resJson = JSON.parse(e.srcElement.responseText);
        localStorage["userId"] = resJson.userId;
        renderTweet(resJson.msgList[0]);
        addDeleteButton();
        updateMrtTs();
        var t = $("tweetMsg");
        t.blur();
        t.value = "";
        chrome.browserAction.setBadgeText({text:""});
        chrome.browserAction.setIcon({path: "/images/icon_on.png"});
      } catch (x) {
        showLoginMsg();
      }
    });
  }

  function renderTweet(tweet) {
    var tweetHtml = getTweetHtml(tweet);
    var container = document.createElement("div");
    container.innerHTML = tweetHtml;
    var elTweet = container.firstChild;
    var list = $("list");
    list.insertBefore(elTweet, list.firstChild);
  }

  function renderTweetList(tweets) {
    var tweetHtml = [];
    for(var i=0; i<tweets.length; i++) {
      tweetHtml.unshift(getTweetHtml(tweets[i]));
    }
    if (tweetHtml.length > 50) {
      tweetHtml.splice(50);
    }
    $("list").innerHTML = tweetHtml.join("");
    var icons = document.getElementsByClassName("icon");
    for(var i=0; i<icons.length; i++) { icons.item(0).onerror = defaultIcon(); }
    $("mainPopup").style.display = "block";
  }

  function updateMrtTs() {
    var mrt = $("list").firstChild; // most recent tweet
    var ts = (mrt)?mrt.id:"0";
    localStorage["mrtTs"] = ts;
  }

  function showLoginMsg() {
    document.body.innerHTML
      = '<div style="text-align:center;">'
      + 'Login required.'
      + 'Visit <b><a id="loginLink" href="http://intra1.synap.co.kr/season2/login.ss?cmd=loginForm">Synapsoft Intra1</a></b> and Login, first.'
      + '</div>';
    $("loginLink").onclick = function(e) {
	  chrome.tabs.create({url: e.srcElement.href});
    };
  }

  function deleteTweet(id) {
    console.log("before confirm...");
    if(!confirm("Are you sure you want to delete this tweet?")) {
      console.log("confirm ok. before return.");
      return;
    }
    console.log("delete confirmed. now delete mesg.");
    var params = "cmd=delete&timestamp="+id;
    sendRequset(params, function() {
      console.log("request succeeded. delete.");
      var tweet = $(id);
      tweet.parentNode.removeChild(tweet);
    });
  }

  function addDeleteButton() {
    var loginUserId = localStorage["userId"];
    var deleteButtons = document.getElementsByClassName("delete-button");
    for (var i=0; i<deleteButtons.length; i++) {
      var linkUserId = deleteButtons[i].getAttribute("data-userid");
      if (linkUserId != loginUserId) {
        deleteButtons[i].style.display = "none";
      }
    }
  }

  function defaultIcon() {
    return "http://intra1.synap.co.kr/season2/images/no_avatar.png";
  }

  function getTweetHtml(tweet) {
    return String.format(
      tweetFormatStr,
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
})();

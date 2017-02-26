// ==UserScript==
// @name        epsi Patch
// @namespace   pcouaillier.epsi
// @description correct EPSI hours
// @include     http://ecampusarras.epsi.fr/*
// @version     1
// @grant       none
// ==/UserScript==
(()=> {
  "use strict";
  var TChdebs = document.getElementsByClassName('TChdeb');
  for (var i = TChdebs.length - 1; i >= 0; i--) {
    if (TChdebs[i].innerHTML.trim() === '08:15 - 12:15') {
      TChdebs[i].innerHTML = '08:15 10:15 12:15';
    }
    if (TChdebs[i].innerHTML.trim() === '13:45 - 17:45') {
      TChdebs[i].innerHTML = '13:40 15:30 17:40';
    }
  }
  var logo = document.getElementById('portal-logo');
  logo.style.backgroundImage = 'url(http://i359.photobucket.com/albums/oo37/myranda_miller16/unicorn2.jpg)';
  logo.style.backgroundSize = '80% 100%';
  logo.style.backgroundPosition = '33%';
  logo.style.transform = 'rotate(-10deg)';

  var clockUntilNextPause = document.createElement('div');
  clockUntilNextPause.setAttribute('id', 'clockUntilNextPause');
  clockUntilNextPause.style.fontSize = '2.5rem';document.getElementById('portal-column-one').appendChild(clockUntilNextPause);
  document.getElementById('clockUntilNextPause').style.fontSize = '2.5rem';

  // recursive update clock
  setInterval(function () {
    var currentTime = new Date();
    var currentHours : number = currentTime.getHours();
    var currentMinutes : number = currentTime.getMinutes();
    var currentSeconds : number = currentTime.getSeconds();
    var getPause = function (hours, minutes) {
      return new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDay(), hours, minutes);
    };
    var pauseHours = [
      10,
      12,
      15,
      17,
      34
    ];
    var pauseMinutes = [
      15,
      15,
      30,
      40,
      15
    ];
    var untilPauseHours = 0;
    var untilPauseMinutes = 0;
    if (currentHours < pauseHours[0]) {
      untilPauseHours = pauseHours[0] - currentHours - 1;
      untilPauseMinutes = 60 + pauseMinutes[0] - currentMinutes;
      untilPauseMinutes--;
      if (untilPauseMinutes > 59) {
        untilPauseMinutes -= 60;
        untilPauseHours++;
      }
    } else {
      for (var i = 0; i < pauseHours.length - 1; i++) {
        if (pauseHours[i] <= currentHours && currentHours < pauseHours[i + 1]) {
          if (pauseHours[i] === currentHours ) {
            if (currentMinutes === pauseMinutes[i] && currentSeconds === 0 && 'Notification' in window && Notification.permission  === 'granted') {
              new Notification('Pause!');
            }
            if (currentMinutes < pauseMinutes[i]) {
              untilPauseHours = 0;
              untilPauseMinutes = pauseMinutes[i] - currentMinutes - 1;
            } else {
              untilPauseHours = pauseHours[i + 1] - currentHours - 1;
              untilPauseMinutes = 60 - currentMinutes + pauseMinutes[i + 1] - 1;
              if (untilPauseMinutes > 59) {
                untilPauseHours += 1;
                untilPauseMinutes -= 60;
              }
            }
          } else {
            untilPauseHours = pauseHours[i + 1] - currentHours - 1;
            untilPauseMinutes = 60 + pauseMinutes[i + 1] - currentMinutes;
            untilPauseMinutes--;
            if (untilPauseMinutes > 59) {
              untilPauseMinutes -= 60;
              untilPauseHours++;
            }
          }
          break;
        }
      }
    }
    // Pad the minutes and seconds with leading zeros, if required
    var untilPauseSeconds = 60 - currentSeconds;

    var sCurrentHours      = (currentHours      < 10 ? '0' : '') + currentHours.toString();
    var sCurrentMinutes    = (currentMinutes    < 10 ? '0' : '') + currentMinutes.toString();
    var sCurrentSeconds    = (currentSeconds    < 10 ? '0' : '') + currentSeconds.toString();
    var sUntilPauseHours   = (untilPauseHours   < 10 ? '0' : '') + untilPauseHours.toString();
    var sUntilPauseMinutes = (untilPauseMinutes < 10 ? '0' : '') + untilPauseMinutes.toString();
    var sUntilPauseSeconds = (untilPauseSeconds < 10 ? '0' : '') + untilPauseSeconds.toString();

    // Update the time display
    document.getElementById('clockUntilNextPause').innerHTML = sCurrentHours + ':' + sCurrentMinutes + ':' + sCurrentSeconds + '<br/>' + sUntilPauseHours + ':' + sUntilPauseMinutes + ':' + sUntilPauseSeconds;
  }, 1000);

  // Let's check if the browser supports notifications
  if (!('Notification' in window) && Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {});
  }
})();

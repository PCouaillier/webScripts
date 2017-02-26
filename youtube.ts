// ==UserScript==
// @name         Playlist time length
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

const BLOCKING_MODE = 'WHITELIST_ALLOW_TOP_LEVEL';

const getPlaylistTime = () => {
  var time = [0,0,0];
  var timeElements = document.querySelectorAll('.pl-video-time .more-menu-wrapper .timestamp span');
  Array.prototype.forEach.call(timeElements, (e) => {
    var t = e.innerHTML.split(':');
    var limit = t.length - 1;
    for(let i=0;i<t.length;i++) {
      time[2-i] += parseInt(t[limit-i]);
    }
  });

  time[1] += (time[2]/60) | 0;
  time[2] %= 60;
  time[0] += (time[1]/60) | 0;
  time[1] %= 60;
  return time;
};

const RenderPlaylistTime = () => {
  var ul = document.querySelector('#pl-header .pl-header-content ul.pl-header-details');
  if(ul && ul.children.length !== 4) {
    var li = document.createElement('li');
    li.innerHTML = getPlaylistTime().join(':');
    ul.insertBefore(li, ul.children[2]);
  }
};

const ForceRenderPlaylistTime = function ForceRenderPlaylistTime() {
  var ul = document.querySelector('#pl-header .pl-header-content ul.pl-header-details');
  if(ul)
    RenderPlaylistTime();
  setTimeout(ForceRenderPlaylistTime, 100);
};

(function() {
    'use strict';
    function bindEvent() {
        var target = document.getElementById('VLWL-guide-item');
        if(target)
          target.addEventListener('click', ForceRenderPlaylistTime);
        else
          setTimeout(bindEvent, 100);
    }
    bindEvent();
    if(document.URL === 'https://www.youtube.com/playlist?list=WL')
      ForceRenderPlaylistTime();
})();

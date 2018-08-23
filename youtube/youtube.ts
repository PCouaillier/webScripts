// ==UserScript==
// @name         Playlist time length
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

const getPlaylistTime = () => {
  let time = [0, 0, 0];
  let timeElements = document.querySelectorAll('.pl-video-time .more-menu-wrapper .timestamp span');
  Array.prototype.forEach.call(timeElements, (e: HTMLElement) => {
    let t = e.innerHTML.split(':');
    let limit = t.length - 1;
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
  let ul = document.querySelector('#pl-header .pl-header-content ul.pl-header-details');
  if(ul && ul.children.length !== 4) {
    let li = document.createElement('li');
    li.innerHTML = getPlaylistTime().join(':');
    ul.insertBefore(li, ul.children[2]);
  }
};

const ForceRenderPlaylistTime = function ForceRenderPlaylistTime() {
  let ul = document.querySelector('#pl-header .pl-header-content ul.pl-header-details');
  if(ul)
    RenderPlaylistTime();
  setTimeout(ForceRenderPlaylistTime, 100);
};

(function() {
    'use strict';
    function bindEvent() {
        let target = document.getElementById('VLWL-guide-item');
        if(target)
          target.addEventListener('click', ForceRenderPlaylistTime);
        else
          setTimeout(bindEvent, 100);
    }
    bindEvent();
    if(document.URL === 'https://www.youtube.com/playlist?list=WL')
      ForceRenderPlaylistTime();
})();

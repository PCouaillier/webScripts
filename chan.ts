// ==UserScript==
// @name        chan
// @namespace   pcouaillier.chan
// @include     https://ccluster.com/*
// @include     https://boards.4chan.org/*
// @include     http://boards.4chan.org/*
// @version     1
// @grant       none
// ==/UserScript==
namespace Downloader {
  function extractExtension(str: string) {
	  let splitStr = str.split('.');
    splitStr.pop();
    return splitStr.join('.');
  }
  function findName(elem: Element): string {
    if( elem.children.length === 0 ) {
      return extractExtension(elem.innerHTML.trim());
    }
    return findName(elem.children[0]);
  }
  document.getElementsByTagName('body')[0].appendChild((()=>{
    let b = document.createElement('button');
    b.style.position="fixed";
    b.style.top="3rem";
    b.style.right="0.5rem";
    b.innerHTML="[ download ]";

    b.addEventListener('click',()=> {
      let s = '';
      const load = (e: HTMLAnchorElement) => {
        let l = e.href.split('.'),
            ext = l[l.length - 1].toLowerCase(),
            append = false;

        if ((ext === 'jpg' || ext === 'webm' || ext === 'mp4' || ext === 'png' || ext === 'gif' || ext === 'rar' || ext === 'zip' || ext === '7z') || (!(ext !== '' && ext.length < 6 && ext !== 'html' && ext!=="html#" && ext !== 'php' && ext !== 'htm' && ext[ext.length - 1] !== '/') && confirm(ext))) {
            append = true;
        }

        if (append)
            s += 'wget -nc -O "'+ findName(e).trim() + "__" + (Math.random()*1000000 | 0).toString() + '.' + ext +'" ' + e.href + ' ; ';
      };
      let list = document.querySelectorAll('.file > .fileText > a');
      if (list.length > 0)
        Array.prototype.forEach.call(list, load);
      list = document.querySelectorAll('.hyperlinkMediaFileName');
      if (list.length > 0)
        Array.prototype.forEach.call(list, load);
      window.prompt('copy', s);
    });
    return b;
  })());
}

namespace Player {
  export interface El {
    name: string,
    url: string,
    ext: string,
    e: HTMLAnchorElement,
  }

  function getName<T extends HTMLElement>(elem: T): string {
    let name: string = '';
    if (elem.title !== undefined && elem.title !== null && elem.title.trim() !== '') {
      name = elem.title.trim();
      if (name !== '') return name;
    }
    name = elem.innerHTML.trim();
    return name;
  }

  function getExt(name: string): string|undefined {
    let spliced = name.split(/\./g),
        ext = spliced[spliced.length - 1].trim();
    return ext !== '' ? ext : undefined;
  }
  (() => {
      let st = document.createElement('style');
      st.innerHTML = '.chan-player-container {' +
            'width: calc(100vw - 16px);' +
            'height: 100vh;' +
            'position: fixed;' +
            'top: 0;' +
            'left: 0;' +
          '}' +
          '.chan-player-container > video, .chan-player-container > img {' +
            'width: 100%;' +
            'height: 100%;' +
          '}';
      document.body.appendChild(st);
  })();

  let playerContainer = document.createElement('div');
  playerContainer.classList.add('chan-player-container');
  playerContainer.hidden = false;
  document.body.appendChild(playerContainer);

  let player : HTMLVideoElement|HTMLImageElement|undefined = undefined;

  let current = 0;
  let elements: El[] = [];
  let timer: number|undefined = undefined;

  export function previous() {
    if (elements.length === 0 || current === 0) { return; }
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined
    }
    createPlayer(elements[--current]);
  }

  export function next() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined
    }
    if (elements.length === 0) { return; }
    if (++current >= elements.length) { current = 0 };
    createPlayer(elements[current]);
  }

  export function createPlayer (element: El) {

    while (playerContainer.children.length !==0) {
      playerContainer.removeChild(playerContainer.children[0]);
    }
    if (element.ext === 'webm' || element.ext === 'mp4') {
      player = document.createElement('video');
      player.onended = () => next();
      player.src = element.url;
      player.controls = true;
      player.addEventListener('keypress', (e) => {
        if (  e.key.toLocaleLowerCase() === 'arrowright' ||
              e.key.toLocaleLowerCase() === 'arrowleft') {
          e.preventDefault();
          e.stopPropagation();
          next();
        }
      });
      // noinspection JSIgnoredPromiseFromCall
      player.play();
    } else {
      player = document.createElement('img');
      player.src = element.url;
      let p = player;
      timer = setTimeout(() => {
        if (p !== playerContainer.children[0]) return;
        next();
      }, 3000);
    }
    playerContainer.appendChild(player);
  }

  for (let elem of (document.querySelectorAll<HTMLAnchorElement>('.fileText a') as any as HTMLAnchorElement[])) {
    let name = getName(elem);
    elements.push({name: name, url: elem.href, ext: getExt(name), e: elem});
  }

  document.addEventListener('keypress', (e) => {
    if (e.key.toLowerCase() === 'escape') {
      playerContainer.hidden = !playerContainer.hidden;
      if (!playerContainer.hidden && playerContainer.children.length === 0) {
        console.log(elements[0]);
        createPlayer(elements[0]);
      }
    } else if (!playerContainer.hidden && e.key.toLocaleLowerCase() === 'arrowleft') {
      e.preventDefault();
      e.stopPropagation();
      previous();
    } else if (!playerContainer.hidden && e.key.toLocaleLowerCase() === 'arrowright') {
      e.preventDefault();
      e.stopPropagation();
      next();
    }
  });
}

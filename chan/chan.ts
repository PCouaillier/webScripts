// ==UserScript==
// @name        chan
// @namespace   pcouaillier.chan
// @include     https://boards.4chan.org/*
// @include     http://boards.4chan.org/*
// @version     1
// @grant       none
// ==/UserScript==

let cache = document.createElement('video');
cache.preload = 'auto';
cache.autoplay = false;

namespace Downloader
{
  let checkLocalStorage = true;
  let optimizedForFourChan = document.URL.includes('4chan.org') || document.URL.includes('8ch.net');

    'use strict';
    const STORAGE_NAME = 'chan_database';
    const dlAll = (() => {
        const fourChanSelectors = {
            commentBody: 'blockquote',
            graphLink: '.backlink .quotelink',
            topElemRegex: /^(pc|t)[0-9]{4}[0-9]+$/,
            files: '.file .fileText a'
        };
        const heightChanSelectors = {
            commentBody: '.body',
            graphLink: '.mentioned  a',
            topElemRegex: /^(reply_|thread_)[0-9]+$/,
            files: '.file .fileinfo a'
        };
        let currentContextSelectors = document.URL.includes('4chan.org') ? fourChanSelectors
                                                                         : heightChanSelectors;

        function commentContent(elem: Element) {
            let a = elem.querySelector(currentContextSelectors.commentBody);
            return a ? (a as HTMLElement).innerText : null;
        }

        function consumeHrefSelector(selector: string) {
            let regResult = /^#([0-9]+)$/.exec(selector);
            return regResult ? document.getElementById(regResult[1]) : document.querySelector(selector);
        }

        function commentGraph(elem: Element) {
            return {
                comment: commentContent(elem),
                links: Array.prototype.map.call(
                    elem.querySelectorAll(currentContextSelectors.graphLink),
                    (a: HTMLElement) => commentGraph(getTop(consumeHrefSelector(a.getAttribute('href'))))
                )
            };
        }

        function getTop(a: Element): Element {
            if ( a === document.body) throw {error: "topLevelAcchived"};

            let id = a.getAttribute('id');
            if (!id || currentContextSelectors.topElemRegex.exec(id)===null) {
                return getTop(a.parentElement);
            }
            return a;
        }

        function generateCommentGraph(a: Element): {comment: string, links: any} {
            return commentGraph(getTop(a));
        }


        function download(file: any) {
            let a = document.createElement('a'),
                url = URL.createObjectURL(file);
            a.href = url;
            a.setAttribute('download', file.name);
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }

        function removeUnwantedChars(str: string) {
            if (!str) return '';
            const remove_chars = ['"', '#', '%', '*', ':', '<', '>', '?', '/', '\\', '|', '\'', ',', ';'];
            const escape_chars = ['!'];
            str = str.trim();
            let res = '';
            for (let i = 0; i < str.length; i++) {
                if ((escape_chars as any).includes(str[i]))
                    res += '\\' + str[i];
                else if (!(remove_chars as any).includes(str[i]))
                    res += str[i];
            }
            return res.trim();
        }

        function getThreadNameFromTitle() {
            let name = document.title.match(/^.* - (.*) - .* - .*$/);
            return (name && name.length>0) ? name[1] : '';
        }

        return function dlAll() {
            let threadName = getThreadNameFromTitle(),
                tree = Array.prototype.map.call(
                    document.querySelectorAll(currentContextSelectors.files),
                    (a: HTMLAnchorElement) => ({
                        name: a.title && a.title!=='' ? a.title : a.innerText,
                        link: a.href,
                        commentGraph: generateCommentGraph(a)
                    })
                );
            console.log(threadName, getThreadNameFromTitle, getThreadNameFromTitle());

            if (threadName===null || threadName.trim()==='') {
                threadName = document.querySelector<HTMLElement>('span.subject').innerText;
            }
            if (threadName===null || threadName.trim()==='') {
                threadName = document.querySelector<HTMLElement>('span.name').innerText;
            }

            let escapedThreadName = removeUnwantedChars(threadName),
                dlFileHead = [
                    '#!/bin/bash',
                    'mkdir -p "'+threadName+'"',
                    'cd "' + threadName +'"',
                    'mv "${0/__dl\.sh/__comments\.json}" .',
                    'mv "$0" .',
                ].join('\n') + '\n';

            download(
                new File(
                    [JSON.stringify({threadName: threadName, threadUrl: document.URL.toString(), tree: tree})],
                    escapedThreadName + '__comments.json',
                    {type: 'text/json'}
                )
            );
            download(
                new File(
                    [
                        tree.reduce(
                            (acc: string, a: any) =>
                                acc += 'wget -nc -O "' + removeUnwantedChars(a.name) + '" "' + a.link + '"\n',
                            dlFileHead
                        )
                    ],
                    escapedThreadName + '__dl.sh',
                    {type: 'text/sh'}
                )
            );
        };
    })();
    const loadFromCache = () => {
        if (window.localStorage) {
            var json = (window.localStorage.getItem(STORAGE_NAME));
            return json ? JSON.parse(json) : [];
        }
        else {
            return [];
        }
    };
    function cleanName(str: string) {
        const remove_chars = ['"', '#', '%', '*', ':', '<', '>', '?', '/', '\\', '|', '\'', ',', ';'];
        const escape_chars = ['!'];
        str = str.trim();
        var res = '';
        for (var i = 0; i < str.length; i++) {
            if ((escape_chars as any).includes(str[i]))
                res += '\\' + str[i];
            else if (!(remove_chars as any).includes(str[i]))
                res += str[i];
        }
        return res;
    }
    function extractExtension(str: string) {
        var sstr = str.split('.');
        sstr.pop();
        return sstr.join('.');
    }
    function findName(elem: HTMLElement): string {
        if (elem.children.length === 0)
        {
            if (elem.title && elem.title.length>0) {
                return extractExtension(elem.title.trim());
            }
            return extractExtension(elem.innerHTML.trim());
        }
        return findName(elem.children[0] as HTMLElement);
    }
    document.getElementsByTagName('body')[0].appendChild((() => {
        var b = document.createElement('button');
        b.style.position = 'fixed';
        b.style.top = '3rem';
        b.style.right = '0.5rem';
        b.innerHTML = '[ download ]';
        b.addEventListener('click', function bashDL() {
            if (optimizedForFourChan) {
                dlAll();
                return;
            }
            var alreadyDownloaded = loadFromCache();
            var s = '';
            const load = (e: HTMLAnchorElement) => {
                var l = e.href.split('.');
                var ext = l[l.length - 1].toLowerCase();
                var append = false;
                if ((ext === 'jpg' || ext === 'webm' || ext === 'mp4' || ext === 'png' || ext === 'gif' || ext === 'rar' || ext === 'zip' || ext === '7z') || (!(ext !== '' && ext.length < 6 && ext !== 'html' && ext !== 'html#' && ext !== 'php' && ext !== 'htm' && ext[ext.length - 1] !== '/') && confirm(ext)))
                    append = true;
                var name = cleanName(e.innerHTML);
                if (name === '')
                    name = e.href;
                if (append && (!checkLocalStorage || !alreadyDownloaded.includes(e.href))) {
                    if (!alreadyDownloaded.includes(e.href))
                        alreadyDownloaded.push(e.href);

                    s += 'wget -nc -O "' + cleanName(findName(e)) + "__" + ((Math.random() * 1000000) | 0).toString() + '.' + ext + '" ' + e.href + ' ; ';
                }
            };
            [
                document.querySelectorAll('.file > .fileText > a'),
                document.querySelectorAll('.fileinfo > span > a'),
                document.querySelectorAll('.hyperlinkMediaFileName')
            ].forEach((list)=>{
                if (list.length > 0) Array.prototype.forEach.call(list, load);
            });
            window.prompt('copy', s);
            if (window.localStorage)
                window.localStorage.setItem(STORAGE_NAME, JSON.stringify(alreadyDownloaded));
        });
        return b;
    })());
}

namespace Player
{
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

  function isVideo(el: El|string) {
    if (typeof el === 'string') {
      return el === 'mp4' || el === 'webm';
    }
    return el.ext === 'mp4' || el .ext === 'webm';
  }

  function getExt(name: string): string|undefined {
    let spliced = name.split(/\./g),
        ext = spliced[spliced.length - 1].trim();
    return ext !== '' ? ext : undefined;
  }

  (() => {
      let st = document.createElement('style');
      st.innerHTML =
          CssDocument([CssSelector(CssClasse('chan-player-container'), [
                        CssProperty('width', 'calc(100vw - 16px)'),
                        CssProperty('height', '100vh'),
                        CssProperty('position', 'fixed'),
                        CssProperty('top', '0'),
                        CssProperty('left', '0'),
                      ]),
                      CssSelector('.chan-player-container > video, .chan-player-container > img', [
                        CssProperty('width', 'calc(100vw - 16px)'),
                        CssProperty('height', '100vh'),
                      ])]).toString();
      document.body.appendChild(st);
  })();

  let playerContainer = document.createElement('div');
  playerContainer.classList.add('chan-player-container');
  playerContainer.hidden = true;
  document.body.appendChild(playerContainer);

  let player : HTMLVideoElement|HTMLImageElement|undefined = undefined;

  let current = 0;
  let elements: El[] = [];
  let volume = 0.5;
  let timer: number|undefined = undefined;

  export function hasAudio(): boolean {
    let video = playerContainer.firstElementChild as any;
    return video !== undefined ||
      video.mozHasAudio ||
      Boolean(video.webkitAudioDecodedByteCount) ||
      (video.audioTracks && video.audioTracks.length);
  }

  function previous() {
    if (elements.length === 0 || current === 0) { return; }
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined
    }
    createPlayer(elements[--current]);
  }

  function next() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined
    }
    if(playerContainer.firstElementChild && (playerContainer.firstElementChild as any).mozHasAudio) {
      volume = (playerContainer.firstElementChild as any).volume;
    }
    if (elements.length === 0) { return; }
    if (++current >= elements.length) { current = 0 };

    let el = elements[current]
    let isVid = isVideo(el);
    createPlayer(el, isVid);
    if (isVid) {
      for (let i = current + 1; i < elements.length ; ++i) {
        if (isVideo(elements[i])) {
          cache.src = elements[i].url;
        }
      }
    }
  }

  function createPlayer (element: El, useCache: boolean = false) {
    while (playerContainer.children.length !==0) {
      playerContainer.removeChild(playerContainer.children[0]);
    }
    if (element.ext === 'webm' || element.ext === 'mp4') {
      if (cache.src === element.url) {
        player = cache;
        cache = document.createElement('video');
        cache.autoplay = false;
        cache.preload = 'auto';
      }
      else {
        player = document.createElement('video');
        player.src = element.url;
      }
      player.onended = () => next();
      player.controls = true;
      player.volume = volume;
      player.addEventListener('keydown', (e) => {
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

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'escape') {
      playerContainer.hidden = !playerContainer.hidden;
      if (!playerContainer.hidden && playerContainer.children.length === 0) {
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

function CssClasse(className: string) {
  return {
      className: className,
      toString: () => '.' + className,
  };
}

function CssDocument(args: object[]) {
  return {
      inner: args,
      toString: () => args.map(a => a.toString()).join(''),
  };
}

function CssSelector(s: object|string|object[], a: object[]) {
  let selector = typeof(s) === 'string' ? s : s.toString();
  selector += '{' + a.map(b => b.toString() + ';').join('') + '}';
  return {
      selector: s,
      a: a,
      toString: () => selector,
  };
}

function CssProperty(name: string, value: string) {
  return {
      name: name,
      value: value,
      toString: () => name + ':' + value,
  };
}
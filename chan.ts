// ==UserScript==
// @name        chan
// @namespace   pcouaillier.chan
// @include     https://ccluster.com/*
// @include     https://boards.4chan.org/*
// @include     http://boards.4chan.org/*
// @version     1
// @grant       none
// ==/UserScript==
(() => {
  "use strict";
  function extractExtension(str) {
	var sstr = str.split('.');
	sstr.pop();
	return sstr.join('.');
  }
  function findName(elem: Element) {
      if(elem.children.length===0)
          return extractExtension(elem.innerHTML.trim());
      return findName(elem.children[0]);
  }
  document.getElementsByTagName('body')[0].appendChild((()=>{
    var b = document.createElement('button');
    b.style.position="fixed";
    b.style.top="3rem";
    b.style.right="0.5rem";
    b.innerHTML="[ download ]";

    b.addEventListener('click',()=> {
      var s = '';
      const load = (e: HTMLAnchorElement) => {
        var l = e.href.split('.');
        var ext = l[l.length - 1].toLowerCase();
        var append = false;
        if ((ext === 'jpg' || ext === 'webm' || ext === 'mp4' || ext === 'png' || ext === 'gif' || ext === 'rar' || ext === 'zip' || ext === '7z') || (!(ext !== '' && ext.length < 6 && ext !== 'html' && ext!=="html#" && ext !== 'php' && ext !== 'htm' && ext[ext.length - 1] !== '/') && confirm(ext))) {
            append = true;
        }
        var name = e.innerHTML.trim().replace('"','').replace('#','').replace('%','').replace('*','').replace(':','').replace('<','').replace('>','').replace('?','').replace('/','').replace('\\','').replace('|','').replace('\'','');
        if(name ==='')
            name = e.href;
        if(append)
            s += 'wget -nc -O "'+ findName(e).trim() + "__" + (Math.random()*1000000 | 0).toString() + '.' + ext +'" ' + e.href + ' ; ';
      };
      var list = document.querySelectorAll('.file > .fileText > a');
      if (list.length>0)
        Array.prototype.forEach.call(list, load);
      list = document.querySelectorAll('.hyperlinkMediaFileName');
      if (list.length>0)
        Array.prototype.forEach.call(list, load);
      window.prompt('copy', s);
    });
    return b;
  })());
})();

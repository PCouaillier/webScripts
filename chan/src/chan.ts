import { Player } from 'Player';

/**
 * ESNEXT feature but required
 * @param cb the function executed at the next tick
 */
declare function requestIdleCallback(cb: VoidFunction): void;

let cache = document.createElement('video');
cache.preload = 'auto';
cache.autoplay = false;

namespace Downloader {
    const checkLocalStorage = true;
    const optimizedForFourChan = document.URL.includes('4chan.org') || document.URL.includes('4channel.org') || document.URL.includes('8ch.net');

    const STORAGE_NAME = 'chan_database';
    const dlAll = (() => {
        const fourChanSelectors = {
            condition: document.URL.includes('4chan.org') || document.URL.includes('4chan.org'),
            commentBody: 'blockquote',
            graphLink: '.backlink .quotelink',
            topElemRegex: /^(pc|t)[0-9]{4}[0-9]+$/,
            files: '.file .fileText a'
        };
        const heightChanSelectors = {
            condition: true,
            commentBody: '.body',
            graphLink: '.mentioned  a',
            topElemRegex: /^(reply_|thread_)[0-9]+$/,
            files: '.file .fileinfo a'
        };
        const selectors = [fourChanSelectors, heightChanSelectors]
        const currentContextSelectors = selectors.find(s => s.condition);

        function commentContent(elem: Element): string | null {
            const a = elem.querySelector(currentContextSelectors.commentBody);
            return a ? (a as HTMLElement).innerText : null;
        }

        function consumeHrefSelector(selector: string): HTMLElement | null {
            const regResult = /^#([0-9]+)$/.exec(selector);
            return regResult ? document.getElementById(regResult[1]) : document.querySelector(selector);
        }

        interface CommentGraphNode {
            comment: string;
            links: CommentGraphNode[];
        } 

        function commentGraph(elem: Element): CommentGraphNode {
            return {
                comment: commentContent(elem),
                links: Array.prototype.map.call(
                    elem.querySelectorAll(currentContextSelectors.graphLink),
                    (a: HTMLElement) => commentGraph(getTop(consumeHrefSelector(a.getAttribute('href'))))
                )
            };
        }

        function getTop(a: HTMLElement): HTMLElement {
            if (a === document.body) throw { error: "topLevelAcchived" };

            const id = a.getAttribute('id');
            if (!id || currentContextSelectors.topElemRegex.exec(id) === null) {
                return getTop(a.parentElement);
            }
            return a;
        }

        function generateCommentGraph(a: HTMLElement): CommentGraphNode {
            return commentGraph(getTop(a));
        }


        function download(file: File): Promise<void> {
            const a = document.createElement('a');
            a.setAttribute('download', file.name);
            const url = URL.createObjectURL(file);
            document.body.appendChild(a);
            a.click();
            return new Promise(resolve => {
                requestIdleCallback(() => {
                    URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    resolve();
                });
            });
        }

        function removeUnwantedChars(str: string) {
            if (!str) return '';
            const remove_chars = ['"', '#', '%', '*', ':', '<', '>', '?', '/', '\\', '|', '\'', ',', ';', '!'];
            const escape_chars = new Array<String>();
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

        function getThreadNameFromTitle(): string {
            const name = document.title.match(/^.* - (.*) - .* - .*$/);
            return (name && name.length > 0) ? name[1] : '';
        }

        interface TreeNode {
            name: string;
            link: string;
            commentGraph: CommentGraphNode;
        }

        return function dlAll(): Promise<void> {
            let threadName = getThreadNameFromTitle();
            const tree: TreeNode[] = Array.prototype.map.call(
                    document.querySelectorAll(currentContextSelectors.files),
                    (a: HTMLAnchorElement) => ({
                        name: a.title && a.title !== '' ? a.title : a.innerText,
                        link: a.href,
                        commentGraph: generateCommentGraph(a)
                    })
                );

            if (threadName === null || threadName.trim() === '') {
                threadName = document.querySelector<HTMLElement>('span.subject').innerText;
            }
            if (threadName === null || threadName.trim() === '') {
                threadName = document.querySelector<HTMLElement>('span.name').innerText;
            }

            const pad = (a: number) => a >= 10 ? a : '0' + 0;
            const d = new Date();
            const dString = '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes());
            const escapedThreadName = removeUnwantedChars(threadName),
                dlFileHead = [
                    '#!/bin/bash',
                    'mkdir -p "' + escapedThreadName + '"',
                    'cd "' + escapedThreadName + '"',
                    'mv "../' + escapedThreadName + dString + '__comments.json" .',
                    'mv "../$0" .',
                ].join('\n') + '\n';

            return download(
                new File(
                    [JSON.stringify({ threadName: threadName, threadUrl: document.URL.toString(), tree: tree })],
                    escapedThreadName + dString + '__comments.json',
                    { type: 'text/json' }
                )
            ).then(() => download(
                new File(
                    [
                        tree.reduce(
                            (acc: string, a: TreeNode) => acc += 'wget -nc -O "' + removeUnwantedChars(a.name) + '" "' + a.link + '"\n',
                            dlFileHead
                        )
                    ],
                    escapedThreadName + '__dl.sh',
                    { type: 'text/sh' }
                )
            ));
        };
    })();

    const loadFromCache = (): string[] => {
        if (window.localStorage) {
            const json = (window.localStorage.getItem(STORAGE_NAME));
            return json ? JSON.parse(json) : [];
        }
        else {
            return [];
        }
    };

    function cleanName(str: string): string {
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
        return res;
    }

    function extractExtension(str: string): string {
        const sstr = str.split('.');
        sstr.pop();
        return sstr.join('.');
    }

    function findName(elem: HTMLElement): string {
        if (elem.children.length === 0) {
            if (elem.title && elem.title.length > 0) {
                return extractExtension(elem.title.trim());
            }
            return extractExtension(elem.innerHTML.trim());
        }
        return findName(elem.children[0] as HTMLElement);
    }

    document.getElementsByTagName('body')[0].appendChild((() => {
        const b = document.createElement('button');
        b.style.position = 'fixed';
        b.style.top = '3rem';
        b.style.right = '0.5rem';
        b.innerHTML = '[ download ]';
        b.addEventListener('click', function bashDL() {
            if (optimizedForFourChan) {
                dlAll();
                return;
            }
            const alreadyDownloaded = loadFromCache();
            let s = '';
            const load = (e: HTMLAnchorElement) => {
                const l = e.href.split('.');
                const ext = l[l.length - 1].toLowerCase();
                const append = ((ext === 'jpg' || ext === 'webm' || ext === 'mp4' || ext === 'png' || ext === 'gif' || ext === 'rar' || ext === 'zip' || ext === '7z') || (!(ext !== '' && ext.length < 6 && ext !== 'html' && ext !== 'html#' && ext !== 'php' && ext !== 'htm' && ext[ext.length - 1] !== '/') && confirm(ext)))
                let name = cleanName(e.innerHTML);

                if (name === '') name = e.href;

                if (append && (!checkLocalStorage || !alreadyDownloaded.includes(e.href))) {
                    if (!alreadyDownloaded.includes(e.href)) {
                        alreadyDownloaded.push(e.href);
                    }
                    s += 'wget -nc -O "' + cleanName(findName(e)) + "__" + ((Math.random() * 1000000) | 0).toString() + '.' + ext + '" ' + e.href + ' ; ';
                }
            };
            [
                document.querySelectorAll('.file > .fileText > a'),
                document.querySelectorAll('.fileinfo > span > a'),
                document.querySelectorAll('.hyperlinkMediaFileName')
            ].forEach((list) => {
                if (list.length > 0) Array.prototype.forEach.call(list, load);
            });
            window.prompt('copy', s);
            if (window.localStorage)
                window.localStorage.setItem(STORAGE_NAME, JSON.stringify(alreadyDownloaded));
        });
        return b;
    })());
}

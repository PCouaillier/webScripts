import {CssClasse, CssDocument, CssProperty, CssSelector} from 'css-builder';

export namespace Player {
    let cache: HTMLVideoElement = document.createElement('video');
    cache.preload = 'auto';
    cache.autoplay = false;

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

    function isVideo(el: El | string) {
        if (typeof el === 'string') {
            return el === 'mp4' || el === 'webm';
        }
        return el.ext === 'mp4' || el.ext === 'webm';
    }

    function getExt(name: string): string | undefined {
        const spliced = name.split(/\./g);
        const ext = spliced[spliced.length - 1].trim();
        return ext !== '' ? ext : undefined;
    }

    (() => {
        const st = document.createElement('style');
        st.innerHTML =
            CssDocument([
                CssSelector(CssClasse('chan-player-container'), [
                    CssProperty('width', 'calc(100vw - 16px)'),
                    CssProperty('height', '100vh'),
                    CssProperty('position', 'fixed'),
                    CssProperty('top', '0'),
                    CssProperty('left', '0'),
                    CssProperty('background', '#000000'),
                ]),
                CssSelector('.chan-player-container > div.img', [
                    CssProperty('width', 'calc(100vw - 16px)'),
                    CssProperty('height', '100vh'),
                    CssProperty('margin', '0'),
                    CssProperty('padding', '0'),
                    CssProperty('background-repeat', 'no-repeat'),
                    CssProperty('background-position', 'center'),
                    CssProperty('background-size', 'contain'),
                ]),
                CssSelector('.chan-player-container > img', [
                    CssProperty('max-width', 'calc(100vw - 16px)'),
                    CssProperty('max-height', '100vh'),
                    CssProperty('width', 'auto'),
                    CssProperty('height', 'auto'),
                    CssProperty('margin-left', 'auto'),
                    CssProperty('margin-right', 'auto'),
                ]),
                CssSelector('.chan-player-container > video', [
                    CssProperty('width', 'calc(100vw - 16px)'),
                    CssProperty('height', '100vh'),
                    CssProperty('background', 'black'),
                ]),
                CssSelector('.chan-player-container > video, .chan-player-container > img', [
                    CssProperty('background', 'black'),
                ]),
                CssSelector('.chan-player-container.rotate > *', [
                    CssProperty('width', '100vw'),
                    CssProperty('height', '100vh'),
                    CssProperty('transform', 'rotate(90deg) translate(calc(-50vw + 50%), calc(50vh - 50%))'),
                ]),
                CssSelector('.chan-player-container.rotate-neg > *', [
                    CssProperty('width', '100vw'),
                    CssProperty('height', '100vh'),
                    CssProperty('transform', 'rotate(-90deg) translate(calc(50vw - 50%), calc(-50vh + 50%))'),
                ]),
            ]).toString();
        document.body.appendChild(st);
    })();

    const playerContainer = document.createElement('div');
    playerContainer.classList.add('chan-player-container');
    playerContainer.hidden = true;
    document.body.appendChild(playerContainer);

    let player: HTMLVideoElement | HTMLImageElement | HTMLDivElement | undefined = undefined;

    let current = 0;
    let elements: El[] = [];
    let volume = 0.2;
    let timer: number | undefined = undefined;

    export function hasAudio(): boolean {
        const video = playerContainer.firstElementChild as any;
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
        const player = playerContainer.firstElementChild;
        if (player && (player as any).mozHasAudio) {
            volume = (player as any).volume;
        }
        if (elements.length === 0) { return; }
        if (++current >= elements.length) { current = 0 };

        const el = elements[current]
        const isVid = isVideo(el);
        createPlayer(el);
        if (isVid) {
            for (let i = current + 1; i < elements.length; ++i) {
                if (isVideo(elements[i])) {
                    cache.src = elements[i].url;
                }
            }
        }
    }

    function createPlayer(element: El) {
        while (playerContainer.children.length !== 0) {
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
                if (e.key.toLocaleLowerCase() === 'arrowright' ||
                    e.key.toLocaleLowerCase() === 'arrowleft') {
                    e.preventDefault();
                    e.stopPropagation();
                    next();
                }
            });
            // noinspection JSIgnoredPromiseFromCall
            player.play();
        } else if (element.ext === 'gif', element.ext === 'png' || element.ext === 'jpg' || element.ext === 'jpeg') {
            player = document.createElement('div');
            player.classList.add('img');
            player.style.backgroundImage = 'url(' + element.url + '';
            const p = player;
            timer = setTimeout(() => {
                if (p !== playerContainer.children[0])
                    return;
                next();
            }, 3000);
        } else {
            player = document.createElement('img');
            (player as HTMLImageElement).src = element.url;
            const p = player;
            timer = setTimeout(() => {
                if (p !== playerContainer.children[0]) return;
                next();
            }, 3000);
        }
        playerContainer.appendChild(player);
    }

    const anchors = document.querySelectorAll<HTMLAnchorElement>('.fileText a') as NodeListOf<HTMLAnchorElement>;
    for (let i = 0; i < anchors.length; i+=1) {
        const elem = anchors[i];
        const name = getName(elem);
        elements.push({ name: name, url: elem.href, ext: getExt(name), e: elem });
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e && e.ctrlKey) { return; }

        const key = e.key ? e.key.toLowerCase() : undefined;
        if (e.key.toLowerCase() === 'escape') {
            playerContainer.hidden = !playerContainer.hidden;
            if (!playerContainer.hidden && playerContainer.children.length === 0) {
                createPlayer(elements[0]);
            }
        }
        else if (!playerContainer.hidden && key) {
            switch (key) {
                case 'arrowleft':
                    e.preventDefault();
                    e.stopPropagation();
                    previous();
                    break;
                case 'arrowright':
                    e.preventDefault();
                    e.stopPropagation();
                    next();
                    break;
                case 'arrowup':
                    e.preventDefault();
                    e.stopPropagation();
                    if (volume < 1) {
                        if (volume <= 0.9) {
                            volume += 0.1;
                        } else {
                            volume = 1;
                        }
                        if (playerContainer.firstElementChild && (playerContainer.firstElementChild as any).volume !== undefined) {
                            (playerContainer.firstElementChild as any).volume = volume;
                        }
                    }
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    e.stopPropagation();
                    if (0 < volume) {
                        if (volume < 0.1) {
                            volume = 0;
                        } else {
                            volume -= 0.1;
                        }
                        if (playerContainer.firstElementChild && (playerContainer.firstElementChild as any).volume !== undefined) {
                            (playerContainer.firstElementChild as any).volume = volume;
                        }
                    }
                    break;
                case 'r':
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.shiftKey) {
                        if (playerContainer.classList.contains('rotate-neg')) {
                            playerContainer.classList.remove('rotate-neg');
                        } else {
                            playerContainer.classList.add('rotate-neg');
                        }
                        if (playerContainer.classList.contains('rotate')) {
                            playerContainer.classList.remove('rotate');
                        } 
                    } else {
                        if (playerContainer.classList.contains('rotate')) {
                            playerContainer.classList.remove('rotate');
                        } else {
                            playerContainer.classList.add('rotate');
                        }
                        if (playerContainer.classList.contains('rotate-neg')) {
                            playerContainer.classList.remove('rotate-neg');
                        }
                    }
                    break;
            }
        }
    });
}

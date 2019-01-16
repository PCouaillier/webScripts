export function CssClasse(className: string) {
    return {
        className: className,
        toString: () => '.' + className,
    };
}

export function CssDocument(args: object[]) {
    return {
        inner: args,
        toString: () => args.map(a => a.toString()).join(''),
    };
}

export function CssSelector(s: object|string, a: object[]) {
    let selector = (typeof(s) === 'string' ? s : s.toString())
                + '{' + a.map(b => b.toString() + ';').join('') + '}';
    return {
        selector: s,
        a: a,
        toString: () => selector,
    };
}

export function CssProperty(name: string, value: string) {
    return {
        name: name,
        value: value,
        toString: () => name + ':' + value,
    };
}

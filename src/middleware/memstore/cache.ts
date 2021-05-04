
const _globalCache: {[key:string]: string[]} = {};

export async function store (id: string, data: string) {
    try {        
        if (!_globalCache[id]) {
            _globalCache[id] = [];
        }
        _globalCache[id].push(data);
        return 0;
    } catch(e) {
        throw (e);
    }
}

export async function get(id: string) {
    try {        
        if (!_globalCache[id] || _globalCache[id].length === 0) {
            res.statusCode = 404;
            res.end();
        } else {
            const data = _globalCache[id].shift();

            res.statusCode = 200
            res.end(data);
        }
    } catch(e) {
        next(e);
    }
}
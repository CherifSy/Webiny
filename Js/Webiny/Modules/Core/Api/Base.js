import ApiResponse from './Response';
import Http from './../Http/Http';

function handleResponse(response) {
    return new ApiResponse(response);
}

function sanitize(string) {
    return _.trimStart(string, '/ ');
}

class Base {

    constructor(url) {
        this.baseUrl = url.toLowerCase();
    }

    get(url = '', body = {}, config = {}) {
        return Http.get(webinyApiUrl + this.baseUrl + '/' + sanitize(url), body, config).then(handleResponse).catch(handleResponse);
    }

    delete(url = '', config = {}) {
        return Http.delete(webinyApiUrl + this.baseUrl + '/' + sanitize(url), config).then(handleResponse).catch(handleResponse);
    }

    head(url = '', config = {}) {
        return Http.head(webinyApiUrl + this.baseUrl + '/' + sanitize(url), config).then(handleResponse).catch(handleResponse);
    }

    post(url = '', body = {}, query = {}, config = {}) {
        return Http.post(webinyApiUrl + this.baseUrl + '/' + sanitize(url), body, query, config).then(handleResponse).catch(handleResponse);
    }

    put(url = '', body = {}, query = {}, config = {}) {
        return Http.put(webinyApiUrl + this.baseUrl + '/' + sanitize(url), body, query, config).then(handleResponse).catch(handleResponse);
    }

    patch(url = '', body = {}, query = {}, config = {}) {
        return Http.patch(webinyApiUrl + this.baseUrl + '/' + sanitize(url), body, query, config).then(handleResponse).catch(handleResponse);
    }
}

export default Base;

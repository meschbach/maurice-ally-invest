const oauth = require('oauth');
const _ = require('lodash');

class tradekingApi {
  constructor(options) {
    const isValidCredentials = this._validateCredentials(options);
    if (!isValidCredentials) {
      this.throwError('Invalid Credentials');
      return false;
    }

    this.options = options;
    this.apiEndPoint = 'https://api.tradeking.com/v1';
    this.responseType = 'json';
    this.tradekingClient = new oauth.OAuth(
      'https://developers.tradeking.com/oauth/request_token',
      'https://developers.tradeking.com/oauth/access_token',
      this.options.consumerKey,
      this.options.consumerSecret,
      '1.0',
      this.options.callback,
      'HMAC-SHA1'
    );
  }

  _validateCredentials(credentials) {
    if (!credentials) return false;

    const {
      consumerKey,
      consumerSecret,
      oauthToken,
      oauthTokenSecret,
    } = credentials;

    return consumerKey && consumerSecret && oauthToken && oauthTokenSecret;
  }

  _getApiEndPoint(endpoint, queryParam, stream = false) {
    let url = `${this.apiEndPoint}/${endpoint}.${this.responseType}`;
    if (queryParam) {
      url = `${this.apiEndPoint}/${endpoint}.${this.responseType}?${queryParam}`;
    } 

    if (stream) {
      url = url.replace(/api/i, 'stream');
    }

    return new Promise((resolve, reject) => {
      this.tradekingClient.get(
        url,
        this.options.oauthToken,
        this.options.oauthTokenSecret,
        (error, data, response) => {
          if (error) reject(error);
          if (this.responseType === 'xml') resolve(data);
          return resolve(JSON.parse(data));
        }
      );
    });
  }

  _validateId(id) {
    if (!id) this._throwError('You must pass an account id');
  }

  _throwError(message) {
    throw new Error(message);
  }

  _fieldIsArrayOrSingle({ field, fieldName }) {
    if (_.isArray(field) && !field.length) {
      this._throwError(`You must pass at least one element for ${fieldName}`);
    }

    if (_.isString(field) && !field) {
      this._throwError(`You must pass a value for ${fieldName}`);
    }

    if (!_.isString(field) && !_.isArray(field)) this._throwError(`Invalid type ${typeof field} for ${fieldName}`);
  }

  setResponseType(type) {
    switch (type) {
      case 'json': this.responseType = type; break;
      case 'xml': this.responseType = type; break;
      default :
        console.log('You passed an invalid response type, default will be used');
        this.responseType = 'json';
        break;
    }
  }

  getResponseType() {
    return this.responseType;
  }

  accounts(id) {
    if (id) return this.getApiEndPoint(`accounts/${id}`);
    return this._getApiEndPoint('accounts');
  }

  accountBalances() {
    return this._getApiEndPoint('accounts/balances');
  }

  accountOrders(id) {
    this._validateId(id);
    return this._getApiEndPoint(`accounts/${id}/orders`);
  }

  balanceForAccount(id) {
    this._validateId(id);
    return this._getApiEndPoint(`accounts/${id}/balances`);
  }

  historyForAccount(id) {
    this._validateId(id);
    return this._getApiEndPoint(`accounts/${id}/history`);
  }

  marketClock() {
    return this._getApiEndPoint(`market/clock`);
  }

  marketTopLists({ listType, exchange = 'N' }) {
    const validListTypes = [
      'toplosers',
      'toppctlosers',
      'topvolume',
      'topactive',
      'topgainers',
      'toppctgainers'
    ];
    const validExchanges = ['A','N','Q','U','V'];
    const upperCaseExchange = exchange.toUpperCase();
    if (!validListTypes.includes(listType)) this._throwError('Invalid listType supplied');
    if (!validExchanges.includes(upperCaseExchange)) this._throwError('Invalid exchange supplied');

    return this._getApiEndPoint(`market/toplists/${listType}`,`exchange=${upperCaseExchange}`);
  }

  marketNewsSearch({ symbols, maxhits = 10, startdate, enddate }) {
    this._fieldIsArrayOrSingle({ field: symbols, fieldName: 'symbols' });
    let formatedSymbols = symbols;
    if (_.isArray(symbols)) {
      formatedSymbols = formatedSymbols.join(',');
    }
    return this._getApiEndPoint(`market/news/search`, `symbols=${symbols}&maxhits=${maxhits}`);
  }

  memberProfile() {
    return this._getApiEndPoint(`member/profile`);
  }

  getMarketQuotesForSymbols({ symbols, dataFields, stream = false }) {
    this._fieldIsArrayOrSingle({ field: symbols, fieldName: 'symbols'});
    let formatedSymbols = symbols;
    if (_.isArray(symbols)) {
      formatedSymbols = formatedSymbols.join(',');
    }
    if (stream) return this._getApiEndPoint(`market/quotes`, `symbols=${symbols}`, stream);
    return this._getApiEndPoint(`market/ext/quotes`, `symbols=${symbols}`, stream);
  }

  streamMarketQuotesForSymbols(options) {
    options.stream = true;
    return this.getMarketQuotesForSymbols(options);
  }

  utilityStatus() {
    return this._getApiEndPoint(`utility/status`);
  }

}

module.exports =  tradekingApi;

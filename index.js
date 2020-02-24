const oauth = require('oauth');
const _ = require('lodash');
const js2xmlparser = require("js2xmlparser");

class tradekingApi {
  constructor(options) {
    const isValidCredentials = this._validateCredentials(options);
    if (!isValidCredentials) {
      this._throwError('Invalid Credentials');
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

  _getApiEndPoint(endpoint, queryParam, stream = false, options = { useGet: true, postBody: null }) {
    let url = `${this.apiEndPoint}/${endpoint}.${this.responseType}`;
    if (queryParam) {
      url = `${this.apiEndPoint}/${endpoint}.${this.responseType}?${queryParam}`;
    } 

    if (stream) {
      url = url.replace(/api/i, 'stream');
    }

    return new Promise((resolve, reject) => {
      if (options.useGet) {
        this.tradekingClient.get(
          url,
          this.options.oauthToken,
          this.options.oauthTokenSecret,
          (error, data, response) => {
            if (error) reject(error);
            if (this.responseType === 'xml') return resolve(data);
            return resolve(JSON.parse(data));
          }
        );
      } else {
        this.tradekingClient.post(
          url,
          this.options.oauthToken,
          this.options.oauthTokenSecret,
          options.postBody,
          (error, data, response) => {
            if (error) reject(error);
            if (this.responseType === 'xml') return resolve(data);
            return resolve(JSON.parse(data));
          }
        );
      } 
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

  _buildFxml(body) {
    const options = { declaration: { include: false }};
    const fixmlRoot = {
      '@': {
        xmlns:"http://www.fixprotocol.org/FIXML-5-0-SP2",
      },
      body,
    };
    return js2xmlparser("FIXML", fixmlRoot, options);
  }

  _trimQueryStrings(strings, ...values) {
    let queryString = '';
    _(strings).forEach((string, key) => {
      if (!values[key]) return false;
      queryString += queryString + string  + values[key];
    });

    return queryString;
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
  
  postAccountOrder(id, order) {
   this._validateId(id);
   const postBody = this._buildFxml(order);
   return this._getApiEndPoint(`accounts/${id}/orders`, null, null, { useGet: false, postBody });
  }
  
  balanceForAccount(id) {
    this._validateId(id);
    return this._getApiEndPoint(`accounts/${id}/balances`);
  }

  historyForAccount(id, range = 'all', transactions = 'all') {
    this._validateId(id);
    const validRangeTypes = [
      'all',
      'today',
      'current_week',
      'current_month',
      'last_month'
    ];
    const validTransactionTypes = [
      'all',
      'bookkeeping',
      'trade'
    ];
    if (range && !validRangeTypes.includes(range)) this._throwError('Invalid range passed');
    if (transactions && !validTransactionTypes.includes(transactions)) this._throwError('Invalid transaction passed');
    
    return this._getApiEndPoint(`accounts/${id}/history`, this._trimQueryStrings`range=${range}&transactions=${transactions}`);
  }
  
  holdingsForAccount(id) {
    this._validateId(id);
    return this._getApiEndPoint(`accounts/${id}/holdings`);
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
    return this._getApiEndPoint(`market/news/search`, this._trimQueryStrings`symbols=${symbols}&maxhits=${maxhits}&startdate=${startdate}&enddate=${enddate}`);
  }

  memberProfile() {
    return this._getApiEndPoint(`member/profile`);
  }

  getMarketQuotesForSymbols({ symbols, fids, stream = false }) {
    this._fieldIsArrayOrSingle({ field: symbols, fieldName: 'symbols'});
    if (fids) this._fieldIsArrayOrSingle({ field: fids, fieldName: 'fids'});
    let formatedSymbols = symbols;
    let formatedFids = fids;
    if (_.isArray(symbols)) {
      formatedSymbols = formatedSymbols.join(',');
    }
    if (_.isArray(fids)) {
      formatedFids = formatedFids.join(',');
    }
    console.log(formatedSymbols, this._trimQueryStrings`symbols=${formatedSymbols}&fids${formatedFids}`)
    if (stream) return this._getApiEndPoint(`market/quotes`, this._trimQueryStrings`symbols=${formatedSymbols}&fids=${formatedFids}`, stream);
    return this._getApiEndPoint(`market/ext/quotes`, this._trimQueryStrings`symbols=${formatedSymbols}&fids${formatedFids}`, stream);
  }

  streamMarketQuotesForSymbols(options) {
    options.stream = true;
    return this.getMarketQuotesForSymbols(options);
  }

  utilityStatus() {
    return this._getApiEndPoint(`utility/status`);
  }

  watchLists(watchListName) {
    if (watchListName) return this._getApiEndPoint(`watchlists/${watchListName}`);
    return this._getApiEndPoint(`watchlists`);
  }

  newWatchList(watchListName, symbols) {
    this._fieldIsArrayOrSingle({ field: symbols, fieldName: 'symbols'});
    if (!watchListName) this._throwError('You must pass a watch list name');
    let formatedSymbols = symbols;
    if (_.isArray(symbols)) {
      formatedSymbols = formatedSymbols.join(',');
    }
    return this._getApiEndPoint(`watchlists`, `id=${watchListName}&symbols=${formatedSymbols}`, null, { useGet: false, postBody: null });
  }
}

module.exports =  tradekingApi;

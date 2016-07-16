# trade-king-api
Abstraction for tradeking api

## Install
> npm install --save trade-king-api
## Init
```javascript
const tradeKingApi = require('trade-king-api');

// Setup key/secret for authentication and API endpoint URL
const configuration = {
consumerKey: 'Your key',
             consumerSecret: 'Secret',
             oauthToken: 'Token',
             oauthTokenSecret: 'TokenSecret',
};
const tradekingClient = new tradeKingApi(configuration);
tradekingClient.setResponseType('xml');

```
## Api
___

### setResponseType(type) 
Sets the default response type for every request returned. Valid types are 'xml' and 'json'.
Note default response type is json.

### getResponseType()
returns the current default response type

### accounts([accountId]) 
This  will return detailed balance and holding information for each account associated with the current user if accountId is not provided. Else it will return detailed balance and holding information for the accountId passed.

### accountBalances()
This call will return summary balance information for each account associated with the current user as well as the total value for all accounts associated with the user.


### accountOrders(accountNumber)
This call will return the most recent orders for the account number passed.

### postAccountOrder(accountId, order)

This call will allow you to place an order. This requires the order data is submitted in FIXML format submitted as XML within the body.
Example:
``` javascript
const postOrder = {
order: {
         '@': {
TmInForce: '0',
           Typ: '1',
           Side: '1',
           Acct: '12345678',
         },
Instrmt: {
           '@': {
SecTyp: 'CS',
        Sym: 'GE',
           }
         },
OrdQty: {
Qty: '1'
        }
       }
};

const tradekingClient = new tradeKingApi(configuration);
tradekingClient.setResponseType('xml');
tradekingClient.postAccountOrder('11111111', postOrder).then(response => {
    console.log(response);
    }).catch(err => {
      console.log('error');
      console.log(err);
      });
```

### balanceForAccount(accountId)
This will return detailed balance information for the account id.

###  historyForAccount(accountId, [range], [transactions]) 
This will return account activity for the account id specified in the URI. This call supports optional date range or transaction type filters.

###  holdingsForAccount(accountId)
This will return detailed information about the holdings for the account id.

###  marketClock()
This will return the current state of the market, the time of the next state change (if the market is open), and the current server timestamp.

###  marketTopLists({ listType, [exchange = 'N'] }) 
This call will return a ranked list based on the list type specified. You can also pass a value for exchange to change the default New York Stock Exchange

###  marketNewsSearch({ symbols, [maxhits = 10], [startdate], [enddate] })
This will return a listing of news headlines based on the current symbol(s).Note pass a string for a single symbol or an array of string symbols.
###  memberProfile()
This will return general information associated with the user. More importantly it will also return all of the account numbers and account information for the user.
### getMarketQuotesForSymbols({ symbols, [fids] })
This will return quotes for a symbol or list of symbols. Pass a string for a single fid or an array of fids. The fids parameter should be used when a customized list of fields is desired. By default, all applicable data fields are returned.

### streamMarketQuotesForSymbols({ symbols, [fids] })
Same as getMarketQuotesForSymbols but streams the data.

### utilityStatus()
This will return the current server timestamp if the API and its backend systems are accessible. Otherwise it will return an error.
### watchLists([watchListId])
This will retrieve a list of watchlists for the authenticated user if no watchListId is passed. Or will get the watchlist specified.
### newWatchList(watchListId, symbols)
This will create a watchlist with the specified id for the authenticated user.


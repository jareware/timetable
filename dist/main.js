'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var apiUrl = "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";

var StopSearch = function (_React$Component) {
  _inherits(StopSearch, _React$Component);

  function StopSearch(props) {
    _classCallCheck(this, StopSearch);

    var _this = _possibleConstructorReturn(this, (StopSearch.__proto__ || Object.getPrototypeOf(StopSearch)).call(this, props));

    _this.state = {
      value: '',
      results: []
    };

    _this.handleChange = _this.handleChange.bind(_this);
    _this.handleSubmit = _this.handleSubmit.bind(_this);
    _this.queryStops = _lodash2.default.debounce(_this.queryStops, 500);
    return _this;
  }

  _createClass(StopSearch, [{
    key: 'handleChange',
    value: function handleChange(event) {
      var newVal = event.target.value;
      this.setState({ value: event.target.value });
      this.queryStops(newVal);
    }
  }, {
    key: 'handleSubmit',
    value: function handleSubmit(event) {
      event.preventDefault();
    }
  }, {
    key: 'queryStops',
    value: function queryStops(name) {
      var _this2 = this;

      (0, _nodeFetch2.default)(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ "query": "{stops(name: \"" + name + "\") {name gtfsId code}}" }),
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        return res.json();
      }).then(function (json) {
        return _this2.setState({ results: json.data.stops });
      }).catch(function (err) {
        return console.log(err);
      });
    }
  }, {
    key: 'searchResults',
    value: function searchResults() {
      var resultsList = this.state.results.filter(function (res) {
        return res.gtfsId;
      }).map(function (res) {
        return React.createElement(
          'a',
          { key: res.gtfsId, href: '?stop=' + res.gtfsId, className: 'list-group-item' },
          React.createElement(
            'h4',
            { className: 'list-group-item-heading' },
            res.name || 'Pysäkki'
          ),
          React.createElement(
            'p',
            { className: 'list-group-item-text' },
            res.code + ' ' || '',
            React.createElement(
              'span',
              { className: 'small' },
              res.gtfsId
            )
          )
        );
      });

      var content = void 0;
      if (this.state.value) {
        content = React.createElement(
          'div',
          { className: 'stop-search-results' },
          React.createElement(
            'h3',
            null,
            'Valitse pys\xE4kki'
          ),
          React.createElement(
            'div',
            { className: 'list-group' },
            resultsList.length ? resultsList : React.createElement('div', null)
          )
        );
      }

      return content;
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'container' },
        React.createElement(
          'form',
          { onSubmit: this.handleSubmit },
          React.createElement('label', { htmlFor: 'inputStop', 'aria-label': 'Pys\xE4kkihaku' }),
          React.createElement('input', { id: 'inputStop', className: 'form-control', type: 'text',
            value: this.state.value, onChange: this.handleChange,
            autoComplete: 'off', placeholder: 'Sy\xF6t\xE4 pys\xE4kin nimi tai tunnus' })
        ),
        this.searchResults()
      );
    }
  }]);

  return StopSearch;
}(React.Component);

var TimeTable = function (_React$Component2) {
  _inherits(TimeTable, _React$Component2);

  function TimeTable(props) {
    _classCallCheck(this, TimeTable);

    var _this3 = _possibleConstructorReturn(this, (TimeTable.__proto__ || Object.getPrototypeOf(TimeTable)).call(this, props));

    var stopId = props.stopId;
    _this3.queryStop(stopId);

    _this3.state = {
      stop: stopId ? { 'id': stopId } : '',
      timetable: []
    };

    _this3.queryStop = _lodash2.default.debounce(_this3.queryStop, 500);
    return _this3;
  }

  _createClass(TimeTable, [{
    key: 'queryStop',
    value: function queryStop(stopId) {
      var _this4 = this;

      if (stopId) {
        (0, _nodeFetch2.default)(apiUrl, {
          method: 'POST',
          body: JSON.stringify({ "query": "{stop(id: \"" + stopId + "\") {name code}}" }),
          headers: { 'Content-Type': 'application/json' }
        }).then(function (res) {
          return res.json();
        }).then(function (json) {
          var result = json.data.stop;
          if (result) {
            _this4.setState({
              stop: { 'id': stopId, 'code': result.code, 'name': result.name }
            });
          }
        }).catch(function (err) {
          return console.log(err);
        });
      }
    }
  }, {
    key: 'timeTable',
    value: function timeTable() {
      var rows = this.state.timetable.map(function (row) {
        return React.createElement(
          'tr',
          { key: row.line + '-' + row.time },
          React.createElement(
            'td',
            { className: 'time' },
            row.time
          ),
          React.createElement(
            'td',
            { className: 'line' },
            row.line
          ),
          React.createElement(
            'td',
            { className: 'dest' },
            row.dest || ''
          )
        );
      });

      return React.createElement(
        'table',
        { className: 'table table-striped' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'th',
              null,
              'Aika'
            ),
            React.createElement(
              'th',
              null,
              'Linja'
            ),
            React.createElement(
              'th',
              null,
              'M\xE4\xE4r\xE4np\xE4\xE4'
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          rows
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var content = void 0;
      var stop = this.state.stop;
      var timetable = this.state.timetable;
      if (!stop.name) {
        // TODO: change into !timetable
        content = React.createElement(
          'div',
          { className: 'loading' },
          'Ladataan...'
        );
      } else {
        content = React.createElement(
          'div',
          { className: 'timetable' },
          React.createElement(
            'div',
            { className: 'stop-details' },
            React.createElement(
              'h4',
              { className: 'list-group-item-heading' },
              (stop.name || '') + ' '
            ),
            React.createElement(
              'span',
              { className: 'list-group-item-text' },
              stop.code || stop.gtfsId
            )
          ),
          this.timeTable()
        );
      }
      return content;
    }
  }]);

  return TimeTable;
}(React.Component);

var App = function (_React$Component3) {
  _inherits(App, _React$Component3);

  function App(props) {
    _classCallCheck(this, App);

    var _this5 = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

    var stopId = _this5.getStopQueryParam();

    _this5.state = {
      stopId: stopId ? stopId : ''
    };
    return _this5;
  }

  _createClass(App, [{
    key: 'getStopQueryParam',
    value: function getStopQueryParam() {
      var params = window.location.search.substr(1);
      var stopParam = params.split('&').find(function (item) {
        return item.split('=')[0] === 'stop' ? true : false;
      });
      var stopId = stopParam ? stopParam.split('=')[1] : '';
      return stopId;
    }
  }, {
    key: 'render',
    value: function render() {
      var stopId = this.state.stopId;
      if (stopId) {
        return React.createElement(TimeTable, { stopId: stopId });
      } else {
        return React.createElement(StopSearch, null);
      }
    }
  }]);

  return App;
}(React.Component);

ReactDOM.render(React.createElement(App, null), document.getElementById('container'));
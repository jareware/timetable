'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var StopForm = function (_React$Component) {
  _inherits(StopForm, _React$Component);

  function StopForm(props) {
    _classCallCheck(this, StopForm);

    var _this = _possibleConstructorReturn(this, (StopForm.__proto__ || Object.getPrototypeOf(StopForm)).call(this, props));

    var stopId = _this.getStopQueryParam();
    var stop = _this.getStopDetails(stopId);
    var timetable = _this.getStopTimetable(stopId);

    _this.state = {
      stop: stop,
      timetable: timetable,
      value: 'E2114',
      results: []
    };

    _this.handleChange = _this.handleChange.bind(_this);
    _this.handleSubmit = _this.handleSubmit.bind(_this);
    return _this;
  }

  _createClass(StopForm, [{
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
    key: 'getStopDetails',
    value: function getStopDetails(stopId) {
      // TODO: get actual stop details (=name)
      var stop = stopId ? { 'id': stopId, 'name': 'Pysäkki' } : '';
      return stop;
    }
  }, {
    key: 'getStopTimetable',
    value: function getStopTimetable(stopId) {
      // TODO: get actual timetable
      var timetable = stopId ? [{ 'time': '07:14', 'line': '109', 'dest': 'Kamppi' }, { 'time': '07:15', 'line': '109', 'dest': 'Kamppi' }, { 'time': '07:16', 'line': '109', 'dest': 'Kamppi' }] : [];
      return timetable;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (!this.state.stop) {
        this.nameInput.focus();
      }
    }
  }, {
    key: 'handleChange',
    value: function handleChange(event) {
      // TODO: get actual results
      var results = [{ 'id': event.target.value }];
      this.setState({ value: event.target.value, results: results });
    }
  }, {
    key: 'handleSubmit',
    value: function handleSubmit(event) {
      event.preventDefault();
    }
  }, {
    key: 'searchResults',
    value: function searchResults() {
      var resultsList = this.state.results.map(function (res) {
        return React.createElement(
          'a',
          { key: res.id, href: '?stop=' + res.id, className: 'list-group-item' },
          React.createElement(
            'h4',
            { className: 'list-group-item-heading' },
            res.name || 'Pysäkki'
          ),
          React.createElement(
            'p',
            { className: 'list-group-item-text' },
            res.id || 'numero'
          )
        );
      });

      return React.createElement(
        'div',
        { className: 'stop-search-results' },
        React.createElement(
          'h3',
          null,
          'Tulokset'
        ),
        React.createElement(
          'div',
          { className: 'list-group' },
          resultsList
        )
      );
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
      var _this2 = this;

      var content = void 0;
      var stop = this.state.stop;
      if (stop) {
        content = React.createElement(
          'div',
          { className: 'timetable' },
          React.createElement(
            'div',
            { className: 'stop-details' },
            React.createElement(
              'h4',
              { className: 'list-group-item-heading' },
              (stop.name || 'Pysäkki') + ' '
            ),
            React.createElement(
              'span',
              { className: 'list-group-item-text' },
              stop.id || 'numero'
            )
          ),
          this.timeTable()
        );
      } else {
        content = React.createElement(
          'div',
          { className: 'container' },
          React.createElement(
            'h2',
            { className: 'title' },
            'Aikataulut'
          ),
          React.createElement(
            'form',
            { onSubmit: this.handleSubmit },
            React.createElement(
              'label',
              { htmlFor: 'inputStop' },
              'Pys\xE4kin numero'
            ),
            React.createElement('input', { ref: function ref(input) {
                _this2.nameInput = input;
              }, id: 'inputStop', className: 'form-control', type: 'text', value: this.state.value, onChange: this.handleChange, autoComplete: 'off' })
          ),
          this.searchResults()
        );
      }
      return content;
    }
  }]);

  return StopForm;
}(React.Component);

ReactDOM.render(React.createElement(StopForm, null), document.getElementById('container'));
'use strict';

let _ = require('lodash');
let fetch = require('node-fetch');

const apiUrl = "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";
const refreshInterval = 30000;

class StopSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      results: [],
      message: props.message
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClick = props.handleClick;
    this.closeModal = props.closeModal;
    this.queryStops = _.debounce(this.queryStops, 500);
  }

  handleChange(event) {
    let newVal = event.target.value;
    this.setState({value: event.target.value, message: null});
    this.queryStops(newVal);
  }

  handleSubmit(event) {
    // Hide on-screen keyboard on enter
    document.activeElement.blur();
    event.preventDefault();
  }

  queryStops(name) {
    fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({"query": "{stops(name: \"" + name + "\") {name gtfsId code}}"}),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
      .then(json => this.setState({results: json.data.stops}))
      .catch(err => console.log(err));
  }

  searchResults() {
    let resultsList = this.state.results.filter((res) => res.gtfsId).map((res) =>
      <button key={ res.gtfsId } className="list-group-item" onClick={ this.handleClick.bind(this, res.gtfsId) }>
        <h4 className="list-group-item-heading">{ res.name || 'Pysäkki' }</h4>
        <p className="list-group-item-text">{ (res.code + ' ') || '' }<span className="small">{ res.gtfsId }</span></p>
      </button>
    );

    let content;
    if (this.state.value) {
      content = (
        <div className="stop-search-results">
          <h3>Valitse pysäkki</h3>
          <div className="list-group">
            { resultsList.length ? resultsList : <div>Ei hakutuloksia</div>}
          </div>
        </div>
      );
    }

    return content;
  }

  render() {
    return (
      <div className="add-stop-modal">
        <div className="add-stop-container">
          <button className="close" aria-label="Sulje pysäkkihaku" onClick={ this.closeModal }>
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
          <form onSubmit={ this.handleSubmit }>
            <label htmlFor="inputStop" aria-label="Pysäkkihaku"></label>
            <input id="inputStop" className="form-control" type="text"
              value={ this.state.value } onChange={ this.handleChange }
              autoComplete="off" placeholder="Syötä pysäkin nimi tai tunnus"/>
          </form>
          { this.searchResults() }
        </div>
      </div>
    );
  }
}

class TimeTable extends React.Component {
  constructor(props) {
    super(props);

    let stopId = props.stopId;
    this.queryStop(stopId);
    this.startRefresher(stopId);

    this.state = {
      stop: stopId ? {'id': stopId} : '',
      timetable: [],
    };
  }

  startRefresher(stopId) {
    setInterval(this.queryStop.bind(this, stopId), refreshInterval);
  }

  queryStop(stopId) {
    if (stopId) {
      // Get from one minute ago to the future
      let now = Math.floor(Date.now() / 1000) - 60;
      let timeRange = 3600;
      let limit = 7;
      fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({"query":"query StopPage($id_0:String!,$startTime_1:Long!) {stop(id:$id_0) {id,...F1}} fragment F0 on Stoptime {scheduledDeparture,realtime,realtimeDeparture,stopHeadsign,trip {pattern {route {shortName}}}} fragment F1 on Stop {_stoptimesWithoutPatterns3xYh4D:stoptimesWithoutPatterns(startTime:$startTime_1,timeRange:"+timeRange+",numberOfDepartures:"+limit+") {...F0},code,name}",
          "variables":{"id_0":stopId,"startTime_1":now}}),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json())
        .then(json => {
          let result = json.data.stop;
          if (result) {
            this.setState({
              stop: {'id': stopId, 'code': result.code, 'name': result.name},
              timetable: this.processTimeTable(result._stoptimesWithoutPatterns3xYh4D)
            })
          }
        })
        .catch(err => console.log(err));
    }
  }

  parseTime(secs) {
    let hours = Math.floor(secs/(60*60));
    let minutes = Math.floor((secs - hours*60*60)/60);
    if (hours < 10) { hours = '0'+hours }
    if (minutes < 10) {minutes = '0'+minutes }
    return hours + ':' + minutes;
  }

  timeDiff(secs) {
    let dt = new Date();
    let nowSecs = dt.getSeconds() + (60 * dt.getMinutes()) + (60 * 60 * dt.getHours());
    let diff = Math.floor((secs - nowSecs)/60);
    return diff;
  }

  processTimeTable(data) {
    return data.map((item) => {
      let time = this.parseTime(item.scheduledDeparture);
      let min = this.timeDiff(item.scheduledDeparture);
      let realTime = this.parseTime(item.realtimeDeparture);
      let realMin = this.timeDiff(item.realtimeDeparture);
      return {
        'time': time,
        'min': min,
        'hasRealtime': item.realtime,
        'realTime': realTime,
        'realMin': realMin,
        'line': item.trip.pattern.route.shortName,
        'dest': item.stopHeadsign
      }
    });
  }

  timeTable() {
    let rows = this.state.timetable.map((row) => {
      let gone = row.hasRealTime ? row.realMin < 0 : row.min < 0;
      let realTime = row.hasRealtime ? <span className="realtime small">{ ' ('+row.realTime+')' }</span> : null;
      let minSpan = <span className="small">{ ' min' }</span>;
      return <tr key={ row.line + '-' + row.time } className={ gone ? 'gone' : '' }>
        <td className="time"><span>{ row.time }</span>{ realTime }</td>
        <td className="min">{ gone ? '-' : row.min }{ !gone ? minSpan : null }</td>
        <td className="line">{ row.line }</td>
        <td className="dest small">{ row.dest || '' }</td>
      </tr>
    });

    return (
      <table className="table table-striped">
        <thead className="small">
          <tr>
            <th className="col-xs-2 col-sm-2">Lähtee</th>
            <th className="col-xs-2 col-sm-2">Min</th>
            <th className="col-xs-1 col-sm-1"><i className="fa fa-bus" aria-hidden="true"></i></th>
            <th>Määränpää</th>
          </tr>
        </thead>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }

  render() {
    let content;
    let stop = this.state.stop;
    let timetable = this.state.timetable;
    if (!timetable) {
      content = (<div className="loading">Ladataan pysäkin { stop.id } tietoja...</div>);
    } else {
      content = (
        <div className="timetable">
          <div className="stop-details">
            <h4 className="list-group-item-heading">{ (stop.name || '') + ' '}</h4>
            <span className="list-group-item-text small">{ stop.code || stop.id }</span>
          </div>
          { this.timeTable() }
        </div>
      );
    }
    return content;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    let stopIds = this.getStopsFromHash();
    this.state = {
      stopIds: stopIds,
      modalOpen: stopIds.length ? false : true
    };

    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
  }

  getStopsFromHash() {
    return window.location.hash.substr(1).split(',').filter(String);
  }

  checkFormat(stopId) {
    let stopIdReg = /^HSL:\d{7}$/;
    return !!stopId.match(stopIdReg);
   }

  handleSelectStop(stopIds, stopId) {
    let newStops = stopIds.concat([stopId])
    this.setState({ stopIds: newStops, modalOpen: false})
    window.location.hash = newStops;
  }

  openModal() {
    this.setState({ modalOpen: true });
  }

  closeModal() {
    this.setState({ modalOpen: false });
  }

  removeStop(stopId, stopIds) {
    let index = stopIds.indexOf(stopId)
    if (index > -1) {
      stopIds.splice(index, 1)
    }
    this.setState({ stopIds: stopIds })
    window.location.hash = stopIds;
  }

  render() {
    let timetables = this.state.stopIds.map((stopId) => {
      let timetableContent;
      if (this.checkFormat(stopId)) {
        timetableContent = <TimeTable key={ stopId } stopId={ stopId }/>;
      } else {
        timetableContent = <div className="error-message">Virheellinen pysäkki-id: { stopId }</div>;
      }
      return (
        <div className="timetable-container col-sm-6">
          <button className="close" aria-label="Poista pysäkki" onClick={ this.removeStop.bind(this, stopId, this.state.stopIds) }>
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
          { timetableContent }
        </div>
      );
    });
    let addStopButton = <button className="btn btn-success add-stop" onClick={ this.openModal }><i className="fa fa-plus" aria-hidden="true"></i>Lisää pysäkki</button>;
    let content = (<div className="timetables">{ timetables }{ addStopButton }</div>);
    let modal;
    if (this.state.modalOpen) {
      modal = <StopSearch handleClick={ this.handleSelectStop.bind(this, this.state.stopIds) } closeModal={ this.closeModal }/>;
    }
    return (
      <div className="content">
        { content }
        { modal }
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('container')
);

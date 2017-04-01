import _ from 'lodash';
import fetch from 'node-fetch';

let apiUrl = "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";

class StopSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      results: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.queryStops = _.debounce(this.queryStops, 500);
  }

  handleChange(event) {
    let newVal = event.target.value;
    this.setState({value: event.target.value});
    this.queryStops(newVal);
  }

  handleSubmit(event) {
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
      <a key={ res.gtfsId } href={ '?stop=' + res.gtfsId } className="list-group-item">
        <h4 className="list-group-item-heading">{ res.name || 'Pysäkki' }</h4>
        <p className="list-group-item-text">{ (res.code + ' ') || '' }<span className="small">{ res.gtfsId }</span></p>
      </a>
    );

    let content;
    if (this.state.value) {
      content = (
        <div className="stop-search-results">
          <h3>Valitse pysäkki</h3>
          <div className="list-group">
            { resultsList.length ? resultsList : <div></div>}
          </div>
        </div>
      );
    }

    return content;
  }

  render() {
    return (
      <div className="container">
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="inputStop" aria-label="Pysäkkihaku"></label>
          <input id="inputStop" className="form-control" type="text"
            value={this.state.value} onChange={this.handleChange}
            autoComplete="off" placeholder="Syötä pysäkin nimi tai tunnus"/>
        </form>
        { this.searchResults() }
      </div>
    );
  }
}

class TimeTable extends React.Component {
  constructor(props) {
    super(props);

    let stopId = props.stopId;
    this.queryStop(stopId);

    this.state = {
      stop: stopId ? {'id': stopId} : '',
      timetable: [],
    };

    this.queryStop = _.debounce(this.queryStop, 500);
  }

  queryStop(stopId) {
    if (stopId) {
      // Get from one minute ago to the future
      let now = Math.floor(Date.now() / 1000) - 60;
      let timeRange = 3600;
      let limit = 10;
      fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({"query":"query StopPage($id_0:String!,$startTime_1:Long!) {stop(id:$id_0) {id,...F1}} fragment F0 on Stoptime {scheduledDeparture,stopHeadsign,trip {pattern {route {shortName}}}} fragment F1 on Stop {_stoptimesWithoutPatterns3xYh4D:stoptimesWithoutPatterns(startTime:$startTime_1,timeRange:"+timeRange+",numberOfDepartures:"+limit+") {...F0},code,name}",
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
    var hours = Math.floor(secs/(60*60));
    var minutes = Math.floor((secs - hours*60*60)/60);
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
      return {
        'time': time,
        'min': min,
        'line': item.trip.pattern.route.shortName,
        'dest': item.stopHeadsign
      }
    });
  }

  timeTable() {
    let rows = this.state.timetable.map((row) => {
      let gone = row.min < 0;
      return <tr key={ row.line + '-' + row.time } className={ gone ? 'gone' : '' }>
        <td className="time">{ row.time }</td>
        <td className="min">{ gone ? '-' : row.min+' min'}</td>
        <td className="line">{ row.line }</td>
        <td className="dest">{ row.dest || '' }</td>
      </tr>
    });

    return (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Aika</th>
            <th>Min</th>
            <th>Linja</th>
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
    if (!stop.name) { // TODO: change into !timetable
      content = (<div className="loading">Ladataan...</div>);
    } else {
      content = (
        <div className="timetable">
          <div className="stop-details">
            <h4 className="list-group-item-heading">{ (stop.name || '') + ' '}</h4>
            <span className="list-group-item-text">{ stop.code || stop.gtfsId }</span>
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

    let stopId = this.getStopQueryParam();

    this.state = {
      stopId: stopId ? stopId : ''
    };
  }

  getStopQueryParam() {
    let params = window.location.search.substr(1);
    let stopParam = params.split('&').find(function(item) {
      return item.split('=')[0] === 'stop' ? true : false;
    });
    let stopId = stopParam ? stopParam.split('=')[1] : '';
    return stopId;
  }

  render() {
    let stopId = this.state.stopId;
    if (stopId) {
      return <TimeTable stopId={ stopId }/>;
    } else {
      return <StopSearch />;
    }
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('container')
);

import _ from 'lodash';
import fetch from 'node-fetch';

let apiUrl = "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";

class StopForm extends React.Component {
  constructor(props) {
    super(props);

    let stopId = this.getStopQueryParam();
    let stop = this.getStopDetails(stopId);
    let timetable = this.getStopTimetable(stopId);

    this.state = {
      stop: stop,
      timetable: timetable,
      value: '',
      results: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.queryStops = _.debounce(this.queryStops, 500);
  }

  queryStops(name) {
    fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({"query": "{stops(name: \"" + name + "\") {name gtfsId}}"}),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(json => this.setState({results: json.data.stops}));
  }

  getStopQueryParam() {
    let params = window.location.search.substr(1);
    let stopParam = params.split('&').find(function(item) {
      return item.split('=')[0] === 'stop' ? true : false;
    });
    let stopId = stopParam ? stopParam.split('=')[1] : '';
    return stopId;
  }

  getStopDetails(stopId) {
    // TODO: get actual stop details (=name)
    let stop = stopId ? {'id': stopId, 'name': 'Pysäkki'} : '';

    return stop;
  }

  getStopTimetable(stopId) {
    // TODO: get actual timetable
    let timetable = stopId ? [{'time': '07:14', 'line': '109', 'dest': 'Kamppi'},{'time': '07:15', 'line': '109', 'dest': 'Kamppi'},{'time': '07:16', 'line': '109', 'dest': 'Kamppi'}] : [];
    return timetable;
  }

  handleChange(event) {
    // TODO: get actual results
    let newVal = event.target.value;
    this.setState({value: event.target.value});
    this.queryStops(newVal);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  searchResults() {
    let resultsList = this.state.results.map((res) =>
      <a key={ res.gtfsId } href={ '?stop=' + res.gtfsId } className="list-group-item">
        <h4 className="list-group-item-heading">{ res.name || 'Pysäkki' }</h4>
        <p className="list-group-item-text">{ res.gtfsId || 'numero' }</p>
      </a>
    );

    let content;
    if (this.state.value) {
      content = (
        <div className="stop-search-results">
          <h3>Valitse pysäkki</h3>
          <div className="list-group">
            { resultsList.length ? resultsList : <div>Ei tuloksia</div>}
          </div>
        </div>
      );
    }

    return content;
  }

  timeTable() {
    let rows = this.state.timetable.map((row) =>
      <tr key={ row.line + '-' + row.time }>
        <td className="time">{ row.time }</td>
        <td className="line">{ row.line }</td>
        <td className="dest">{ row.dest || '' }</td>
      </tr>
    );

    return (
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Aika</th>
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
    if (stop) {
      content = (
        <div className="timetable">
          <div className="stop-details">
            <h4 className="list-group-item-heading">{ (stop.name || 'Pysäkki') + ' '}</h4>
            <span className="list-group-item-text">{ stop.id || 'numero' }</span>
          </div>
          { this.timeTable() }
        </div>
      );
    } else {
      content = (
        <div className="container">
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="inputStop" aria-label="Pysäkkihaku"></label>
            <input ref={(input) => { this.nameInput = input; }} id="inputStop" className="form-control" type="text" value={this.state.value} onChange={this.handleChange} autoComplete="off" placeholder="Syötä pysäkin nimi tai tunnus"/>
          </form>
          { this.searchResults() }
        </div>
      );
    }
    return content;
  }
}

ReactDOM.render(
  <StopForm />,
  document.getElementById('container')
);

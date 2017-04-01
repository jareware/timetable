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
    let results = newVal ? [{'id': newVal}] : [];
    this.setState({value: event.target.value, results: results});
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  searchResults() {
    let resultsList = this.state.results.map((res) =>
      <a key={ res.id } href={ '?stop=' + res.id } className="list-group-item">
        <h4 className="list-group-item-heading">{ res.name || 'Pysäkki' }</h4>
        <p className="list-group-item-text">{ res.id || 'numero' }</p>
      </a>
    );

    let content;
    if (resultsList.length) {
      content = (
        <div className="stop-search-results">
          <h3>Tulokset</h3>
          <div className="list-group">
            { resultsList }
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
          <h2 className="title">Aikataulut</h2>
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="inputStop">Pysäkin numero</label>
            <input ref={(input) => { this.nameInput = input; }} id="inputStop" className="form-control" type="text" value={this.state.value} onChange={this.handleChange} autoComplete="off"/>
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

'use strict';

let _ = require('lodash');
let fetch = require('node-fetch');

const apiUrl = "https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql";
const refreshInterval = 30000;
const rowLimit = 35;
const rowCount = 7;

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
    this.clickOnModal = this.clickOnModal.bind(this);
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

  clickOnModal(event) {
    if (event.target == event.currentTarget) {
      this.closeModal();
    }
  }

  render() {
    return (
      <div className="add-stop-modal" onClick={ this.clickOnModal }>
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
      limit: rowCount,
      visibleRows: [],
      hideShowMore: true,
      lines: [],
      selectedLines: []
    };
  }

  setVisibleRows(addCount=0, newSelectedLines) {
    let timetable = this.state.timetable;
    let selectedLines = newSelectedLines || this.state.selectedLines;
    let filteredRows = timetable.filter((item) => {
      return this.isSelected(item.line, selectedLines);
    });
    let showAll = this.isSelected('all', selectedLines) || selectedLines.length === 0;
    let rows = showAll ? timetable : filteredRows;
    let limit = Math.min(this.state.limit + addCount, rowLimit, rows.length);
    let visibleRows = rows.slice(0, limit);
    let hideShowMore = limit >= rows.length;
    this.setState({
      visibleRows: visibleRows,
      limit: Math.max(limit, rowCount),
      hideShowMore: hideShowMore,
      selectedLines: selectedLines
    });
  }

  startRefresher(stopId) {
    setInterval(this.queryStop.bind(this, stopId), refreshInterval);
  }

  queryStop(stopId) {
    if (stopId) {
      // Default: from one minute ago to one hour to the future
      let now = new Date();
      let start = Math.floor(now.getTime() / 1000) - 60;
      let date = now.toISOString().slice(0,10).replace(/[-]/g,"");
      let timeRange = 3600;
      fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          "query":"query StopPage($id_0:String!,$startTime_1:Long!) "
            +"{stop(id:$id_0) {id,...F2}} fragment F0 on Stoptime "
            +"{scheduledDeparture,realtime,realtimeDeparture,stopHeadsign,trip "
            +"{pattern {route {shortName}}}} fragment F1 on Stop "

            +"{url,_stoptimesForServiceDateyplyP:stoptimesForServiceDate(date:\""
            +date+"\") {pattern {headsign,code,route "
            +"{id,shortName,longName,mode,agency {id,name}},id},stoptimes "
            +"{scheduledDeparture,serviceDay,headsign,pickupType}},id} "
            +"fragment F2 on Stop "

            +"{_stoptimesWithoutPatterns3xYh4D:stoptimesWithoutPatterns"
            +"(startTime:$startTime_1,timeRange:"+timeRange
            +",numberOfDepartures:"+rowLimit+") {...F0},code,name,...F1}",
          "variables":{"id_0":stopId,"startTime_1":start}
        }),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json())
        .then(json => {
          let result = json.data.stop;
          if (result) {
            this.setState({
              stop: {'id': stopId, 'code': result.code, 'name': result.name},
              timetable: this.processTimeTable(result._stoptimesWithoutPatterns3xYh4D),
              lines: this.processLines(result._stoptimesForServiceDateyplyP)
            });
            this.setVisibleRows();
          }
        })
        .catch(err => console.log(err));
    }
  }

  processLines(data) {
    let lines = data.map((item) => {
      return item.pattern.route.shortName;
    });
    let uniqueLines = _.uniq(lines);
    let sortedLines = _.sortBy(uniqueLines, [(line) => {
      return parseInt(line);
    }, (line) => {
      return line;
    }]);
    return sortedLines;
  }

  refSecsToSecs(refSecs) {
    // The night buses use the start of the previous day as a reference
    let oneDay = 60 * 60 * 24;
    let secs = refSecs > oneDay ? (refSecs - oneDay) : refSecs;
    return secs;
  }

  parseTime(refSecs) {
    let secs = this.refSecsToSecs(refSecs);
    let hours = Math.floor(secs/(60*60));
    let minutes = Math.floor((secs - hours*60*60)/60);
    if (hours < 10) { hours = '0'+hours }
    if (minutes < 10) {minutes = '0'+minutes }
    return hours + ':' + minutes;
  }

  timeDiff(refSecs) {
    let dt = new Date();
    let nowSecs = dt.getSeconds() + (60 * dt.getMinutes()) + (60 * 60 * dt.getHours());
    let secs = this.refSecsToSecs(refSecs);
    let diff = Math.floor((secs - nowSecs)/60);
    return diff;
  }

  processTimeTable(data) {
    return data.map((item) => {
      let time = this.parseTime(item.scheduledDeparture);
      let realTime = this.parseTime(item.realtimeDeparture);
      let min = this.timeDiff(item.realtimeDeparture);
      return {
        'time': time,
        'min': min,
        'hasRealtime': item.realtime,
        'realTime': realTime,
        'line': item.trip.pattern.route.shortName,
        'dest': item.stopHeadsign
      }
    });
  }

  isSelected(line, selectedLines) {
    let lines = selectedLines || this.state.selectedLines;
    return lines.indexOf(line) !== -1;
  }

  allButtonSelected(selectedLines) {
    let lines = selectedLines || this.state.selectedLines;
    return lines.length === this.state.lines.length;
  }

  allSelected(selectedLines) {
    return this.allButtonSelected(selectedLines)
      || this.state.selectedLines.length === 0;
  }

  toggleLine(line) {
    let selectedLines = this.state.selectedLines.slice();
    if (this.isSelected(line, selectedLines)) {
      _.remove(selectedLines, (l) => { return l === line; });
    } else {
      selectedLines.push(line);
    }
    this.setVisibleRows(0, selectedLines);
  }

  toggleLines() {
    let selectedLines = this.allButtonSelected() ? [] : this.state.lines;
    this.setVisibleRows(0, selectedLines);
  }

  lineSelect() {
    let buttons = this.state.lines.map((line) => {
      let selected = this.isSelected(line) ? ' selected' : '';
      return (
        <button type="button" className={ 'btn btn-default btn-sm' + selected } onClick={ this.toggleLine.bind(this, line) } data-line={ line }>{ line }</button>
      );
    });
    let allSelected = this.allButtonSelected() ? ' selected' : '';
    let allButton = (
      <button type="button" className={ 'btn btn-default btn-sm' + allSelected } onClick={ this.toggleLines.bind(this) } data-line={ "all" }>Kaikki linjat</button>
    );
    return (
      <div className="line-buttons">
        { allButton }
        { buttons }
      </div>
    );
  }

  showMore() {
    this.setVisibleRows(rowCount);
  }

  timeTable() {
    let timetable = this.state.visibleRows;
    let rows = timetable.map((row) => {
      let mins = row.min;
      let gone = mins < 0;
      let realTime = row.hasRealtime ? ' (' + row.realTime + ')' : null;
      let minSpan = <span className="small">{ ' min' }</span>;
      let rowClass = 'data-row ' + (gone ? 'gone' : '');
      return (
        <tr key={ row.line + '-' + row.time } className={ rowClass }>
          <td className="time">
            <span>{ row.time }</span>
            <span className="realtime small">{ realTime }</span>
          </td>
          <td className="min">{ gone ? '-' : mins }{ gone ? null : minSpan }</td>
          <td className="line">{ row.line }</td>
          <td className="dest small">{ row.dest || '' }</td>
        </tr>
      );
    });
    let noRows = (
      <tr className="no-rows small">
        <td colSpan={4}>
          Ei näytettäviä aikoja seuraavaan tuntiin. Valitse jokin toinen linja tai pysäkki.
        </td>
      </tr>
    );
    let showMoreRow = (
      <tr className="show-more small" onClick={ this.showMore.bind(this) }>
        <td colSpan={4}>
          <i className="fa fa-chevron-down" aria-hidden="true"></i>
        </td>
      </tr>
    );
    let showMore = !this.state.hideShowMore ? showMoreRow : null;

    return (
      <table className="table table-striped">
        <thead className="small">
          <tr>
            <th className="col-xs-2 col-sm-2">Lähtee</th>
            <th className="col-xs-2 col-sm-2">Min</th>
            <th className="col-xs-1 col-sm-1">
              <i className="fa fa-bus" aria-hidden="true"></i>
            </th>
            <th>Määränpää</th>
          </tr>
        </thead>
        <tbody>
          { rows.length > 0 ? rows : noRows }
          { showMore }
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
          { this.lineSelect() }
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
    let addStopButton = <button className="btn btn-default add-stop" onClick={ this.openModal }><i className="fa fa-plus" aria-hidden="true"></i>Lisää pysäkki</button>;
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

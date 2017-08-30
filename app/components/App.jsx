import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import PropTypes from 'prop-types';
import URLSearchParams from 'url-search-params';

/* component imports */
import UserInputs from './UserInputs.jsx';
import Views from './Views.jsx'
import TopMenu from './TopMenu.jsx'

import './app.scss';
import 'semantic-ui-css/components/accordion.min.css';
import 'semantic-ui-css/components/button.min.css';
import 'semantic-ui-css/components/form.min.css';
import 'semantic-ui-css/components/grid.min.css';
import 'semantic-ui-css/components/header.min.css';
import 'semantic-ui-css/components/label.min.css';
import 'semantic-ui-css/components/message.min.css';
import 'semantic-ui-css/components/menu.min.css';
import 'semantic-ui-css/components/segment.min.css';
import 'semantic-ui-css/components/image.min.css';
import 'semantic-ui-css/components/list.min.css';
import 'semantic-ui-css/components/dropdown.min.css';
import 'semantic-ui-css/components/tab.min.css';
import 'semantic-ui-css/components/message.min.css';
import 'semantic-ui-css/components/popup.min.css';
import 'semantic-ui-css/components/input.min.css';
import 'semantic-ui-css/components/reset.min.css';
import 'semantic-ui-css/components/transition.min.css';
import 'semantic-ui-css/components/table.min.css';

import * as config from '../conf'

export default class App extends React.Component {

  static propTypes = {
    label: PropTypes.string,
    url: PropTypes.string,
    appName: PropTypes.string,
    profiles: PropTypes.string,
    headers: PropTypes.object,
    portal: PropTypes.bool,
    transactionId: PropTypes.string
  }

  constructor(props) {
    super(props)
    const urlParams = new URLSearchParams(location.search)
    let headers
    // Construct headers object
    if (urlParams.has('headers[]')) {
      headers = {}
      const headersArr = urlParams.getAll('headers[]')
      for (var i = 0; i < headersArr.length; i++) {
        const [key, value] = headersArr[i].split('(_)', 2)
        headers[key] = value
      }
    }
    this.state = {
      headers: headers || props.headers,
      urls: {},
      user: '',
      repo: '',
      appName: urlParams.get('appName') || props.appName,
      url: urlParams.get('url') || props.url,
      profiles: urlParams.get('profiles') || props.profiles,
      label: urlParams.get('label') || props.label,
      filter: urlParams.get('filter') ? urlParams.get('filter').split(',') : [],
      transactionId: props.transactionId
    }
  }

  /**
   * Callback function passed to UserInputs. Updates url, appName,
   * and headers and updates the urls.
   *
   * @param {string} url - new url
   * @param {string} appName - new appName
   * @param {object} headers - new headers
   * @param {string[]} [profiles] - new or default profiles
   * @param {string} [label] - new or default label
   */
  updateInfo = (url, appName, headers, profiles=['default'], label='master') => {
    this.setState({
      url,
      appName,
      label,
      profiles: profiles.toString()
    })
    if (!this.props.portal) {
      this.setState({
        headers
      })
    }
    this.updateURLs(url, appName, profiles, label, headers)
  }

  /**
   * Callback function passed to UserInputs. Updates profiles and urls.
   *
   * @param {string[]} profiles - new profiles
   */
  updateProfiles = (profiles) => {
    this.setState({
      profiles: profiles.toString()
    })
    this.updateURLs(this.state.url, this.state.appName,
      profiles, this.state.label)
  }

  /**
   * Callback function passed to UserInputs. Updates label and urls.
   *
   * @param {string} label - new label
   */
  updateLabel = (label) => {
    this.setState({
      label
    })
    this.updateURLs(this.state.url, this.state.appName,
      this.state.profiles, label)
  }

  /**
   * Creates new urls based on parameters. Replaces forward slashes in
   * label with (_). If no profiles or label provided, resets to defaults.
   * Updates the browser url with new query params without reloading.
   *
   * @param {string} url - server url
   * @param {string} appName - app name
   * @param {string[]} profiles - i.e. dev, e2e, qal...
   * @param {string} label - branch or tag
   * @param {object} [headers] - headers object
   */
  updateURLs = (url, appName, profiles, label, headers=this.state.headers) => {
    // For localhost, use the url in the app, or else use the configured ones
    const currentEnv = config.getCurrentHostEnv();

    const urls = {
      metaURL: `${url}/${appName}/${profiles}/${label.replace(/\//g, '(_)')}`,
      confURL: `${url}/${label.replace(/\//g, '(_)')}/${appName}-${profiles}`
    }

    this.setState({
      urls
    })

    const urlParams = new URLSearchParams(location.search)
    urlParams.set('profiles', profiles)
    urlParams.set('label', label)
    if (!this.props.portal) {
      urlParams.set('url', url)
      urlParams.set('appName', appName)

      urlParams.delete('headers[]')
      Object.keys(headers).forEach(
        key => urlParams.append('headers[]', `${key}(_)${headers[key]}`)
      )
    }

    history.pushState(null, null, `?${decodeURIComponent(urlParams)}`)
  }

  /**
   * Callback function passed to PropSearch through Views. Called when
   * user selects new properties. Updates array of properties to view.
   *
   * @param {string[]} filter - array of properties to show (keys)
   */
  updateFilter = (filter) => {
    this.setState({
      filter
    })
    const urlParams = new URLSearchParams(location.search)
    urlParams.set('filter', filter)
    history.pushState(null, null, `?${decodeURIComponent(urlParams)}`)
  }

  /**
   * Callback function passed to Views. Updates user based on github
   * url found in metadata.
   *
   * @param {object} urls - current user
   */
  updateUserRepo = (user, repo) => {
    this.setState({
      user,
      repo
    })
  }

  render() {
    const { urls, headers, user, repo, url,
      appName, profiles, label, filter, transactionId } = this.state

    const { portal } = this.props

    return (
      <div>
        <ReactCSSTransitionGroup
          transitionName='app'
          transitionAppear={true}
          transitionAppearTimeout={500}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          {portal ? null : <TopMenu />}
          <UserInputs user={user} repo={repo} url={url}
            appName={appName} profiles={profiles}
            label={label} headers={headers} portal={portal}
            transactionId={transactionId}
            updateInfo={this.updateInfo}
            updateLabel={this.updateLabel}
            updateProfiles={this.updateProfiles} />
          <div className='views'>
            <Views urls={urls} headers={headers} portal={portal}
              transactionId={transactionId}
              updateUserRepo={this.updateUserRepo}
              filter={filter} updateFilter={this.updateFilter} />
          </div>
        </ReactCSSTransitionGroup>
      </div>
    )
  }
}

// @TODO remove inital headers when open source
App.defaultProps = {
  url: 'https://config-e2e.api.intuit.com/v2',
  appName: '',
  profiles: 'default',
  label: 'master',
  headers: {authorization: config.getAuthorizationHeader()},
  transactionId: config.getTID()
}

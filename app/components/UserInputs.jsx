import React from 'react';
import PropTypes from 'prop-types'

import Headers from './Headers.jsx'
import * as api from '../utils/api.js'

import { Form, Label, Menu, Popup } from 'semantic-ui-react';
import FaCodeFork from 'react-icons/lib/fa/code-fork'
import FaTag from 'react-icons/lib/fa/tag'
import FaCaretDown from 'react-icons/lib/fa/caret-down'
import FaClose from 'react-icons/lib/fa/close'
import FaQuestionCircle from 'react-icons/lib/fa/question-circle'

import * as config from '../conf';

export default class UserInputs extends React.Component {

  static propTypes = {
    user: PropTypes.string.isRequired,
    repo: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    appName: PropTypes.string.isRequired,
    profiles: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    portal: PropTypes.bool,
    updateInfo: PropTypes.func.isRequired,
    updateLabel: PropTypes.func.isRequired,
    updateProfiles: PropTypes.func.isRequired,
    portal: PropTypes.bool,
    transactionId: PropTypes.string.isRequired,
    updateLabelOptions: PropTypes.func.isRequired,
    stateHandler: PropTypes.func.isRequired,
    updateSimple: PropTypes.func.isRequired,
    simple: PropTypes.bool.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      profOptions: [{value: 'default', text: 'default'}],
      labelOptions: [{value: 'master', text: 'master',
        icon: <FaCodeFork className='enabled' />}],
      index: 0,
      toggle: false,
      url: props.url,
      appName: props.appName,
      profiles: props.profiles.split(','),
      label: props.label,
      headerCount: 1,
      headers: props.headers
    }
  }

  /**
   * If appName and url already exist (props or query parameters),
   * update info without making the user press submit.
   */
  componentWillMount() {
    const { url, appName, headers, profiles, label } = this.state
    if (appName && url) {
      this.props.updateInfo(url, appName, headers, profiles, label)
    }
  }

  /**
   * Called in Profiles Dropdown
   * When user adds a profile that does not exist in search
   * results, add label 'Not found' to new input
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and the new item's value.
   * @param {string} data.value - current entered value
   */
  handleAddition = (e, {value}) => {
    if (!this.state.profOptions.find( (option) => option.value === value )) {
      let label = { color:'red', content:'Not found' }
      this.setState({
        profOptions: [{text:value, value, label}, ...this.state.profOptions]
      })
    }
  }

  /**
   * Called in Profiles Dropdown
   * item.label returns true if the item (profile input) was
   * an addition. If true add label to option in Dropdown menu.
   *
   * @param {object} item - A currently active dropdown item.
   * @param {string} item.text - profile name
   * @param {object} item.label - Label shorthand if item has one
   * @returns Shorthand for a Label.
   */
  renderLabel = (item) => {
    if (item.label) {
      return {color:'red', content:`Not found: ${item.text}`,
        removeIcon: <FaClose className='closeIcon' />}
    }
    return {content:item.text, removeIcon: <FaClose className='closeIcon' />}
  }

  /**
   * Update the value of input field
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string} data.name - name of input field (url, appName)
   * @param {string} data.value - current input
   */
  handleInputChange = (e, {name, value}) => {
    this.setState({
      [name]: value
    })
  }

  /**
   * Change the label in parent App component using callback
   * function whenever input field changes. Reload profiles.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string} data.value - current input
   */
  handleLabelChange = (e, data) => {
    this.setState({
      label: data.value
    })
    this.props.updateLabel(data.value)
    this.loadProfiles(this.props.user, this.props.repo, data.value)
  }

  /**
   * Change the profiles array in input data. Sets to default if none are
   * selected and removes default if any are.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string[]} data.value - current input array
   */
  handleProfileChange = (e, {value}) => {
    let profiles = value
    if (value.length === 0 || value[value.length - 1] === 'default') {
      profiles = ['default']
    } else {
      const index = profiles.indexOf('default')
      if (index > -1) {
        profiles.splice(index, 1)
      }
    }
    this.setState({
      profiles
    })
    this.props.updateProfiles(profiles)
  }

  /**
   * Called from Headers button, switches between Collapse
   * and Expand, showing/revealing headers.
   */
  handleHeadersClick = () => {
    this.setState({
      toggle: !this.state.toggle
    })
  }

  /**
   * Called from Sumbit button, updates url, appName, and headers in
   * parent App component. Resets label and profiles to defaults.
   */
  handleSubmit = () => {
    const {url, appName, headers} = this.state
    this.setState({
      label: 'master',
      profiles: ['default']
    })
    this.props.updateInfo(url, appName, headers)
  }

  /**
   * Callback function passed to Headers. Creates a dict containint
   * headers key-value pairs
   *
   * @param {object[]} data - maps index to an object containing a key
   * and value object, each of which have a value and a bool 'neg'
   * @param {number} [headerCount] - number of headers if different
   */
  updateHeaders = (data, headerCount) => {
    let headers = {}
    for (var index in data) {
      headers[data[index].key.value] = data[index].value.value
    }
    this.setState({
      headers
    })
    if (headerCount !== undefined) {
      this.setState({
        headerCount
      })
    }
  }

  /**
   * Called when user switches between simple and advanced view.
   */
  handleViewToggle = () => {
    this.props.updateSimple(!this.props.simple)
  }

  /**
   * Fetch list of profiles from github based on given user, repo, and
   * label. Update options in profiles dropdown.
   *
   * @param {string} user - current user (i.e. services-config)
   * @param {string} repo - current repo
   * @param {string} label - current label or 'master'
   */
  loadProfiles = (user, repo, label) => {
    const proxy = config.getProxyServerUrl();
    const currentEnv = config.getCurrentHostEnv().toString();
    console.log(`Setting up the proxy url '${proxy}' to be used for env ${currentEnv}`);

    const githubRequest = api.makeGithubFetchRequest(this.props.headers,
      this.props.portal, this.props.transactionId);

    const githubApiUrl =
      `${proxy}${config.GIT_REPOS_API}/${user}/${repo}/contents?ref=${label}`
    console.log(`Requesting github content from ${githubApiUrl.replace(proxy, "")} `)

    fetch(githubApiUrl, githubRequest).then((response) => {

      if (response.status >= 400) {
        throw new Error(response.json())
      }
      return response.json()

    }).then(contents => {
      const { appName, profiles } = this.state
      const profOptions = api.parseProfiles(contents, appName, profiles,
        this.props.stateHandler, githubApiUrl)

      this.setState({
        profOptions
      })
    }).catch(err => {
      this.props.stateHandler({phase: "profiles", url: githubApiUrl,
        error: err});
      console.log(err.message)
    })
  }

  /**
   * Fetch list of labels from github based on given user and repo.
   * Update list of branches and tags.
   *
   * @param {string} user - current user (i.e. services-config)
   * @param {string} repo - current repo
   */
  loadLabels = (user, repo) => {
    const proxy = config.getProxyServerUrl();
    const currentEnv = config.getCurrentHostEnv().toString();
    console.log(`Setting up the proxy url '${proxy}' to be used for env ${currentEnv}`);

    const githubRequest = api.makeGithubFetchRequest(this.props.headers,
      this.props.portal, this.props.transactionId);

    const githubApiUrl =
      `${proxy}${config.GIT_REPOS_API}/${user}/${repo}/git/refs?per_page=100`
    console.log(`Requesting github content from ${githubApiUrl.replace(proxy, "")} `)

    fetch(githubApiUrl, githubRequest).then((response) => {

      if (response.status >= 400) {
        throw new Error(response.json())
      }
      return response.json()

    }).then(refs => {
      const tagRefs = refs.filter(r => r.ref.startsWith('refs/tags'))
      const tags = tagRefs.map(r => ({
        key: r.ref.split('refs/tags/')[1],
        value: r.ref.split('refs/tags/')[1],
        text: r.ref.split('refs/tags/')[1],
        icon: <FaTag className='enabled' />
      }))
      console.log(`Loaded the tags ${JSON.stringify(tags.map(t => t.text))}`)
      this.props.stateHandler({phase: "labels", type: "tags",
        url: githubApiUrl, value: tags});

      const branchRefs = refs.filter(r => r.ref.startsWith('refs/heads'))
      const branches = branchRefs.map(r => ({
        key: r.ref.split('refs/heads/')[1],
        value: r.ref.split('refs/heads/')[1],
        text: r.ref.split('refs/heads/')[1],
        icon: <FaCodeFork className='enabled' />
      }))
      console.log(`Loaded the branches ${JSON.stringify(branches.map(b => b.text))}`)
      this.props.stateHandler({phase: "labels", type: "branches",
        url: githubApiUrl, value: branches});

      // Sort the labels by the names, case insensitive
      // https://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects/979289#979289
      const labelOptions = branches.concat(tags).sort(
        (a, b) => a.key.localeCompare(b.key)
      )

      this.setState({
        labelOptions
      })
      this.props.updateLabelOptions(labelOptions)
    }).catch(err => {
      this.props.stateHandler({phase: "labels", url: githubApiUrl, error: err});
      console.log(err.message)
    })
  }

  /**
   * If new user or repo, load new profiles and labels. If user and repo
   * are undefined, set label options and profile options back to defaults.
   *
   * @param {object} nextProps
   * @param {string} nextProps.user - current user (i.e. services-config)
   * @param {string} nextProps.repo - current repo
   */
  componentWillReceiveProps = ({user, repo}) => {
    console.log(`UserInputs received properties: ${user}/${repo}`);
    if (user !== this.props.user || repo !== this.props.repo) {
      if (user && repo) {
        this.loadProfiles(user, repo, 'master')
        this.loadLabels(user, repo)
      } else {
        const labelOptions = [{value: 'master', text: 'master',
          icon: <FaCodeFork className='enabled' />}]
        this.setState({
          profOptions: [{value: 'default', text: 'default'}],
          labelOptions
        })
        this.props.updateLabelOptions(labelOptions)
      }
    }
  }

  render() {
    const { button, url, appName, profiles,
      label, profOptions, labelOptions,
      toggle, headerCount, headers } = this.state
    const { portal, simple } = this.props

    // Hide url and appName field if in portal view
    return (
      <div className='inputs'>
        {
          portal ?
          null :
          <Form onSubmit={this.handleSubmit}>
            <Form.Group widths='equal'>
              <Form.Input onChange={this.handleInputChange}
                label='Config URL' name='url'
                placeholder='config url...' value={url}/>
              <Form.Input onChange={this.handleInputChange}
                label='App Name' name='appName'
                placeholder='app name...' value={appName} />
              <Form.Field>
                <label>Headers</label>
                <Menu color='grey' compact inverted>
                  <Menu.Item onClick={this.handleHeadersClick} active={toggle}>
                    {toggle ? 'Collapse' : 'Expand'}
                    <Label color='red' floating>{headerCount}</Label>
                  </Menu.Item>
                </Menu>
              </Form.Field>
              <Form.Button width={1} floated='right'
                label={<label style={{visibility: 'hidden'}}>Submit</label>}
                content='Submit' />
            </Form.Group>
          </Form>
        }
        {
          portal ?
          null :
          <Headers show={toggle} updateHeaders={this.updateHeaders}
            headers={headers} />
        }
        <Form>
          <Form.Group widths='equal'>
            <Popup inverted size='small' trigger={
              <Form.Button width={2} content={simple ? 'Advanced' : 'Simple'}
                label={<label style={{visibility: 'hidden'}}>Toggle</label>}
                onClick={this.handleViewToggle} />
              }
              content={simple ? 'Show Spring Cloud Config Settings' : 'Show Intuit Settings'}
              position='top right' />
            {simple ? null :
              <Form.Dropdown label={
                  <label>
                    Label
                    <Popup inverted size='small'
                      trigger={
                        <FaQuestionCircle className='helpIcon' />
                      }
                      content='Branches and Tags loaded from your Github Repo'
                      position='top center' />
                  </label>
                }
                fluid search selection scrolling options={labelOptions}
                value={label} onChange={this.handleLabelChange}
                icon={<FaCaretDown className='searchIcon' />}
                selectOnBlur={false}>
              </Form.Dropdown>
            }
            <Form.Dropdown label={
              simple ? <label>Environments</label> :
                <label>
                  Profiles
                  <Popup inverted size='small'
                    trigger={
                      <FaQuestionCircle className='helpIcon' />
                    }
                    content='Your environments, versions, etc.'
                    position='top center' />
                </label>
              }
              fluid multiple search selection scrolling
              options={profOptions} value={profiles}
              allowAdditions additionLabel='Add: '
              onAddItem={this.handleAddition}
              additionPosition='bottom'
              renderLabel={this.renderLabel}
              onChange={this.handleProfileChange}
              icon={<FaCaretDown className='searchIcon' />} />
          </Form.Group>
        </Form>
      </div>
    )
  }
}

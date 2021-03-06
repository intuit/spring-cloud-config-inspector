import React from 'react';
import { Breadcrumb, Segment, Dropdown, Menu } from 'semantic-ui-react';
import FaClose from 'react-icons/lib/fa/close'
import FaCaretDown from 'react-icons/lib/fa/caret-down'

import PropTypes from 'prop-types'

import 'lodash'
var jsdiff = require('diff')

import * as config from '../conf';

const org = 'services-config'

export default class Diff extends React.Component {

  static propTypes = {
    base: PropTypes.string.isRequired,
    compare: PropTypes.string.isRequired,
    baseLabel: PropTypes.string,
    baseProfiles: PropTypes.arrayOf(PropTypes.string),
    profOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
    labelOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
    fetchCompare: PropTypes.func.isRequired,
    compareLabel: PropTypes.string,
    compareProfiles: PropTypes.arrayOf(PropTypes.string),
    updateProfileOptions: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      formatted: []
    }
  }

  /**
   * Calculate diff and format result. formatted is an array of chunks of
   * text, red if only in base config and green if only in compare config.
   * User diffJson if in json view and diffLines otherwise. Leave blank if
   * comparing json with properties (intermediate stage).
   *
   * @param {string} base - JSON string of base config file
   * @param {string} base - JSON string of compare config file
   */
  createDiff = (base, compare) => {
    let diff = []
    if (base.startsWith('{') && compare.startsWith('{')) {
      diff = jsdiff.diffJson(JSON.parse(base), JSON.parse(compare))
    } else if (!base.startsWith('{') && !compare.startsWith('{')) {
      diff = jsdiff.diffLines(base, compare)
    }
    const formatted = diff.map((part, index) => {
      const className = part.added ? 'ins code' :
        part.removed ? 'del code' :
        'code'
      return <span key={index} className={className}>{part.value}</span>
    })
    this.setState({formatted})
  }

  /**
   * fetchCompare gets the data to compare base with and updates compare
   * label to display.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string} data.value - current input
   */
  handleLabelChange = (e, {value}) => {
    this.props.fetchCompare(value, this.props.compareProfiles)
  }

  /**
   * Sends new data to parent Views component which in turn updates value
   * in profiles dropdown. Sets to default if none are selected and removes
   * default if any are.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string[]} data.value - current input array
   */
  handleProfileChange = (e, {value}) => {
    let compareProfiles = value
    if (value.length === 0 || value[value.length - 1] === 'default') {
      compareProfiles = ['default']
    } else {
      const index = compareProfiles.indexOf('default')
      if (index > -1) {
        compareProfiles.splice(index, 1)
      }
    }
    this.props.fetchCompare(this.props.compareLabel, compareProfiles)
  }

  /**
   * Called in Profiles Dropdown
   * item.label returns true if the item (profile input) does not exist
   * for current branch/tag. If true add label to option in Dropdown menu.
   *
   * @param {object} item - A currently active dropdown item.
   * @param {string} item.text - profile name
   * @param {object} item.label - Label shorthand if item has one
   * @returns Shorthand for a Label.
   */
  renderLabel = ({text, label}) => {
    if (label) {
      return {basic: true, className: 'mini-profiles', color:'red',
        content:`Not found: ${text}`,
        removeIcon: <FaClose className='closeIcon' />}
    }
    return {basic: true, className: 'mini-profiles', content:text,
      removeIcon: <FaClose className='closeIcon' />}
  }

  /**
   * Changes view between properties and json. Views calls fetchCompare.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} data - All props and proposed value.
   * @param {string} data.name - json or properties
   */
  handleClick = (e, {name}) => {
    this.props.fetchCompare(this.props.compareLabel,
      this.props.compareProfiles, name)
  }

  /**
   * Fetches data for all tabs. Updates requests, version, and all data and
   * creates key value pairs by calling updateValues. Handles bad requests.
   *
   * @param {object} nextProps
   * @param {object} nextProps.base - config file in Views
   * @param {object} nextProps.compare - config file to diff with
   */
  componentWillReceiveProps({base, compare}) {
    if (this.props.base !== base || this.props.compare !== compare) {
      this.createDiff(base, compare)
    }
  }

  render() {
    const { baseLabel, baseProfiles, labelOptions, profOptions,
      compareLabel, compareProfiles } = this.props

    const { formatted } = this.state

    if (baseLabel && baseProfiles !== undefined) {
      const baseSections = [
        { key: 'label', content: baseLabel, active: true, className: 'base' },
        { key: 'profiles', content: baseProfiles.toString(),
          active: true , className: 'base'}
      ]

      const items = [
        {key: '.properties', content: '.properties', name: 'properties'},
        {key: '.json', content: '.json', name: 'json'}
      ]

      return (
        <div>
          <Segment attached='top' className='views-segment'>
            <Breadcrumb divider='/'
              sections={baseSections} />
            <span className='dots'> ... </span>
            <Breadcrumb className='compare'>
              <Breadcrumb.Section>
                <Dropdown scrolling options={labelOptions} inline
                  value={compareLabel}
                  onChange={this.handleLabelChange}
                  icon={<FaCaretDown className='inline-icon' />} />
              </Breadcrumb.Section>
              <Breadcrumb.Divider />
              <Breadcrumb.Section>
                <Dropdown scrolling options={profOptions} inline multiple
                  value={compareProfiles}
                  onChange={this.handleProfileChange}
                  renderLabel={this.renderLabel}
                  icon={<FaCaretDown className='inline-icon' />} />
              </Breadcrumb.Section>
            </Breadcrumb>
            <Menu className='raw-menu' secondary pointing
              items={items} onItemClick={this.handleClick}
              defaultActiveIndex='0' />
          </Segment>
          <Segment attached='bottom' className='view'>
            {formatted}
          </Segment>
        </div>
      )
    }
    return null
  }
}

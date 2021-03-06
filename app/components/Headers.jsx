import React from 'react'
import PropTypes from 'prop-types';
import { Table, Input, Button } from 'semantic-ui-react'

import * as config from '../conf';

export default class Header extends React.Component {

  static propTypes = {
    show: PropTypes.bool.isRequired,
    updateHeaders: PropTypes.func.isRequired
  }

  /**
   * Sets default values of index to zero and data to empty object.
   */
  constructor(props) {
    super();
    let data = {}
    let index = 0
    for (let header in props.headers) {
      data[index] = {
        key: {
          value: header,
          neg: false
        },
        value: {
          value: props.headers[header],
          neg: false
        }
      }
      index++
    }
    this.state = {
      index,
      data
    }
  }

  /**
   * Called when user changes input in one of the headers fields.
   * Changes entry in this.state.data accordingly. Turns off negative.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} object - Input object. Classname is formatted
   * 'key {index}' or 'value {index}'. Value is current string input.
   */
  handleHeaderChange = (e, object) => {
    const data = this.state.data
    const [label, index] = object.className.split(' ')

    data[index][label] = {value: object.value, neg: false}
    this.props.updateHeaders(data)

    this.setState({
      data
    })
  }

  /**
   * Called when a delete button is clicked. Finds key-value pair in
   * data based on className of button and deletes it. Calls updateHeaders
   * to send update to parent.
   *
   * @param {SyntheticEvent} e - React's original SyntheticEvent.
   * @param {object} object - Button object. className is index
   * of associated key-value pair
   */
  handleDelete = (e, object) => {
    const data = this.state.data
    delete data[object.className]

    this.props.updateHeaders(data, Object.keys(data).length)
    this.setState({
      data
    })
  }

  /**
   * Called when 'Add new key-value pair' clicked. If field is not
   * filled turns box red and prevents add. Otherwise adds empty pair to
   * data. Calls updateHeaders to send update to parent. Increments index.
   */
  handleClick = () => {
    const key = this.state.index
    const data = this.state.data

    let empty = false

    for (var pair in data) {
      if (!data[pair].key.value) {
        data[pair].key.neg = true
        empty = true
      }
      if (!data[pair].value.value) {
        data[pair].value.neg = true
        empty = true
      }
    }

    if (empty) {
      this.setState({
        data
      })
    } else {
      // Add new empty row with index
      data[key] = {key: {value: '', neg: false}, value: {value: '', neg: false}}

      this.props.updateHeaders(data, Object.keys(data).length)

      this.setState({
        index: key + 1,
        data
      })
    }
  }

  /**
   * Call once to render default headers
   */
  componentWillMount() {
    const {data} = this.state
    this.props.updateHeaders(data, Object.keys(data).length)
  }

  render() {
    if (this.props.show) {
      const {data} = this.state
      return (
        <Table columns={3}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={3}>Keys</Table.HeaderCell>
              <Table.HeaderCell width={11}>Values</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {Object.keys(data).map(index =>
              <Table.Row key={index}>
                <Table.Cell negative={data[index].key.neg} width={3}>
                  <Input defaultValue={data[index].key.value}
                    className={`key ${index}`} fluid transparent
                    placeholder='key' onChange={this.handleHeaderChange} />
                </Table.Cell>
                <Table.Cell negative={data[index].value.neg} width={11}>
                  <Input defaultValue={data[index].value.value}
                    className={`value ${index}`} fluid transparent
                    placeholder='value' onChange={this.handleHeaderChange} />
                </Table.Cell>
                <Table.Cell>
                  <Button floated='right' className={index} onClick={this.handleDelete}>Delete</Button>
                </Table.Cell>
              </Table.Row>)}
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan='3'>
                <Button width={1} onClick={this.handleClick} fluid>
                  Add key-value pair
                </Button>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      )
    } else {
      return null
    }

  }
}

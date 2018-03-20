import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { getUser } from '../../../../user/store/selectors'
import {getContact, getCustomFieldsForContacts, isStateDirty, getFirstContactId, isInEdit} from '../../../store/selectors'
import {deleteContact, fetchContact, saveContact} from '../../../service'
import {editingContact, editingContactFinished} from '../../../store/actions'
import {searchCompanies} from '../../../../companies/service'
import Conversations from '../../../../conversations/partials/_conversations'
import { ActionView } from './components'
import FieldLayout from './components/FieldLayout'
import { Link } from "react-router-dom"
import _ from 'lodash';
import * as MDIcons from 'react-icons/lib/md'
import Select from 'react-select'


class Record extends React.Component {
  constructor(props) {
    super(props)

    this._toggleEdit = this._toggleEdit.bind(this)
    this._submit = this._submit.bind(this)
    this._handleInputChange = this._handleInputChange.bind(this)
    this._setActionView = this._setActionView.bind(this)
    this._archive = this._archive.bind(this)
    this._delete = this._delete.bind(this)
    this._searchCompanies = this._searchCompanies.bind(this)
    this._setCompanyForContact = this._setCompanyForContact.bind(this)

    this.state = {
      // inEdit: props.inEdit,
      formState: props.contact.originalProps,
      actionView: "none"
    }
  }

  componentWillMount() {
    this.props.dispatch(fetchContact(this.props.contact.id))
    
    if (this.props.match.params.id === 'new') { 
      this.props.dispatch(editingContact())
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.setState({formState: nextProps.contact.originalProps})
  }

  _archive() {

  }

  _delete () {
    const { dispatch, contact} = this.props

    if (confirm('Are you sure?')) {
      dispatch(deleteContact(contact.id))
    }
  }

  _setActionView(view) {
    view = view === this.state.actionView ? "none" : view

    this.setState({actionView: view})
  }

  _toggleEdit() {
    this.props.dispatch(editingContact())
  }

  _submit() {
    this.props.dispatch(saveContact(this.state.formState))
    this.props.dispatch(editingContactFinished())
  }

  _searchCompanies(input, callback) {
    let search = '';

    if (input && input.length > 0) {
      search = {
        searchString: input
      }
    }

    return searchCompanies(search)
      .then(companies => {
        let options = companies.map(c => {
          return {
            value: c.id,
            label: c.name
          }
        });

        callback(null, {options: options})

        return {options: options};
      });
  }

  _setCompanyForContact(value, fieldName) {
    const selectedId = value ? value.value : null;
    const selectedName = value ? value.label : null;

    let event = {
      target: {
        type: 'select',
        name: fieldName,
        value: {
          id: selectedId,
          name: selectedName
        }
      }
    };

    this._handleInputChange(event);
  }

  // @todo: Abstract this out
  _handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    let name = target.name;
    let contactState = this.state.formState;

    // Special handling for custom field state
    if (this.state.formState.hasOwnProperty(name) === false && this.props.customFields[name]) {
      let customField = this.props.customFields[name];
      let contactCustomFieldIndex = _.findIndex(contactState.custom_fields, (o) => o.custom_field_id === customField.field_id);

      if (contactCustomFieldIndex >= 0) {
        contactState.custom_fields[contactCustomFieldIndex].value = value;
      } else {
        contactState.custom_fields.push({
          custom_field_id: customField.field_id,
          value: value
        });
      }
    } else {
      _.set(contactState, name, value);
    }

    this.setState({
      formState: contactState
    });
  }

  render() {
    const { inEdit, contact, user } = this.props;
    const groups = _.groupBy(this.props.customFields, 'group');
    // const inEdit = this.state.inEdit

    const contactFields = ['core', 'personal', 'social', 'additional'].map(key => {
      const emptyGroup = inEdit || (groups.hasOwnProperty(key) && groups[key].length) ? '' : 'd-none'
      return (
        <div key={`group-${key}-${contact.id}`}>
          <ul className={`list-group list-group-flush ${emptyGroup}`}>
            <li key={key} className="list-group-item">
              <div className="mini-text text-muted">{key}</div>
              {_.sortBy(groups[key], ['ordering']).map(f => {
                return (
                  <FieldLayout model={contact} field={f} inEdit={inEdit} onChange={this._handleInputChange} key={`group-field-key-${f.field_id}`} />
                )
              })
              }
            </li>
          </ul>
          {key === 'core' ?
            <ul className="list-group list-group-flush">
              <li key="address" className="list-group-item">
                <div className="mini-text text-muted">Address</div>
                <div className="py-2">
                  <p className="font-weight-bold">{contact.address1} {contact.address2}</p>
                  <p className="text-muted">{contact.city} {contact.state} {contact.zip} {contact.country}</p>
                </div>
              </li>
            </ul>
            :
            ''
          }
          <span className="d-none" />
        </div>
      )})

    const onAssignmentChange = (id) => {
      const event = {
        target: {
          type: 'text',
          name: 'user_id',
          value: id
        }
      }
      this._handleInputChange(event)
      this._submit()
    }

    return (
      <main className="col main-panel px-3">
        <div className="toolbar border-bottom py-2 heading list-inline">
          <button className="btn btn-primary mr-3 btn-sm list-inline-item" onClick={() => this._setActionView('call')}><span className="h5"><MDIcons.MdLocalPhone /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={() => this._setActionView('email')}><span className="h2"><MDIcons.MdMailOutline /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={() => this._setActionView('sms')}><span className="h3"><MDIcons.MdPermPhoneMsg /></span></button>
          {/*<button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h2"><MDIcons.MdCallMerge /></span></button>*/}
          {/*<button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h5"><MDIcons.MdAllInclusive /></span></button>*/}
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={() => this._setActionView('task')}><span className="h2"><MDIcons.MdPlaylistAdd /></span></button>
          {/*<button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h3"><MDIcons.MdInput /></span></button>*/}
          {/*<button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h2"><MDIcons.MdInsertChart /></span></button>*/}
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={this._archive}><span className="h2"><MDIcons.MdCheck /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={this._delete}><span className="h2"><MDIcons.MdDelete /></span></button>

          <div className="float-right text-right pt-2">
            <div className="mini-text text-muted">Assigned To</div>
            <div className="dropdown show">
              <div className="text-dark mini-text cursor-pointer" id="assigneeDropdown" data-toggle="dropdown"><b>{contact.user.name ? contact.user.name : 'Unassigned'}</b></div>
              <div className="dropdown-menu" aria-labelledby="assigneeDropdown">
                {user.team.users.map(u => (
                  <a key={`team-${user.team.id}-member-${u.id}`} className="dropdown-item" href="javascript:void(0)" onClick={() => onAssignmentChange(u.id)}>{u.name}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {this.state.actionView !== "none" ?
          <div className="border-bottom">
            <div className="card actionView my-2">
              <ActionView view={this.state.actionView} contact={contact} user={user} />
            </div>
          </div>
          :
          ''
        }

        {inEdit ?
          <span className="float-right py-3 mt-1">
            <a href="javascript:void(0);" className="btn btn-link text-muted btn-sm" onClick={this._toggleEdit}>Cancel</a>
            <span className="ml-2 btn btn-primary btn-sm" onClick={this._submit}>Save</span>
          </span>
          :
          <span className="float-right py-3 mt-1">
            <a href="javascript:void(0);" className="btn btn-link btn-sm text-primary" onClick={this._toggleEdit}>Edit</a>
          </span>
        }
        <h4 className="border-bottom py-3">
          {contact.first_name} {contact.last_name} <small className="ml-3"><button type="button" className="btn btn-outline-secondary btn-sm">+ ADD TAG</button></small>
        </h4>

        <div className="h-scroll">
          <div className="card mb-1">
            <ul className="list-group list-group-flush">
              <li key={`companies-for-contact-${contact.id}`} className="list-group-item">
                <div className="mini-text text-muted">Professional</div>
                {this.state.formState.companies && this.state.formState.companies.map((company, index) => {
                  if (!inEdit) {
                    return (
                      <div className="py-2" key={`contact-company-${company.id}`}>
                        <p className="h6">{company.pivot.position ? company.pivot.position : <span className="text-muted">Works</span>} <span className="text-muted">at</span> {company.id ?
                          <Link className="hidden-link" to={`/companies/${company.id}`}>{company.name}</Link> : 'Unknown'} </p>
                        <p className="text-muted">{company.address1} {company.city} {company.state} {company.zip} {company.country}</p>
                      </div>
                    )
                  } else {
                    return (
                      <div className="py-2 row" key={`contact-company-${company.id}`}>
                        <div className={`form-group mb-1 col`}>
                          <label htmlFor={`companies.${index}.pivot.position`}>Position</label>
                          <div className="form-group mb-0">
                            <input type="text" className="form-control" placeholder="Position" name={`companies.${index}.pivot.position`} onChange={this._handleInputChange} defaultValue={company.pivot.position} />
                          </div>
                        </div>
                        <div className={`form-group mb-1 col`}>
                          <label htmlFor={`companies.${index}.id`}>Company</label>
                          <div className="form-group mb-0">
                            <Select.Async
                              multi={false}
                              value={{value: company.id, label: company.name}}
                              onChange={(value) => this._setCompanyForContact(value, `companies.${index}`)}
                              loadOptions={this._searchCompanies} />
                          </div>
                        </div>
                        <div className={`form-group mb-0 col-sm-2 mt-4 pt-2`}>
                          <span className="float-right"><a href="javascript:void(0);" className="text-muted"><MDIcons.MdDelete /></a></span>
                          <input className="form-check-input" type="checkbox" name={`companies.${index}.pivot.primary`} onChange={this._handleInputChange} value={company.pivot.primary} />
                          <label className="text-muted mini-text form-check-label" htmlFor={`companies.${index}.pivot.primary`}>
                            Primary Contact
                          </label>
                        </div>
                      </div>
                    )
                  }
                })}
              </li>
            </ul>
            {contactFields}

          </div>

          <Conversations dispatch={this.props.dispatch} conversations={_.filter(contact.activities, a => a.details_type !== 'App\\FieldUpdateActivity')} />

        </div>
      </main>
    )
  }
}

Record.propTypes = {
  contact: PropTypes.object.isRequired
}

export default withRouter(connect((state, ownProps) => ({
  contact: getContact(state, ownProps.match.params.id || getFirstContactId(state)),
  customFields: getCustomFieldsForContacts(state),
  isDirty: isStateDirty(state),
  user: getUser(state),
  inEdit: isInEdit(state)
}))(Record))
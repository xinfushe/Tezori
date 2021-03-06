import React, {Fragment, Component} from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';
import Switch from '@material-ui/core/Switch';
import styled from 'styled-components';
import TextField  from '../TextField';
import Button from '../Button';
import SeedInput from './SeedInput';
import PasswordInput from '../PasswordInput';
import { importAddress } from '../../reduxContent/wallet/thunks';
import * as ADD_ADDRESS_TYPES from '../../constants/AddAddressTypes';
import { wrapComponent } from '../../utils/i18n';

const MainContainer = styled.div`
  position: relative;
  min-height: 300px;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
`
const RestoreHeader = styled.div`
  font-size: 18px;
  font-weight: 300;
  display: flex;
  margin-bottom: 30px;
  color: ${({ theme: { colors } }) => colors.gray0 };

`
const RestoreTabContainer = styled.div`
  display: flex;
  border-radius: 35px;
  width: 284px;
  font-size: 12px;
  line-height: 31px;
  text-align: center;
  overflow: hidden;
  margin-left: 10px;
  font-weight: 500;
`

const RestoreTabItem = styled.div`
  background-color:  ${({ theme: { colors }, active }) => (active? colors.accent: 'rgba(148, 169, 209, 0.13)')};
  color: ${({ theme: { colors }, active }) => (active? colors.white: colors.index0) };
  flex: 1;
`;
const ToggleContainer = styled.div`
  max-width: 60%;
  margin-top: 35px;
  display: flex;
  align-items: center;
`;
const ToggleLabel = styled.div`
  font-size: 16px;
  color: ${ ({ theme: { colors } }) => colors.black2 };
  font-weight: 300;
  
`;
const ToggleWrapper = styled(Switch)`
  &&& {
    & > span[class*='checked'] {    
      color: ${({ theme: { colors } }) => colors.accent };
      & + span {
        background-color: ${({ theme: { colors } }) => colors.accent };
      }
    }
  }
  
`;
const RestoreFooter = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 50px;
`
const RestoreButton = styled(Button)`
  width: 194px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  padding: 0 !important;
`
type Props1 = {
  type: string,
  changeFunc: () => {},
  t: () => {}
};
const RestoreTabs = (props: Props1) => {
  const { type, changeFunc, t } = props;
  return (
    <RestoreTabContainer>
      <RestoreTabItem
        active={type==='phrase'}
        onClick={() => changeFunc('phrase')}
      >
        {t('components.restoreBackup.seed_phrase')}
      </RestoreTabItem>
      {/* <RestoreTabItem
        active={type==='key'}
        onClick={() => changeFunc('key')}
      >
        {t('components.restoreBackup.private_key')}
      </RestoreTabItem> */}
      <RestoreTabItem
        active={type==='key'}
      >
        {t('components.restoreBackup.private_key')}
      </RestoreTabItem>
    </RestoreTabContainer>
  )
}



type Props = {
  importAddress?: () => {},
  t: () => {}
};

class RestoreBackup extends Component<Props> {
  props: Props;
  state = {
    type: 'phrase',
    seeds: [],
    inputValue: '',
    password: '',
    isPassword: false,
    isShowedPwd: false,
    key: ''
  };

  importAddress = () => {
    const { seeds, inputValue, password } = this.state;
    let str = '';
    if (seeds.length) {
      seeds.forEach((item, index)=> {
        if (index) {
          str += ` ${item}`;
        } else {
          str = item;
        }
      });
    }

    if (inputValue) {
      if (seeds.length) {
        str += ` ${inputValue}`;
      } else {
        str = inputValue;
      }
    }
    this.props.importAddress(ADD_ADDRESS_TYPES.RESTORE, str, '', '', '', password);
  };

  onChangeInput = (val) => {
    this.setState({inputValue: val});
  }

  onChangeItems = (items) => {
    this.setState({seeds: items, inputValue: ''});
  }

  render() {
    const { type, seeds, inputValue, password, isPassword, isShowedPwd, key } = this.state;
    const { t } = this.props;
    let isdisabled = false;
    if (type === 'phrase') {
      isdisabled = (!seeds.length && !inputValue) ;
    } else {
      isdisabled = !key;
    }
    return(
      <MainContainer>
        <RestoreHeader>
          {t('components.restoreBackup.restore_from')}
          <RestoreTabs type={type} changeFunc={(type)=> this.setState({type})} t={t} />
        </RestoreHeader>
        {type==='phrase' &&
          <Fragment>
            <SeedInput
              selectedItems={seeds}
              inputValue={inputValue}
              onChangeInput={this.onChangeInput}
              onChangeItems={this.onChangeItems}
            />
            <ToggleContainer>
              <ToggleLabel>
                {t('components.restoreBackup.seed_encrypted_label')}
              </ToggleLabel>
              <ToggleWrapper
                onChange={()=> this.setState({isPassword: !isPassword})}
              />
            </ToggleContainer>

            {isPassword &&
              <PasswordInput
                label={t('components.restoreBackup.seed_phrase_password')}
                isShowed={isShowedPwd}
                password={password}
                changFunc={(newpassword) => this.setState({ password: newpassword })}
                onShow={()=> this.setState({isShowedPwd: !isShowedPwd})}
                containerStyle={{width: '60%'}}
              />
            }
          </Fragment>
        }
        {type==='key' &&
          <TextField
            label={t('components.restoreBackup.enter_private_key')}
            value={key}
            onChange={(newkey) => this.setState({ key: newkey })}
          />

        }
        <RestoreFooter>
          <RestoreButton
            buttonTheme="primary"
            disabled={isdisabled}
            onClick={this.importAddress}
          >
            {t('general.verbs.restore')}
          </RestoreButton>
        </RestoreFooter>
      </MainContainer>
    );
  }
}



function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      importAddress
    },
    dispatch
  );
}

export default compose(wrapComponent, connect(null, mapDispatchToProps))(RestoreBackup);

import { TezosOperations } from 'conseiljs';
import { addMessage } from '../../reducers/message.duck';
import { CONSEIL, TEZOS } from '../../constants/NodesTypes';
import { getSelectedKeyStore } from '../../utils/general'
import { tezToUtez } from '../../utils/currancy';
import { displayError  } from '../../utils/formValidation';

const {
  sendTransactionOperation
} = TezosOperations;

import { getSelectedNode } from '../../utils/nodes';


export function validateAmount( amount, toAddress ) {
  return async (dispatch, state) => {
    const parsedAmount = Number(amount.replace(/\,/g,''));
    const amountInUtez = tezToUtez(parsedAmount);

    const validations = [
      { value: amount, type: 'notEmpty', name: 'Amount'},
      { value: parsedAmount, type: 'validAmount'},
      { value: amountInUtez, type: 'posNum', name: 'Amount'},
      { value: toAddress, type: 'validAddress'}
    ];

    const error = displayError(validations);
    if (error) {
      dispatch(addMessage(error, true));
      return false;
    }

    return true;
  };
}

export function sendTez( password, toAddress, amount, fee ) {
  return async (dispatch, state) => {
    const nodes = state().nodes.toJS();
    const selectedAccountHash = state().wallet.get('selectedAccountHash');
    const selectedParentHash = state().wallet.get('selectedParentHash');
    const identities = state().wallet.get('identities').toJS();
    const walletPassword = state().wallet.get('password');
    const keyStore = getSelectedKeyStore(identities, selectedAccountHash, selectedParentHash);

    if ( password !== walletPassword ) {
      const error = 'Incorrect password';
      dispatch(addMessage(error, true));
      return false;
    }

    if ( toAddress === selectedAccountHash ) {
      const error = 'You cant sent money to yourself.';
      dispatch(addMessage(error, true));
      return false;
    }

    const { url, apiKey } = getSelectedNode(nodes, TEZOS);
    console.log('-debug: - kkkkk - url, apiKey', url, apiKey);
    const res = await sendTransactionOperation(
      url,
      keyStore,
      toAddress,
      tezToUtez(Number(amount.replace(/\,/g,''))),
      fee
    ).catch((err) => {
      err.name = err.message;
      console.error(err);
      dispatch(addMessage(err.name, true));
      return false;
    });

    if ( res ) {
      dispatch(addMessage(
        `Successfully sent send Tez operation ${res.operationGroupID}.`,
        false
      ));
      return true;
    }
    return false;
  };
}
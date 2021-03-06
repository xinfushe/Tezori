import { TezosOperations } from 'conseiljs';
import { updateIdentity } from '../../reduxContent/wallet/actions';
import { addMessage } from '../../reduxContent/message/thunks';
import { displayError } from '../../utils/formValidation';
import { tezToUtez } from '../../utils/currancy';
import { createAccount } from '../../utils/account';
import { findIdentity } from '../../utils/identity';
import { getSelectedNode } from '../../utils/nodes';
import { TEZOS } from '../../constants/NodesTypes';
import { CREATED } from '../../constants/StatusTypes';
import { persistWalletState } from '../../utils/wallet';
import { createTransaction } from '../../utils/transaction';
import { ORIGINATION } from '../../constants/TransactionTypes';

import {
  getSelectedKeyStore,
  fetchAverageFees,
  clearOperationId
} from '../../utils/general';

const { sendOriginationOperation } = TezosOperations;

export function fetchOriginationAverageFees() {
  return async (dispatch, state) => {
    const settings = state().settings.toJS();
    const averageFees = await fetchAverageFees(settings, 'origination');
    return averageFees;
  };
}

export function createNewAccount(
  delegate,
  amount,
  fee,
  passPhrase,
  publicKeyHash
) {
  return async (dispatch, state) => {
    const settings = state().settings.toJS();
    const walletPassword = state().wallet.get('password');
    const identities = state()
      .wallet.get('identities')
      .toJS();
    const parsedAmount = Number(amount.replace(/,/g, '.'));
    const amountInUtez = tezToUtez(parsedAmount);

    const validations = [
      { value: amount, type: 'notEmpty', name: 'amount' },
      { value: parsedAmount, type: 'validAmount' },
      { value: amountInUtez, type: 'posNum', name: 'Amount' },
      { value: passPhrase, type: 'notEmpty', name: 'pass' },
      { value: passPhrase, type: 'minLength8', name: 'Pass Phrase' }
    ];

    const error = displayError(validations);
    if (error) {
      dispatch(addMessage(error, true));
      return false;
    }

    if (passPhrase !== walletPassword) {
      const error = "components.messageBar.messages.incorrect_password";
      dispatch(addMessage(error, true));
      return false;
    }

    const identity = findIdentity(identities, publicKeyHash);
    const keyStore = getSelectedKeyStore(
      identities,
      publicKeyHash,
      publicKeyHash
    );
    const { url, apiKey } = getSelectedNode(settings, TEZOS);
    console.log('-debug: - iiiii - url, apiKey', url, apiKey);
    const newAccount = await sendOriginationOperation(
      url,
      keyStore,
      amountInUtez,
      delegate,
      true,
      true,
      fee
    ).catch(err => {
      const errorObj = { name: err.message, ...err };
      console.error(errorObj);
      dispatch(addMessage(errorObj.name, true));
      return false;
    });

    if (newAccount) {
      const operationResult = newAccount
        && newAccount.results
        && newAccount.results.contents
        && newAccount.results.contents[0]
        && newAccount.results.contents[0].metadata
        && newAccount.results.contents[0].metadata.operation_result;

      if ( operationResult && operationResult.errors && operationResult.errors.length ) {
        const error = "components.messageBar.messages.origination_operation_failed";
        console.error(error);
        dispatch(addMessage(error, true));
        return false;
      }

      const newAccountHash = operationResult.originated_contracts[0];
      const operationId = clearOperationId(newAccount.operationGroupID);

      identity.accounts.push(
        createAccount(
          {
            accountId: newAccountHash,
            balance: amountInUtez,
            manager: publicKeyHash,
            delegateValue: '',
            operations: {
              [CREATED]: operationId
            },
            order: ( identity.accounts.length || 0 ) + 1
          },
          identity
        )
      );

      identity.transactions.push(
        createTransaction({
          delegate,
          kind: ORIGINATION,
          operationGroupHash: operationId,
          source: keyStore.publicKeyHash,
          fee
        })
      );

      dispatch(updateIdentity(identity));

      // todo: add transaction
      dispatch(
        addMessage(
          "components.messageBar.messages.success_address_origination",
          false,
          operationId
        )
      );

      await persistWalletState(state().wallet.toJS());
      return true;
    }

    return false;
  };
}

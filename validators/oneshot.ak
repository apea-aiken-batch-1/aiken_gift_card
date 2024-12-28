use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{OutputReference, Transaction}

pub type Action {
  CheckMint
  CheckBurn
}

validator gift_card(token_name: AssetName, utxo_ref: OutputReference) {
  spend(_d, _r, o_ref: OutputReference, transaction: Transaction) {
    let Transaction { inputs, mint, .. } = transaction

    expect Some(transaction.Input {
      output: transaction.Output {
        address: Address { payment_credential: address.Script(policy_id), .. },
        ..
      },
      ..
    }) = {
      let transaction.Input(output_reference, _) <- list.find(inputs)
      output_reference == o_ref
    }

    [Pair(token_name, -1)] == (
      mint |> assets.tokens(policy_id) |> dict.to_pairs()
    )
  }

  mint(action: Action, policy_id: PolicyId, transaction: Transaction) {
    let Transaction { inputs, mint, .. } = transaction

    expect [Pair(asset_name, amount)] =
      mint |> assets.tokens(policy_id) |> dict.to_pairs()

    expect asset_name == token_name

    when (action, amount) is {
      (CheckMint, 1) ->
        when
          {
            let transaction.Input(output_reference, _) <- list.find(inputs)
            output_reference == utxo_ref
          }
        is {
          Some(_input) -> True
          _ -> fail @"Does NOT consume utxo_ref"
        }

      (CheckBurn, -1) -> True

      _ -> fail @"Invalid (action, amount)"
    }
  }

  else(_) {
    fail
  }
}

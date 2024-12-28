import CreateButton from "./giftCard/CreateButton";
import RedeemButton from "./giftCard/RedeemButton";
import { ActionGroup } from "@/types/action";
import { validators } from "@/plutus.json";
import {
  Address,
  applyDoubleCborEncoding,
  applyParamsToScript,
  Constr,
  Data,
  fromText,
  LucidEvolution,
  mintingPolicyToId,
  PolicyId,
  toUnit,
  TxSignBuilder,
  Validator,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import { network } from "@/config/lucid";

const Script = {
  Spend: applyDoubleCborEncoding(`${validators.find(({ title }) => title === "oneshot.gift_card.spend")?.compiledCode}`),
  Mint: applyDoubleCborEncoding(`${validators.find(({ title }) => title === "oneshot.gift_card.mint")?.compiledCode}`),
};

export default function Dashboard(props: {
  lucid: LucidEvolution;
  address: Address;
  setActionResult: (result: string) => void;
  onError: (error: any) => void;
}) {
  const { lucid, address, setActionResult, onError } = props;

  async function submitTx(tx: TxSignBuilder) {
    const txSigned = await tx.sign.withWallet().complete();
    const txHash = await txSigned.submit();

    return txHash;
  }

  const actions: Record<string, ActionGroup> = {
    GiftCard: {
      mint: async ({ lovelace, tokenName, imageURL }: { lovelace: bigint; tokenName: string; imageURL: string }) => {
        try {
          if (!lovelace) throw "No gift amount! Really?";
          if (!tokenName) throw "No token name! Really?";
          if (!imageURL) throw "No token image! Really?";

          // Convert tokenName to Hex
          const tokenNameHex = fromText(tokenName);

          // await nonceUTxO
          const utxos = await lucid.wallet().getUtxos();
          const utxo = utxos[0];

          const txHash = String(utxo.txHash);
          const txIndex = BigInt(utxo.outputIndex);
          const nonceUTxO = new Constr(0, [txHash, txIndex]);

          // applyParamsToScript
          const giftCardScript = applyParamsToScript(Script.Mint, [tokenNameHex, nonceUTxO]);
          const giftCardValidator: Validator = { type: "PlutusV3", script: giftCardScript };
          const contractAddress = validatorToAddress(network, giftCardValidator);

          // Specify the GiftCard NFT to mint
          const policyID = mintingPolicyToId(giftCardValidator);
          const assetUnit = toUnit(policyID, tokenNameHex);
          const mintedNFT = { [assetUnit]: 1n };

          // Action: Mint
          const mint = new Constr(0, []);
          const redeemer = Data.to(mint);

          // Mint the GiftCard NFT with CIP-25v1 metadata
          const tx = await lucid
            .newTx()
            .collectFrom([utxo])
            .pay.ToAddress(contractAddress, { lovelace })
            .mintAssets(mintedNFT, redeemer)
            .attach.MintingPolicy(giftCardValidator)
            .attachMetadata(721, {
              [policyID]: {
                [tokenName]: {
                  name: tokenName,
                  image: imageURL,
                },
              },
            })
            .complete();

          // Ask the user to sign and submit the transaction
          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },

      burn: async (policyID: PolicyId) => {
        try {
          if (!policyID) throw "No Policy ID";

          // Query Koios for the GiftCard script
          const scriptInfo = await fetch("/koios/script_info?select=bytes", {
            method: "POST",
            headers: { accept: "application/json", "content-type": "application/json" },
            body: JSON.stringify({ _script_hashes: [policyID] }),
          });
          const [{ bytes }] = await scriptInfo.json();

          const giftCardValidator: Validator = { type: "PlutusV3", script: bytes };
          const contractAddress = validatorToAddress(network, giftCardValidator);

          // Query Koios for the GiftCard NFT name
          const policyAssets = await fetch(`/koios/policy_asset_list?select=asset_name&_asset_policy=${policyID}`);
          const [{ asset_name }] = await policyAssets.json();

          // Specify the GiftCard NFT to burn
          const assetUnit = toUnit(policyID, asset_name);
          const burnedNFT = { [assetUnit]: -1n };

          // Action: Burn
          const burn = new Constr(1, []);
          const redeemer = Data.to(burn);

          // Gather UTXOs to collect from [GiftCard Address UTXOs and GiftCard NFT UTxO]
          const utxos = [...(await lucid.utxosAt(contractAddress)), ...(await lucid.utxosAtWithUnit(address, assetUnit))];

          // Collect the gift and burn the token
          const tx = await lucid
            .newTx()
            .collectFrom(utxos, redeemer)
            .attach.SpendingValidator(giftCardValidator)
            .mintAssets(burnedNFT, redeemer)
            .attach.MintingPolicy(giftCardValidator)
            .complete();

          // Ask the user to sign and submit the transaction
          submitTx(tx).then(setActionResult).catch(onError);
        } catch (error) {
          onError(error);
        }
      },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <span>{address}</span>
      <div className="flex flex-wrap gap-2 mb-2">
        <CreateButton onSubmit={actions.GiftCard.mint} />
        <RedeemButton onSubmit={actions.GiftCard.burn} />
      </div>
    </div>
  );
}

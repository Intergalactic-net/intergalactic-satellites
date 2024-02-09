import { MethodFn } from "@kwilteam/extensions";
import * as web3 from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import base64url from "base64url";

async function isSolSigner(
  encodedMsg: string,
  pubKey: string,
  sig: string,
): Promise<boolean> {
  try {
    const message: string = base64url.decode(encodedMsg);
    const isValid: boolean = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(sig),
      bs58.decode(pubKey),
    );
    return isValid;
  } catch (error) {
    return false;
  }
}

async function getSplTokenTransfer(
  sig: string,
  tokenAddr: string,
  from: string,
  to: string,
  amount: number,
): Promise<boolean> {
  try {
    const connection = new web3.Connection(
      web3.clusterApiUrl("mainnet-beta"),
      "finalized",
    );

    const response: any = await connection.getTransaction(sig);
    const message: any = response.transaction.message;
    const meta: any = response.meta;

    const mints: any = meta.postTokenBalances
      .concat(meta.preTokenBalances)
      .flat()
      .map((tx: any) => tx.mint);
    const isTargetMint: boolean = mints.every(
      (element: any) => element === tokenAddr,
    );

    if (!isTargetMint) {
      throw new Error(`ERR_INVALID_TOKEN_ADDR`);
    }

    console.log(mints, isTargetMint);

    const addr1Pre: any = meta.preTokenBalances.find(
      (tx: any) => tx.owner === from,
    );
    const addr1Post: any = meta.postTokenBalances.find(
      (tx: any) => tx.owner === from,
    );
    const addr1Net: any =
      addr1Post.uiTokenAmount.uiAmount - addr1Pre.uiTokenAmount.uiAmount;

    const addr2Pre: any = meta.preTokenBalances.find(
      (tx: any) => tx.owner === to,
    );
    const addr2Post: any = meta.postTokenBalances.find(
      (tx: any) => tx.owner === to,
    );
    const addr2Net: any =
      addr2Post.uiTokenAmount.uiAmount - addr2Pre.uiTokenAmount.uiAmount;

    const isValid =
      addr2Net >= addr1Net && addr2Net >= amount && addr1Net * -1 >= amount;

    return isValid;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// extension methods
export const verifySolSig: MethodFn = async ({ metadata, inputs }) => {
  const network = metadata["network"];

  if (!["solana", "*"].includes(network)) {
    throw new Error("invalid network for the orb method");
  }

  const encodedMsg = inputs[0].toString();
  const pubKey = inputs[1].toString();
  const sig = inputs[2].toString();
  const isValid: boolean = await isSolSigner(encodedMsg, pubKey, sig);
  return isValid ? 1 : 0;
};

export const verifySplTransfer: MethodFn = async ({ metadata, inputs }) => {
  const network = metadata["network"];
  const tokenAddr = metadata["token_address"];

  if (!["solana", "*"].includes(network)) {
    throw new Error("invalid network for the orb method");
  }

  if (!tokenAddr) {
    throw new Error("missing token address");
  }

  const from = inputs[0].toString();
  const to = inputs[1].toString();
  const sig = inputs[2].toString();
  const amount = Number(inputs[3].toString());

  const isValid: boolean = await getSplTokenTransfer(
    sig,
    tokenAddr,
    from,
    to,
    amount,
  );
  return isValid ? 1 : 0;
};

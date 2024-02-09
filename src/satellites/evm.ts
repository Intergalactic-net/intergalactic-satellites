import { MethodFn } from "@kwilteam/extensions";
import { ethers } from "ethers";
import base64url from "base64url";
import assert from "node:assert";

export async function isEvmSigner(
  message: string,
  address: string,
  signature: string,
): Promise<boolean> {
  try {
    _checkEvmAddrSyntax(address);
    const originalMessage = base64url.decode(message);
    const signer = await ethers.utils.verifyMessage(originalMessage, signature);
    assert.equal(ethers.utils.getAddress(address), signer);
    return true;
  } catch (error) {
    return false;
  }
}

function _checkEvmAddrSyntax(address: string): any {
  try {
    assert.equal(/^0x[a-fA-F0-9]{40}$/.test(address), true);
  } catch (error) {
    return error;
  }
}

export const verifyEvmSig: MethodFn = async ({ metadata, inputs }) => {
  const network = metadata["network"];

  if (!["evm", "*"].includes(network)) {
    throw new Error("invalid network for the orb method");
  }

  const encodedMsg = inputs[0].toString();
  const pubKey = inputs[1].toString();
  const sig = inputs[2].toString();
  const isValid: boolean = await isEvmSigner(encodedMsg, pubKey, sig);
  return isValid ? 1 : 0;
};

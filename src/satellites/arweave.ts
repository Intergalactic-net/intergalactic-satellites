import { MethodFn } from "@kwilteam/extensions";
import { webcrypto } from "crypto";
import assert from "node:assert";

async function verifyArweaveSignature(
  pubkey: string,
  message: string,
  signature: string,
): Promise<boolean> {
  /** This is where we start the verification **/
  // hash the message (we used the default signMessage() options
  // so the extension hashed the message using "SHA-256"

  const encodedMessage: any = new TextEncoder().encode(message);

  const hash = await webcrypto.subtle.digest("SHA-256", encodedMessage);

  const publicJWK = {
    e: "AQAB",
    ext: true,
    kty: "RSA",
    n: pubkey,
  };

  // import public jwk for verification
  const verificationKey = await webcrypto.subtle.importKey(
    "jwk",
    publicJWK,
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );

  const decryptedSig = Buffer.from(signature, "base64");
  const encryptedSig = new Uint8Array(decryptedSig);

  // verify the signature by matching it with the hash
  const isValidSignature = await webcrypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    verificationKey,
    encryptedSig,
    hash,
  );

  return isValidSignature;
}

async function isArSigner(
  message: string,
  pubkey: string,
  signature: string,
): Promise<boolean> {
  try {
    const originalPubkey = atob(pubkey);
    const originalMessage = atob(message);
    // Due to the original base64 encryption, it contains slashes.
    // Please encode the signature into base64 twice.
    const originalSignature = atob(signature);

    const result = await verifyArweaveSignature(
      originalPubkey,
      originalMessage,
      originalSignature,
    );
    assert.equal(result, true);
    return true;
  } catch (error) {
    return false;
  }
}

export const verifyArweaveSig: MethodFn = async ({ metadata, inputs }) => {
  const network = metadata["network"];

  if (!["arweave", "*"].includes(network)) {
    throw new Error("invalid network for the orb method");
  }

  const message = inputs[0].toString();
  const pubkey = inputs[1].toString();
  const sig = inputs[2].toString();

  const isValid: boolean = await isArSigner(message, pubkey, sig);
  return isValid ? 1 : 0;
};

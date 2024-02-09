import { ExtensionBuilder, InitializeFn, MethodFn } from "@kwilteam/extensions";

import { verifySolSig, verifySplTransfer } from "./satellites/solana";
import { verifyEvmSig } from "./satellites/evm";
import { verifyNearSig } from "./satellites/near";
import { verifyArweaveSig } from "./satellites/arweave";

const initialize: InitializeFn = async (metadata: Record<string, string>) => {
  if (!metadata["network"]) {
    throw new Error("A signer network must be provided");
  }

  return metadata;
};

function buildServer(): void {
  const server = new ExtensionBuilder()
    .named("intersigners")
    .withInitializer(initialize)
    .withMethods({
      verifySolSig,
      verifyEvmSig,
      verifyNearSig,
      verifyArweaveSig,
      verifySplTransfer,
    })
    .build();

  process.on("SIGINT", () => {
    server.stop();
  });

  process.on("SIGTERM", () => {
    server.stop();
  });
}

buildServer();
